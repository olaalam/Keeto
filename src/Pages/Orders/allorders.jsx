import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { User, Phone, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReasonDialog from "../../components/ReasonDialog";

const orderStatuses = [
  "pending",
  "accepted",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund",
];

const formatStatusLabel = (status = "") =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function Order() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState("");
  // Holds which order the cancel-reason dialog is currently open for.
  // Needs both restaurantId and orderId since the update endpoint is
  // scoped per-restaurant: /api/superadmin/order/{restaurantId}/{orderId}/status
  const [dialogConfig, setDialogConfig] = useState({
    open: false,
    restaurantId: null,
    orderId: null,
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["superadmin-orders"],
    queryFn: async () => {
      const res = await api.get(`/api/superadmin/order/all`);
      return res.data.data.data;
    },
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
      queryClient.invalidateQueries(["superadmin-orders"]);
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

  const handleStatusChange = (restaurantId, orderId, newStatus) => {
    if (newStatus === "cancelled") {
      setDialogConfig({ open: true, restaurantId, orderId });
    } else {
      updateStatusMutation.mutate({ restaurantId, orderId, status: newStatus });
    }
  };

  const columns = [
    {
      accessorKey: "dailyOrderNumber",
      header: "Order Number",
      cell: ({ row }) => (
        <span className="font-medium text-gray-700">
          {row.getValue("dailyOrderNumber")}
        </span>
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
      accessorKey: "orderStatus",
      header: "Status",
      cell: ({ row }) => (
        <Select
          defaultValue={row.original.orderStatus}
          onValueChange={(value) =>
            handleStatusChange(
              row.original.restaurantId,
              row.original.internalId,
              value,
            )
          }
          disabled={
            updateStatusMutation.isPending &&
            updateStatusMutation.variables?.orderId === row.original.internalId
          }
        >
          <SelectTrigger className="w-[170px] h-9">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {orderStatuses.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {formatStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
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
      ),
    },
  ];

  const filteredOrders = useMemo(() => {
    if (!selectedDate) return orders;
    return orders.filter((order) => {
      if (!order.orderDate) return false;
      const orderDate = new Date(order.orderDate).toISOString().split("T")[0];
      return orderDate === selectedDate;
    });
  }, [orders, selectedDate]);

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <label className="text-sm font-bold text-slate-700">
          Filter by Date:
        </label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48 h-10"
        />
        <Button
          variant="outline"
          onClick={() => setSelectedDate("")}
          className="h-10"
        >
          Clear Filter
        </Button>
      </div>

      <GenericDataTable
        title="Orders Management"
        columns={columns}
        data={filteredOrders}
        isLoading={isLoading}
        queryKey="superadmin-orders"
        actions={false}
      />

      {/* Cancel-reason dialog — reasons pulled from the superadmin endpoint */}
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
        title="Cancel Order"
        reasonsUrl="/api/superadmin/order/reasons"
        reasonsQueryKey="superadmin-order-reasons"
      />
    </div>
  );
}
