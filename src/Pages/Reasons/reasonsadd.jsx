import React from "react";
import { useParams, useLocation } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";

const ReasonAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();

  const { data: Reasons, isLoading: isFetching } = useQuery({
    queryKey: ["reason", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/select-reasons/${id}`);
      return data.data.data;
    },
    enabled: !!id && !state?.Reasons,
  });

  // 👈 الحل هنا: نضمن إن الـ initialData تكون Flat ومفيهاش أوبجكتس متداخلة
  const rawData = state?.Reasons || Reasons;

  const initialData = rawData
    ? {
        id: rawData.id, // مهم
        name:
          typeof rawData.name === "object" ? rawData.name.name : rawData.name,
        type:
          typeof rawData.type === "object" ? rawData.type.type : rawData.type,
      }
    : undefined;

  const reasonFields = [
    { name: "name", label: "name", required: true },
    {
      name: "type",
      label: "type",
      type: "select",
      required: true,
      options: [
        { label: "User", value: "user" },
        { label: "Restaurant", value: "restaurant" },
      ],
    },
  ];

  if (id && isFetching) return <LoadingSpinner />;

  return (
    <AddPage
      title="Reason"
      apiUrl="/api/superadmin/select-reasons"
      queryKey="reason"
      fields={reasonFields}
      initialData={initialData} // الـ داتا هنا هتروح نظيفة وجاهزة للملء
      onSuccessAction={() => {
        window.history.back();
      }}
    />
  );
};

export default ReasonAdd;
