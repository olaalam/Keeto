import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import { ShoppingBag, CheckCircle2, XCircle } from "lucide-react";

export default function FinancialReport() {
  const { restaurantId, startDate, endDate } = useParams();

  const { data: financialReport, isLoading } = useQuery({
    queryKey: ["financialReport", restaurantId, startDate, endDate],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/report", {
        params: {
          restaurantId,
          startDate,
          endDate,
        },
      });

      return res.data.data.data.summary;
    },
  });

  const statsCards = [
    {
      title: "Total Orders",
      value: financialReport?.totalOrders ?? 0,
      icon: ShoppingBag,
    },
    {
      title: "Delivered Orders",
      value: financialReport?.totalDeliveredOrders ?? 0,
      icon: CheckCircle2,
    },
    {
      title: "Cancelled Orders",
      value: financialReport?.totalCancelledOrders ?? 0,
      icon: XCircle,
    },
  ];

  const columns = [
    {
      accessorKey: "totalRevenue",
      header: "Total Revenue",
      cell: ({ row }) => (
        <span className="font-medium text-blue-600">
          {row.getValue("totalRevenue")} E£
        </span>
      ),
    },
    {
      accessorKey: "totalAppCommission",
      header: "Total App Commission",
      cell: ({ row }) => (
        <span className="font-medium text-blue-600">
          {row.getValue("totalAppCommission")} E£
        </span>
      ),
    },
    {
      accessorKey: "totalCashCollected",
      header: "Total Cash Collected",
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          {row.getValue("totalCashCollected")} E£
        </span>
      ),
    },
    {
      accessorKey: "totalDigitalCollected",
      header: "Total Digital Collected",
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          {row.getValue("totalDigitalCollected")} E£
        </span>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white border rounded-2xl shadow-sm p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>

                <h2 className="text-3xl font-bold mt-1">{card.value}</h2>
              </div>

              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                <Icon className="w-7 h-7 text-gray-700" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <GenericDataTable
        title="Financial Report"
        columns={columns}
        data={financialReport?.financials ? [financialReport.financials] : []}
        isLoading={isLoading}
        queryKey="financialReport"
        onEdit={false}
        actions={false}
      />
    </div>
  );
}
