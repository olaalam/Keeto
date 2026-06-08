import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";

export default function PaymentMethod() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch data from backend
  const { data: paymentMethods = [], isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/payment-methods");
      return res.data.data.data;
    },
  });

  // 2. Mutation to switch status using strict 0 / 1 values
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, nextStatus }) => {
    
      const res = await api.put(`/api/superadmin/payment-methods/${id}`, {
        isActive: nextStatus,
      });
      return res.data;
    },

    // Optimistic UI updates to modify the layout state instantly when clicked
    onMutate: async ({ id, nextStatus }) => {
      await queryClient.cancelQueries(["payment-methods"]);
      const previousMethods = queryClient.getQueryData(["payment-methods"]);

      queryClient.setQueryData(["payment-methods"], (oldData) => {
        if (!oldData) return [];
        return oldData.map((method) =>
          method.id === id ? { ...method, isActive: nextStatus } : method,
        );
      });

      return { previousMethods };
    },
    onError: (err, variables, context) => {
      if (context?.previousMethods) {
        queryClient.setQueryData(["payment-methods"], context.previousMethods);
      }
    },
    onSuccess: () => {},
    onSettled: () => {
      queryClient.invalidateQueries(["payment-methods"]);
    },
  });

  const columns = [
    { accessorKey: "name", header: "name" },
    { accessorKey: "nameAr", header: "nameAr" },
    
   /*  {
      accessorKey: "Image",
      header: "Image",
      cell: ({ row }) => {
        const imageStr = row.getValue("Image");
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
    }, */
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const record = row.original;
        const currentVal = record.isActive;

        // Flexible check for whether backend values return as strings, numbers or true booleans
        const isTrue =
          currentVal === true ||
          currentVal === "true" ||
          currentVal === 1 ||
          currentVal === "1";

        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // Prevents table row click navigation actions

              const targetNumericStatus = isTrue ? false : true;

              toggleStatusMutation.mutate({
                id: record.id,
                nextStatus: targetNumericStatus,
              });
            }}
            className={`px-3 py-1 text-xs font-bold rounded-full border transition-all cursor-pointer shadow-sm active:scale-95 ${
              isTrue
                ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
            }`}
          >
            {isTrue ? "Active" : "Inactive"}
          </button>
        );
      },
    },
    
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="paymentMethods"
        columns={columns}
        data={paymentMethods}
        isLoading={isLoading}
        actions={false}
        queryKey="paymentMethods"
        deleteApiUrl="/api/superadmin/payment-methods"
       /*  onAdd={() => navigate("/payment-methods/add")} */
       /*  onEdit={(paymentMethod) =>
          navigate(`/payment-methods/edit/${paymentMethod.id}`)
        } */
      />
    </div>
  );
}
