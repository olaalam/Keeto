import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate, useParams } from "react-router-dom";
import {
  DollarSign,
  Wallet,
  ArrowDownCircle,
  BadgeCheck,
  Eye,
} from "lucide-react";

export default function Order() {
  const navigate = useNavigate();
  const { restaurantId } = useParams();

  console.log(restaurantId);

  // 1. جلب بيانات الطلبات (استخدام useQuery العادي)
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get(`/api/superadmin/order/${restaurantId}`);
      console.log(res.data.data.data);

      return res.data.data.data;
    },
  });

  // 2. تعريف أعمدة الجدول
  const columns = [
    {
      accessorKey: "orderId",
      header: "Order Number",
      cell: ({ row }) => (
        <span className="text-blue-600 hover:underline font-medium text-left">
          {row.getValue("orderId")}
        </span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer Name",
      cell: ({ row }) => (
        <button
          onClick={() =>
            navigate(`/restaurants/setting/${row.original.restaurant_id}`)
          }
          className="text-blue-600 hover:underline font-medium text-left"
        >
          {row.getValue("customerName")}
        </button>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total Amount",
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          {row.getValue("totalAmount")} E£
        </span>
      ),
    },
    {
      accessorKey: "orderStatus",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${row.original.orderStatus === "completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
        >
          {row.original.orderStatus}
        </span>
      ),
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* زر عرض الطلب (نفس منطق زر الـ Food) */}
          <button
            onClick={() =>
              navigate(`/orders/details/${restaurantId}/${row.original.orderId}`)
            }
            className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Orders"
        columns={columns}
        data={orders}
        isLoading={isLoading}
        queryKey="orders"
        // لا يوجد زر إضافة (لأن الطلبات تُنشأ من التطبيق)
        // لا يوجد delete
        onEdit={false}
        actions={false}
      />
    </div>
  );
}
