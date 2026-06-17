import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch"; // تأكدي من مسار الـ Switch في مشروعك
import { useUpdate } from "@/hooks/useUpdate"; // تأكدي من تغيير المسار لمكان الـ hook الصح عندك

export default function Cuppon() {
  const navigate = useNavigate();

  // جلب البيانات
  const { data: Cuppon = [], isLoading } = useQuery({
    queryKey: ["cuppon"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/coupons");
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
    { accessorKey: "code", header: "Coupon Code" },

    { accessorKey: "name", header: "Name" },
    { accessorKey: "nameAr", header: "Name (AR)" },
    { accessorKey: "nameFr", header: "Name (FR)" },

    { accessorKey: "discountType", header: "Discount Type" },
    { accessorKey: "discountValue", header: "Value" },
    { accessorKey: "minOrderAmount", header: "Min Order" },

    // حقول التواريخ
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
        title="Coupons"
        columns={columns}
        data={Cuppon}
        isLoading={isLoading}
        queryKey="cuppon"
        deleteApiUrl="/api/superadmin/coupons"
        editApiUrl="/api/superadmin/coupons"
        onAdd={() => navigate("/coupons/add")}
        onEdit={(cuppon) => navigate(`/coupons/edit/${cuppon.id}`)}
      />
    </div>
  );
}
