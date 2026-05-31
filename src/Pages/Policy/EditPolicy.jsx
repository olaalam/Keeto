import React from "react";
import { useParams, useLocation } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";

// Shadcn UI Components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EditPolicy = () => {
  const { id } = useParams(); // Retrieves the policyId from the route params
  const { state } = useLocation();

  // Fetch single policy data for editing if not already passed in history state
  const { data: policyData, isLoading: isFetching } = useQuery({
    queryKey: ["Policy", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/policy/${id}`);
      // Adjust according to your exact API structure (e.g., data.data or data.data.data)
      console.log("RAW API RESPONSE:", data);
      return data?.data?.data?.[0] || data?.data || data;
    },
    enabled: !!id && !state?.policyData,
  });

  const rawData = state?.policyData || policyData;

  // Prepare and sanitize initial data for react-hook-form
  const initialData = React.useMemo(() => {
    if (!rawData) return null;

    return {
      id: rawData.id, // AddPage checks !!initialData?.id to decide PUT vs POST
      title: rawData.title || "",
      description: rawData.description || "",
    };
  }, [rawData]);

  // Show spinner while fetching existing policy details
  if (!initialData) return <LoadingSpinner />;

  return (
    <AddPage
      title=" Policy"
      apiUrl={`/api/superadmin/policy`} // Put/Patch request endpoint
      queryKey="Policy"
      fields={[]} // Empty array since we build the layout manually inside the render prop
      initialData={initialData}
      onSuccessAction={() => {
        window.history.back();
      }}
    >
      {(methods) => {
        const {
          register,
          formState: { errors },
        } = methods;

        return (
          <div className="space-y-4 mt-4 max-w-xl">
            {/* 1. Policy Title Field */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Policy Title *</Label>
              <Input
                type="text"
                {...register("title", { required: "Policy title is required" })}
                placeholder="e.g., Return and Refund Policy"
                className="h-9 text-xs rounded-md"
              />
              {errors.title && (
                <span className="text-[11px] text-red-500">
                  {errors.title.message}
                </span>
              )}
            </div>

            {/* 2. Policy Description Field */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Description *</Label>
              <Textarea
                {...register("description", {
                  required: "Description is required",
                })}
                placeholder="Write your policy description details here..."
                className="min-h-[150px] text-xs rounded-md resize-y"
              />
              {errors.description && (
                <span className="text-[11px] text-red-500">
                  {errors.description.message}
                </span>
              )}
            </div>
          </div>
        );
      }}
    </AddPage>
  );
};

export default EditPolicy;
