// Inside policy.jsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";

export default function Policy() {
  const navigate = useNavigate();

  const { data: Policy = [], isLoading } = useQuery({
    queryKey: ["Policy"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/policy");
      return res.data.data.data;
    },
  });

  const columns = [
    { accessorKey: "title", header: "Title" },
    { accessorKey: "description", header: "Description" },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Policy"
        columns={columns}
        data={Policy}
        isLoading={isLoading}
        queryKey="Policy"
        // REMOVED the leading slash to keep it relative to the parent context if needed,
        // or explicitly ensuring your absolute path matches your parent configuration.
        onEdit={(policy) => {
          navigate(`/policy/edit/${policy.id}`);
        }}
      />
    </div>
  );
}
