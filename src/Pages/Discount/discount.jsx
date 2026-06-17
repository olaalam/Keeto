import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch"; // تأكدي من مسار الـ Switch في مشروعك
import { useUpdate } from "@/hooks/useUpdate"; // تأكدي من تغيير المسار لمكان الـ hook الصح عندك

export default function Discount() {
  const navigate = useNavigate();

  // جلب البيانات
  const { data: discount = [], isLoading } = useQuery({
    queryKey: ["discount"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/discounts");
      return res.data.data.data;
    },
  });

  // دالة مساعدة لتنسيق الوقت والتاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "nameAr", header: "Name (AR)" },
    { accessorKey: "nameFr", header: "Name (FR)" },

    // تعديل المفتاح ليطابق الـ API
    { accessorKey: "discountType", header: "Discount Type" },
    { accessorKey: "discountValue", header: "Value" },
    { accessorKey: "minOrderAmount", header: "Min Order" },

    // حقول التواريخ الجاهزة بالفورمات الخاص بك
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => formatDate(row.getValue("startDate")),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => formatDate(row.getValue("endDate")),
    },

    // يمكنك إضافة حالة الخصم كـ ميزة إضافية
    {
      accessorKey: "status",
      header: "status",
      // 💡 قمنا بحذف الـ cell بالكامل هنا لكي يتولى GenericDataTable توليد الـ Switch تلقائياً
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Discount"
        columns={columns}
        data={discount}
        isLoading={isLoading}
        queryKey="discount"
        deleteApiUrl="/api/superadmin/discounts"
        editApiUrl="api/superadmin/discounts"
           onAdd={() => navigate("/discounts/add")}
        onEdit={(discount) => navigate(`/discounts/edit/${discount.id}`)}
      />
    </div>
  );
}
