import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";

export default function Users() {
  const navigate = useNavigate();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/keeto-users");
      return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
    },
  });

  const columns = [
    { accessorKey: "name", header: "name" },

    {
      accessorKey: "photo", // التأكد من مطابقة الاسم الراجع من الـ API (حرف I كبير)
      header: "Image",
      cell: ({ row }) => {
        const imageStr = row.getValue("photo");
        return (
          <div className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100">
            {imageStr ? (
              <img
                src={imageStr}
                alt="category"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] text-gray-400">
                No Image
              </div>
            )}
          </div>
        );
      },
    },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ getValue }) => getValue() || "—", // لو مفيش رقم تليفون هيظهر الرمز ده
    },

    {
      accessorKey: "status",
      header: "status",
      // 💡 قمنا بحذف الـ cell بالكامل هنا لكي يتولى GenericDataTable توليد الـ Switch تلقائياً
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Users"
        columns={columns}
        data={users}
        isLoading={isLoading}
        queryKey="users"
        deleteApiUrl="/api/superadmin/keeto-users"
        editApiUrl="/api/superadmin/keeto-users"
      /*   onEdit={(user) => navigate(`/users/edit/${user.id}`)} */
      />
    </div>
  );
}
