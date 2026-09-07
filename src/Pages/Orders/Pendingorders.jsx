import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { User, Phone, Eye, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReasonDialog from "../../components/ReasonDialog";

// This page is a dedicated view for orders that are still "pending".
// It reuses the same GET /api/superadmin/order/all endpoint as the
// full orders table, but always sends status=pending, and swaps the
// per-row status <Select> for two quick-action buttons (Accept /
// Reject) since that's the only decision a pending order needs.

export default function PendingOrders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Holds which order the reject-reason dialog is currently open for.
  // Needs both restaurantId and orderId since the update endpoint is
  // scoped per-restaurant: /api/superadmin/order/{restaurantId}/{orderId}/status
  const [dialogConfig, setDialogConfig] = useState({
    open: false,
    restaurantId: null,
    orderId: null,
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["superadmin-orders-pending", startDate, endDate],
    queryFn: async () => {
      const res = await api.get(`/api/superadmin/order/all`, {
        params: {
          status: "pending",
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      return res.data.data.data;
    },
    keepPreviousData: true,
    // Pending orders change often, so refetch a bit more eagerly than
    // the general orders table.
    refetchInterval: 15000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ restaurantId, orderId, status, cancelReasonId }) => {
      const payload = { status };
      if (cancelReasonId) payload.cancelReasonId = cancelReasonId;
      const { data } = await api.put(
        `/api/superadmin/order/${restaurantId}/${orderId}/status`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superadmin-orders-pending"]);
      toast.success("Order status updated successfully");
      setDialogConfig({ open: false, restaurantId: null, orderId: null });
    },
    onError: (error) => {
      const serverErrorMessage =
        error?.response?.data?.error?.message || "Failed to update status";
      toast.error(serverErrorMessage);
      console.error("Update Error:", error);
    },
  });

  const handleAccept = (restaurantId, orderId) => {
    updateStatusMutation.mutate({ restaurantId, orderId, status: "accepted" });
  };

  const handleReject = (restaurantId, orderId) => {
    setDialogConfig({ open: true, restaurantId, orderId });
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  const isRowPending = (orderId) =>
    updateStatusMutation.isPending &&
    updateStatusMutation.variables?.orderId === orderId;

  const columns = [
    {
      accessorKey: "dailyOrderNumber",
      header: "Order Number",
      cell: ({ row }) => (
        <button
          onClick={() =>
            navigate(
              `/ordersreport/details/${row.original.restaurantId}/${row.original.internalId}`,
            )
          }
          className="font-medium text-blue-700"
        >
          {row.getValue("dailyOrderNumber")}
        </button>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer Info",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 font-medium text-gray-800">
            <User size={14} className="text-gray-500" />
            {row.original.customerName || "-"}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Phone size={12} />
            {row.original.customerPhone || "-"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "restaurantName",
      header: "Restaurant",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.restaurantName}
        </span>
      ),
    },
    {
      accessorKey: "orderType",
      header: "Order Type",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs capitalize ${
            row.original.orderType === "delivery"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {row.original.orderType}
        </span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total Amount",
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          {row.original.totalAmount} EGP
        </span>
      ),
    },
    {
      accessorKey: "orderDate",
      header: "Date & Time",
      cell: ({ row }) => {
        const date = new Date(row.original.orderDate);
        return (
          <div className="flex flex-col text-sm">
            <span>{date.toLocaleDateString()}</span>
            <span className="text-xs text-gray-500">
              {date.toLocaleTimeString()}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const pending = isRowPending(row.original.internalId);
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-50"
              disabled={pending}
              onClick={() =>
                handleAccept(row.original.restaurantId, row.original.internalId)
              }
            >
              <Check size={16} className="mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-600 text-red-700 hover:bg-red-50"
              disabled={pending}
              onClick={() =>
                handleReject(row.original.restaurantId, row.original.internalId)
              }
            >
              <X size={16} className="mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="hover:bg-primary/10 text-primary"
              onClick={() =>
                navigate(
                  `/ordersreport/details/${row.original.restaurantId}/${row.original.internalId}`,
                )
              }
            >
              <Eye size={18} />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">From:</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-44 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">To:</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-44 h-10"
          />
        </div>

        {(startDate || endDate) && (
          <Button variant="outline" onClick={clearFilters} className="h-10">
            Clear Filters
          </Button>
        )}

        <span className="ml-auto text-sm text-slate-500">
          {orders.length} pending order{orders.length === 1 ? "" : "s"}
        </span>
      </div>

      <GenericDataTable
        title="Pending Orders"
        columns={columns}
        data={orders}
        isLoading={isLoading}
        queryKey="superadmin-orders-pending"
        actions={false}
      />

      {/* Reject dialog — reasons pulled from the superadmin endpoint,
          rejecting a pending order sets status to "cancelled" */}
      <ReasonDialog
        isOpen={dialogConfig.open}
        onClose={() =>
          setDialogConfig({ open: false, restaurantId: null, orderId: null })
        }
        onConfirm={(cancelReasonId) =>
          updateStatusMutation.mutate({
            restaurantId: dialogConfig.restaurantId,
            orderId: dialogConfig.orderId,
            status: "cancelled",
            cancelReasonId,
          })
        }
        title="Reject Order"
        reasonsUrl="/api/superadmin/order/reasons"
        reasonsQueryKey="superadmin-order-reasons"
      />
    </div>
  );
}
