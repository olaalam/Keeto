// Inside policy.jsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";

export default function Sales() {
  const navigate = useNavigate();

  const { data: Sales = [], isLoading } = useQuery({
    queryKey: ["Sales"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/sales");
      return res.data.data.data;
    },
  });

  const columns = [
    { accessorKey: "name", header: "Name" },
    /* { accessorKey: "phone", header: "Phine" },
    { accessorKey: "email", header: " Email" }, */
    { accessorKey: "points", header: "Points" },
    {
      accessorKey: "status",
      header: "status",
      // 💡 قمنا بحذف الـ cell بالكامل هنا لكي يتولى GenericDataTable توليد الـ Switch تلقائياً
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Sales"
        columns={columns}
        data={Sales}
        isLoading={isLoading}
        editApiUrl="api/superadmin/sales"
        queryKey="Sales"
        deleteApiUrl="api/superadmin/sales"
        onAdd={() => navigate("/sales/add")}
        onEdit={(sales) => {
          navigate(`/sales/edit/${sales.id}`);
        }}
      />
    </div>
  );
}
