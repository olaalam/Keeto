import React from "react";
import { useParams, useNavigate } from "react-router-dom"; // تأكدي من دمجهم في سطر واحد أفضل
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";

export default function Invoice() {
const { id: restaurantId } = useParams(); 
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1. جلب البيانات والتأكد من مسار الـ Array الراجع من الـ API
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", restaurantId],
    queryFn: async () => {
      const res = await api.get(`/api/superadmin/report/${restaurantId}/invoice`);
      console.log("Invoice API Response:", res.data);
      
      // بناءً على تصميم الـ Admin الخاص بكي، الـ API بيرجع الـ array داخل data.data.data
      return res.data?.data?.data || res.data?.data || [];
    },
    enabled: !!restaurantId, // الـ Query مش هتشتغل غير لو الـ restaurantId موجود في الـ URL
  });

  // 2. تغيير حالة الفاتورة إلى مدفوعة
  const { mutate: markAsPaid } = useMutation({
    mutationFn: async (invoiceId) => {
      return await api.put(`/api/superadmin/report/invoice/${invoiceId}/mark-paid`);
    },
    onSuccess: () => {
      // عمل تحديث تلقائي للجدول بمجرد نجاح العملية
      queryClient.invalidateQueries(["invoices", restaurantId]);
    },
  });

  // 3. تعريف الأعمدة
  const columns = [
    { accessorKey: "startDate", header: "Start Date" },
    { accessorKey: "endDate", header: "End Date" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isPaid = row.original.status === "paid" || row.original.status === "Paid";
        
        // تنبيه: تأكدي أن الـ ID في الـ API اسمه id وليس _id مثلاً
        const currentInvoiceId = row.original.id || row.original._id; 

        return (
          <div className="flex items-center gap-2">
            <button
              disabled={isPaid}
              onClick={() => markAsPaid(currentInvoiceId)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isPaid
                  ? "bg-green-100 text-green-700 cursor-not-allowed"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer"
              }`}
              title={isPaid ? "Paid" : "Click to mark as paid"}
            >
              {isPaid ? "Paid" : "Unpaid (Mark Paid)"}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Restaurant Invoices"
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        queryKey={["invoices", restaurantId]}
        actions={false}
        // تعديل مسار الـ navigate لتبدأ بـ / حتى لا تضيف المسار فوق المسار الحالي بشكل خاطئ
        onAdd={() => navigate("/restaurants/invoice/add")} 
      />
    </div>
  );
}