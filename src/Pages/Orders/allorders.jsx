import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { User, Phone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  out_for_delivery: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refund: "bg-pink-100 text-pink-700",
  rejected: "bg-gray-200 text-gray-700",
};

const formatStatusLabel = (status = "") =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function Order() {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["superadmin-orders"],
    queryFn: async () => {
      const res = await api.get(`/api/superadmin/order/all`);
      return res.data.data.data;
    },
  });

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
      cell: ({ row }) => {
        const status = row.original.orderStatus;
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || "bg-gray-100 text-gray-700"}`}
          >
            {formatStatusLabel(status)}
          </span>
        );
      },
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
    </div>
  );
}
