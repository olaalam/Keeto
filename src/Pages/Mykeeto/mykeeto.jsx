import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import { ShoppingBag, Utensils, BadgeDollarSign, Wallet, ArrowUpRight, CheckCircle2 } from "lucide-react";

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

  // Safe extraction based on new API shape
  const summary = responseData?.summary;
  const restaurantsList = responseData?.restaurants || [];

  // 3. Updated Stats Cards with 3 metrics to fill the layout beautifully
  const statsCards = [
    {
      title: "Grand Total System Sales",
      value: `${Number(summary?.grandTotalSystemSales ?? 0).toLocaleString()} EGP`,
      icon: ShoppingBag,
      bgIcon: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    },
    {
      title: "Total Keeto Commission",
      value: `${Number(summary?.grandTotalKeetoCommission ?? 0).toLocaleString()} EGP`,
      icon: BadgeDollarSign,
      bgIcon: "bg-amber-50 text-amber-600 border border-amber-100",
    },
    {
      title: "Total Active Restaurants",
      value: summary?.totalRestaurantsActive ?? 0,
      icon: Utensils,
      bgIcon: "bg-blue-50 text-blue-600 border border-blue-100",
    },
  ];

  // 4. Refactored Columns to match exactly the incoming API structure
  const columns = [
    {
      accessorKey: "restaurantName",
      header: () => <div className="text-left font-bold min-w-[140px]">Restaurant</div>,
      cell: ({ row }) => (
        <div className="text-left font-semibold text-slate-900">
          {row.getValue("restaurantName")}
        </div>
      ),
    },
    {
      accessorKey: "ordersCount.total",
      header: () => <div className="text-center font-bold">Orders (C / D)</div>,
      cell: ({ row }) => {
        const total = row.original?.ordersCount?.total ?? 0;
        const cash = row.original?.ordersCount?.cash ?? 0;
        const digital = row.original?.ordersCount?.digital ?? 0;
        return (
          <div className="text-center flex flex-col justify-center items-center">
            <span className="font-bold text-slate-800 font-mono text-base">{total}</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {cash} Cash | {digital} Dig
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "sales.totalRevenue",
      header: () => <div className="text-right font-bold">Total Revenue</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-slate-800 font-mono">
          {Number(row.original?.sales?.totalRevenue ?? 0).toFixed(2)} EGP
        </div>
      ),
    },
    {
      accessorKey: "sales.cashInRestaurantDrawer",
      header: () => <div className="text-right font-bold">Cash (In-Drawer)</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-emerald-600 font-mono">
          {Number(row.original?.sales?.cashInRestaurantDrawer ?? 0).toFixed(2)} EGP
        </div>
      ),
    },
    {
      accessorKey: "sales.digitalInPlatformBank",
      header: () => <div className="text-right font-bold">Digital (In-Bank)</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-blue-600 font-mono">
          {Number(row.original?.sales?.digitalInPlatformBank ?? 0).toFixed(2)} EGP
        </div>
      ),
    },
    {
      accessorKey: "platformDues.totalAppCommission",
      header: () => <div className="text-right font-bold">App Commission</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-rose-600 font-mono">
          {Number(row.original?.platformDues?.totalAppCommission ?? 0).toFixed(2)} EGP
        </div>
      ),
    },
    {
      accessorKey: "settlement.netBalance",
      header: () => <div className="text-right font-bold min-w-[130px]">Net Balance</div>,
      cell: ({ row }) => {
        const net = Number(row.original?.settlement?.netBalance ?? 0);
        const owesPlatform = Number(row.original?.settlement?.restaurantOwesPlatform ?? 0);
        
        if (net === 0 && owesPlatform === 0) {
          return (
            <div className="text-right text-slate-400 font-medium font-mono">
              0.00 EGP
            </div>
          );
        }
        
        // لو المنصة اللي هتحول للمطعم بيكون netBalance موجب، لو المطعم عليه فلوس بيظهر في owesPlatform
        return (
          <div className={`text-right font-bold font-mono ${owesPlatform > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {owesPlatform > 0 ? `-${owesPlatform.toFixed(2)}` : `+${net.toFixed(2)}`} EGP
          </div>
        );
      },
    },
    {
      accessorKey: "settlement.actionRequired",
      header: () => <div className="text-left font-bold min-w-[280px] pl-4">Status & Action Required</div>,
      cell: ({ row }) => {
        const action = row.original?.settlement?.actionRequired ?? "";
        const isSettled = action.includes("✅");
        
        return (
          <div className="pl-4 text-left">
            {isSettled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Settled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-sm whitespace-normal max-w-[320px]">
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                {action.replace("⚠️", "").trim()}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8 px-4">
      {/* 5. Enhanced Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statsCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex items-center justify-between transition-all hover:shadow-md"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.title}</p>
                <h2 className="text-2xl font-black text-slate-800 font-mono">
                  {card.value}
                </h2>
              </div>

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bgIcon}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Main Table View wrapped in a styled container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
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
    </div>
  );
}