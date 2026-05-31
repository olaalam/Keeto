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
  const { data: responseData, isLoading } = useQuery({
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

  // Extract summaries and restaurant lists safely
  const summary = responseData?.summary;
  const restaurantsList = responseData?.restaurants || [];

  // 3. Prepare top stats cards using the new summary keys
  const statsCards = [
    {
      title: "Grand Total Platform Sales",
      value: `${summary?.grandTotalSales ?? "0.00"} E£`,
      icon: ShoppingBag,
      bgIcon: "bg-orange-100 text-orange-600",
    },
    {
      title: "Total Active Restaurants",
      value: summary?.totalRestaurants ?? 0,
      icon: Utensils,
      bgIcon: "bg-blue-100 text-blue-600",
    },
  ];

  // 4. Define table columns with explicit styling and matching alignments
  const columns = [
    {
      accessorKey: "restaurantName",
      header: () => (
        <div className="text-left font-bold min-w-[120px]">Restaurant</div>
      ),
      cell: ({ row }) => (
        <div className="text-left font-bold text-slate-800">
          {row.getValue("restaurantName")}
        </div>
      ),
    },
    {
      accessorKey: "orders.total",
      header: () => (
        <div className="text-center font-bold min-w-[100px]">Total Orders</div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium font-mono">
          {row.original?.orders?.total ?? 0}
        </div>
      ),
    },
    {
      accessorKey: "financials.totalSales",
      header: () => (
        <div className="text-right font-bold min-w-[110px]">Revenue</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-semibold text-slate-700 font-mono">
          {row.original?.financials?.totalSales ?? "0.00"} E£
        </div>
      ),
    },
    {
      accessorKey: "financials.cashOrders",
      header: () => (
        <div className="text-right font-bold min-w-[100px]">Cash</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-semibold text-green-600 font-mono">
          {row.original?.financials?.cashOrders ?? "0.00"} E£
        </div>
      ),
    },
    {
      accessorKey: "financials.digitalOrders",
      header: () => (
        <div className="text-right font-bold min-w-[120px]">Visa / Digital</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-semibold text-blue-600 font-mono">
          {row.original?.financials?.digitalOrders ?? "0.00"} E£
        </div>
      ),
    },
    {
      accessorKey: "financials.calculatedCommission",
      header: () => (
        <div className="text-right font-bold min-w-[160px]">
          Calculated Commission
        </div>
      ),
      cell: ({ row }) => {
        const rate = row.original?.financials?.commissionRate ?? "0.00%";
        return (
          <div className="text-right flex flex-col items-end min-w-[160px]">
            <span className="font-bold text-amber-600 font-mono">
              {row.original?.financials?.calculatedCommission ?? "0.00"} E£
            </span>
            <span className="text-xs text-slate-400 font-mono">({rate})</span>
          </div>
        );
      },
    },
    {
      accessorKey: "financials.platformCommission",
      header: () => (
        <div className="text-right font-bold min-w-[160px]">
          App Commission (Keeto)
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-bold text-rose-600 font-mono">
          {row.original?.financials?.platformCommission ?? "0.00"} E£
        </div>
      ),
    },
    {
      accessorKey: "businessPlan",
      header: () => (
        <div className="text-left font-bold min-w-[240px] pl-2">
          Business Plan & Fees
        </div>
      ),
      cell: ({ row }) => {
        const plans = row.getValue("businessPlan") || [];
        return (
          <div className="flex flex-col gap-1 w-[240px] text-left pl-2">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className="text-xs bg-slate-50 border p-1.5 rounded text-slate-600 shadow-sm"
              >
                <span className="font-medium">
                  {plan.platformType === "food_aggregator" ? "App" : "Web"}:
                </span>{" "}
                <span className="font-mono">{plan.commissionRate}%</span> |{" "}
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
        data={restaurantsList}
        isLoading={isLoading}
        queryKey="detailedFinancialReport"
        onEdit={false}
        actions={false}
      />
    </div>
  );
}
