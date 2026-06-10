import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate, useParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch"; // تأكدي من مسار المكون في مشروعك

export default function Transaction() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { restaurantId } = useParams();

  // 1. جلب البيانات
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await api.get(
        `/api/superadmin/wallets/transactions/${restaurantId}`,
      );
      return res.data?.data?.data || res.data?.data || [];
    },
  });

  // 2. دالة تحديث الحالة (Mutation)
  // const updateStatusMutation = useMutation({
  //     mutationFn: async ({ id, currentStatus }) => {
  //         // استخدام الـ API الذي حددتِه (patch)
  //         return await api.patch(`/api/superadmin/basiccampaign/${id}/status`);
  //     },
  //     onSuccess: () => {
  //         toast.success("Status updated successfully");
  //         // إعادة جلب البيانات لتحديث الجدول
  //         queryClient.invalidateQueries(['business-plans']);
  //     },
  //     onError: () => {
  //         toast.error("Failed to update status");
  //     }
  // });

  const columns = [
    { accessorKey: "reference", header: "Reference" },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "method", header: "Method" },
    { accessorKey: "amount", header: "Amount" },
    { accessorKey: "balanceBefore", header: "Balance Before" },
    { accessorKey: "balanceAfter", header: "Balance After" },
    { accessorKey: "note", header: "Note" },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    // عمود الحالة القديم (متروك كتعليق في حال احتجت لتفعيله وتعديله لاحقاً للمبيعات/المعاملات)
    // {
    //     accessorKey: 'status',
    //     header: 'Status',
    //     cell: ({ row }) => (
    //         <div className="flex items-center justify-center">
    //             <Switch
    //                 checked={row.original.status === 'active' || row.original.status === true}
    //                 onCheckedChange={() =>
    //                     updateStatusMutation.mutate({
    //                         id: row.original.id,
    //                         currentStatus: row.original.status
    //                     })
    //                 }
    //                 disabled={updateStatusMutation.isPending}
    //             />
    //         </div>
    //     )
    // },
  ];
  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Transactions"
        columns={columns}
        data={transactions}
        isLoading={isLoading}
        queryKey="transactions"
        actions={false} // لا توجد إجراءات حالياً، يمكنك إضافة أزرار التحرير أو الحذف هنا إذا لزم الأمر
        // deleteApiUrl="/api/superadmin/wallets/transactions"
        // onAdd={() => navigate(`/restaurants/transaction/${restaurantId}/add`)}
        // onEdit={(transaction) => navigate(`/restaurants/transaction/${restaurantId}/edit`)}
      />
    </div>
  );
}
