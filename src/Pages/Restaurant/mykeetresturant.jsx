import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import { ShoppingBag, Utensils, Coins, ShieldAlert, ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function DetailedFinancialReport() {
  // 1. Extract date filters and restaurant ID from URL
  const { startDate, endDate, id } = useParams();

  // 2. Fetch the detailed report data using useQuery
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["detailedFinancialReport", startDate, endDate, id],
    queryFn: async () => {
      const res = await api.get(`/api/superadmin/report/restaurant/${id}`, {
        params: {
          startDate,
          endDate,
        },
      });
      return res.data?.data?.data || res.data?.data;
    },
  });

  // المابينج الصحيح بناءً على الـ JSON الجديد
  const restaurantInfo = responseData?.restaurant;
  const breakdownBySource = responseData?.breakdownBySource || [];
  const overallSummary = responseData?.overallSummary;

  // 3. تحسين الكروت العلوية لتشمل 3 كروت متناسقة وشكلها احترافي
  const statsCards = [
    {
      title: "Overall Total Revenue",
      value: `${Number(overallSummary?.sales?.totalRevenue ?? 0).toLocaleString()} EGP`,
      icon: ShoppingBag,
      bgIcon: "bg-orange-50 text-orange-600 border border-orange-100",
    },
    {
      title: "Overall Total Orders",
      value: overallSummary?.totalOrders ?? 0,
      icon: Utensils,
      bgIcon: "bg-blue-50 text-blue-600 border border-blue-100",
    },
    {
      title: "Overall Net Balance",
      value: `${Number(overallSummary?.settlement?.netBalance ?? 0).toLocaleString()} EGP`,
      icon: Coins,
      bgIcon: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    },
  ];

  // 4. تعديل وتطوير الأعمدة بالـ Keys الصحيحة مع تحسين الفيجوالز
  const columns = [
    {
      accessorKey: "source",
      header: () => <div className="text-left font-bold min-w-[130px]">Order Source</div>,
      cell: ({ row }) => {
        const source = row.getValue("source") || "";
        // تحويل شكل اسم المصدر ليصبح مقروءاً بشكل أفضل (Format code to readable text)
        const formattedSource = source.toUpperCase().replace("_", " ");
        return (
          <div className="text-left">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border">
              {formattedSource}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "ordersCount",
      header: () => <div className="text-center font-bold">Total Orders</div>,
      cell: ({ row }) => (
        <div className="text-center font-bold font-mono text-slate-800">
          {row.getValue("ordersCount") ?? 0}
        </div>
      ),
    },
    {
      accessorKey: "sales.totalRevenue",
      header: () => <div className="text-right font-bold">Revenue</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-slate-700 font-mono">
          {Number(row.original?.sales?.totalRevenue ?? 0).toFixed(2)} EGP
        </div>
      ),
    },
    {
      accessorKey: "sales.cashRevenue",
      header: () => <div className="text-right font-bold">Cash</div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold text-emerald-600 font-mono">
          {Number(row.original?.sales?.cashRevenue ?? 0).toFixed(2)} EGP
        </div>
      ),
    },
    {
      accessorKey: "sales.digitalRevenue",
      header: () => <div className="text-right font-bold">Digital / Visa</div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold text-blue-600 font-mono">
          {Number(row.original?.sales?.digitalRevenue ?? 0).toFixed(2)} EGP
        </div>
      ),
    },
    {
      accessorKey: "restaurantExtraEarnings.totalServiceFees",
      header: () => <div className="text-right font-bold">Extra Fees (Serv/Delv)</div>,
      cell: ({ row }) => {
        const serv = Number(row.original?.restaurantExtraEarnings?.totalServiceFees ?? 0).toFixed(2);
        const delv = Number(row.original?.restaurantExtraEarnings?.totalDeliveryFees ?? 0).toFixed(2);
        return (
          <div className="text-right flex flex-col items-end">
            <span className="font-medium text-slate-700 font-mono text-xs">S: {serv} EGP</span>
            <span className="text-[11px] text-slate-400 font-mono">D: {delv} EGP</span>
          </div>
        );
      },
    },
    {
      accessorKey: "keetoDues.appCommission",
      header: () => <div className="text-right font-bold">App Commission</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-rose-600 font-mono">
          {Number(row.original?.keetoDues?.appCommission ?? 0).toFixed(2)} EGP
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
          return <div className="text-right text-slate-400 font-medium font-mono">0.00 EGP</div>;
        }

        return (
          <div className={`text-right font-bold font-mono ${owesPlatform > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {owesPlatform > 0 ? `-${owesPlatform.toFixed(2)}` : `+${net.toFixed(2)}`} EGP
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8 px-4">
      {/* اسم المطعم العلوي هيدر شيك جداً */}
      {restaurantInfo?.name && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Restaurant Profile</span>
            <h1 className="text-3xl font-black text-slate-800 mt-0.5">
              Financials for: <span className="text-orange-600 font-bold">{restaurantInfo.name}</span>
            </h1>
          </div>
          {overallSummary?.settlement?.actionRequired && (
            <div className="max-w-md">
              {overallSummary.settlement.actionRequired.includes("✅") ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" /> Settled Accounts
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
                  <ArrowUpRight className="w-4 h-4 text-amber-600 shrink-0" />
                  {overallSummary.settlement.actionRequired.replace("⚠️", "").trim()}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. عرض الـ 3 كروت المحدثة بنظام Grid متناسق */}
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

      {/* 6. كارد الجدول مع كستمايزيشن ممتاز للحواف والنظافة العرضية */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <GenericDataTable
          title="Detailed Financial Report By Source"
          columns={columns}
          data={breakdownBySource}
          isLoading={isLoading}
          queryKey="detailedFinancialReport"
          onEdit={false}
          actions={false}
        />
      </div>
    </div>
  );
}