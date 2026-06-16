import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";

export default function Reasons() {
  const navigate = useNavigate();

  const { data: reasons= [], isLoading } = useQuery({
    queryKey: ["reasons"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/select-reasons");
      return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
    },
  });

  const columns = [
    { accessorKey: "name", header: "Name" },

    { accessorKey: "type", header: "Type" },
    {
      accessorKey: "status",
      header: "status",
     
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Reasons"
        columns={columns}
        data={reasons}
        isLoading={isLoading}
        queryKey="reasons"
        deleteApiUrl="/api/superadmin/select-reasons"
        editApiUrl="/api/superadmin/select-reasons"
        onAdd={() => navigate("/reasons/add")}
        onEdit={(reasons) => navigate(`/reasons/edit/${reasons.id}`)}
      />
    </div>
  );
}
