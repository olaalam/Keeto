import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import { ShoppingBag, Utensils } from "lucide-react";

export default function DetailedFinancialReport() {
  // 1. Extract date filters from URL if available
  const { startDate, endDate } = useParams();

  // 2. Fetch the detailed report data using useQuery
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["detailedFinancialReport", startDate, endDate],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/report/detailed", {
        params: {
          startDate,
          endDate,
        },
      });
      return res.data?.data?.data || res.data?.data;
    },
  });

  // 3. Prepare top stats cards
  const statsCards = [
    {
      title: "Grand Total Platform Sales",
      value: `${reportData?.grandTotalOrdersAmount ?? "0.00"} E£`,
      icon: ShoppingBag,
      bgIcon: "bg-orange-100 text-orange-600",
    },
    {
      title: "Total Active Restaurants",
      value: reportData?.totalRestaurants ?? 0,
      icon: Utensils,
      bgIcon: "bg-blue-100 text-blue-600",
    },
  ];

  // 4. Define table columns matching the response and wireframe
  const columns = [
    {
      accessorKey: "restaurantName",
      header: "Restaurant",
      cell: ({ row }) => (
        <div className="font-bold text-slate-800">
          {row.getValue("restaurantName")}
        </div>
      ),
    },
    {
      accessorKey: "totalOrders",
      header: "Total Orders",
      cell: ({ row }) => (
        <span className="font-medium font-mono">
          {row.getValue("totalOrders")}
        </span>
      ),
    },
    {
      accessorKey: "totalOrdersAmount",
      header: "Revenue",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-700 font-mono">
          {row.getValue("totalOrdersAmount")} E£
        </span>
      ),
    },
    {
      accessorKey: "totalCashAmount",
      header: "Cash",
      cell: ({ row }) => (
        <span className="font-semibold text-green-600 font-mono">
          {row.getValue("totalCashAmount")} E£
        </span>
      ),
    },
    {
      accessorKey: "totalDigitalAmount",
      header: "Visa / Digital",
      cell: ({ row }) => (
        <span className="font-semibold text-blue-600 font-mono">
          {row.getValue("totalDigitalAmount")} E£
        </span>
      ),
    },
    {
      accessorKey: "calculatedCommission",
      header: "Calculated Commission",
      cell: ({ row }) => {
        const rate = row.original.commissionRate;
        return (
          <div className="flex flex-col">
            <span className="font-bold text-amber-600 font-mono">
              {row.getValue("calculatedCommission")} E£
            </span>
            <span className="text-xs text-slate-400 font-mono">({rate})</span>
          </div>
        );
      },
    },
    {
      accessorKey: "recordedAppCommission",
      header: "App Commission (Keeto)",
      cell: ({ row }) => (
        <span className="font-bold text-rose-600 font-mono">
          {row.getValue("recordedAppCommission")} E£
        </span>
      ),
    },
    {
      accessorKey: "businessPlan",
      header: "Business Plan & Fees",
      cell: ({ row }) => {
        const plans = row.getValue("businessPlan") || [];
        return (
          <div className="flex flex-col gap-1 max-w-[200px]">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className="text-xs bg-slate-50 border p-1 rounded text-slate-600"
              >
                <span className="font-medium">
                  {plan.platformType === "food_aggregator" ? "App" : "Web"}:
                </span>{" "}
                <span className="font-mono">{plan.commissionRate}%</span> |
                Service: <span className="font-mono">{plan.serviceFee}</span>
              </div>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* 5. Render Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white border rounded-2xl shadow-sm p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <h2 className="text-3xl font-black mt-1 text-slate-800">
                  {card.value}
                </h2>
              </div>

              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center ${card.bgIcon}`}
              >
                <Icon className="w-7 h-7" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Comprehensive Financial Data Table */}
      <GenericDataTable
        title="Detailed Financial Report"
        columns={columns}
        data={reportData?.restaurants || []}
        isLoading={isLoading}
        queryKey="detailedFinancialReport"
        onEdit={false}
        actions={false}
      />
    </div>
  );
}
