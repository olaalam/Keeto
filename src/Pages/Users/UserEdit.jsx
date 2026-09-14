import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useUpdate } from "@/hooks/useUpdate";

const userFields = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "phone", label: "Phone", type: "text", required: false },
  {
    name: "alternatePhone",
    label: "Alternate Phone",
    type: "text",
    required: false,
  },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: [
      { label: "Active", value: "active" },
      { label: "Blocked", value: "blocked" },
    ],
  },
  { name: "photo", label: "Photo", type: "file", required: false },
];

export default function UserEdit() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const updateUserMutation = useUpdate("/api/superadmin/keeto-users", "users");

  const { data: userData, isLoading: isFetching } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const res = await api.get(`/api/superadmin/keeto-users/${id}`);
      return res.data?.data?.data || res.data?.data || res.data;
    },
    enabled: !!id && !state?.userData,
  });

  const initialData = state?.userData || userData;

  if (id && isFetching) return <LoadingSpinner />;

  return (
    <div className="container mx-auto py-10">
      <AddPage
        title="User"
        apiUrl="/api/superadmin/keeto-users"
        queryKey="users"
        method="PUT"
        fields={userFields}
        initialData={initialData}
        bypassIdInEdit={true}
        transformPayload={(data) => ({
          name: data.name,
          phone: data.phone,
          alternatePhone: data.alternatePhone,
          status: data.status,
          photo: data.photo || null,
          email: data.email,
        })}
        customSubmit={async (payloadToSend) => {
          const userId = id || initialData?.id || initialData?._id;
          return await updateUserMutation.mutateAsync({
            id: userId,
            payload: payloadToSend,
            customUrl: `/api/superadmin/keeto-users/${userId}`,
          });
        }}
        onSuccessAction={() => navigate(-1)}
      />
    </div>
  );
}
