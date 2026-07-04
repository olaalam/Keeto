import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";

export default function Branches() {
  const navigate = useNavigate();

  const { data: Branches = [], isLoading } = useQuery({
    queryKey: ["Branches"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/branches");
      return res.data.data.data;
    },
  });

  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "nameAr", header: "Name (Arabic)" },
    { accessorKey: "nameFr", header: "Name(Franko)" },
    { accessorKey: "restaurantName", header: "restaurant Name" },
    {
      accessorKey: "status",
      header: "status",
      // 💡 قمنا بحذف الـ cell بالكامل هنا لكي يتولى GenericDataTable توليد الـ Switch تلقائياً
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Branches"
        columns={columns}
        data={Branches}
        isLoading={isLoading}
        queryKey="Branches"
        deleteApiUrl="/api/superadmin/branches"
      
        onAdd={() => navigate("/branches/add")}
        onEdit={(branche) => navigate(`/branches/edit/${branche.id}`)}
      />
    </div>
  );
}
