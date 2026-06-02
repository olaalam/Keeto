import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import { ShoppingBag, Utensils } from "lucide-react";

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
      // بناءً على كود الـ queryFn الخاص بك، قمنا بالوصول المباشر للهيكل الداخلي
      return res.data?.data?.data || res.data?.data;
    },
  });

  // استخراج البيانات بناءً على الـ JSON الجديد بشكل صحيح
  const restaurantInfo = responseData?.restaurant;
  const reportBySource = responseData?.reportBySource || [];
  const totals = responseData?.totals;

  // 3. Prepare top stats cards using the correct totals keys
  const statsCards = [
    {
      title: `Grand Total Sales (${restaurantInfo?.name || "Restaurant"})`,
      value: `${totals?.totalRevenue ?? "0.00"} E£`,
      icon: ShoppingBag,
      bgIcon: "bg-orange-100 text-orange-600",
    },
    {
      title: "Total Orders Built",
      value: totals?.totalOrders ?? 0,
      icon: Utensils,
      bgIcon: "bg-blue-100 text-blue-600",
    },
  ];

  // 4. Define table columns mapped to "reportBySource" object structure
  const columns = [
    {
      accessorKey: "orderSourceName",
      header: () => (
        <div className="text-left font-bold min-w-[140px]">Order Source</div>
      ),
      cell: ({ row }) => (
        <div className="text-left font-bold text-slate-800">
          {row.getValue("orderSourceName")}
        </div>
      ),
    },
    {
      accessorKey: "statistics.totalOrders",
      header: () => (
        <div className="text-center font-bold min-w-[100px]">Total Orders</div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium font-mono">
          {row.original?.statistics?.totalOrders ?? 0}
        </div>
      ),
    },
    {
      accessorKey: "statistics.totalRevenue",
      header: () => (
        <div className="text-right font-bold min-w-[110px]">Revenue</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-semibold text-slate-700 font-mono">
          {row.original?.statistics?.totalRevenue ?? "0.00"} E£
        </div>
      ),
    },
    {
      accessorKey: "paymentBreakdown.cash",
      header: () => (
        <div className="text-right font-bold min-w-[100px]">Cash</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-semibold text-green-600 font-mono">
          {row.original?.paymentBreakdown?.cash ?? "0.00"} E£
        </div>
      ),
    },
    {
      accessorKey: "paymentBreakdown.visa",
      header: () => (
        <div className="text-right font-bold min-w-[120px]">Visa / Digital</div>
      ),
      cell: ({ row }) => {
        const visa = parseFloat(row.original?.paymentBreakdown?.visa || 0);
        const wallet = parseFloat(row.original?.paymentBreakdown?.wallet || 0);
        const totalDigital = (visa + wallet).toFixed(2);
        return (
          <div className="text-right font-semibold text-blue-600 font-mono">
            {totalDigital} E£
          </div>
        );
      },
    },
    {
      accessorKey: "fees.commission",
      header: () => (
        <div className="text-right font-bold min-w-[160px]">Platform Commission</div>
      ),
      cell: ({ row }) => {
        const rate = row.original?.fees?.commissionRate ?? "0%";
        return (
          <div className="text-right flex flex-col items-end min-w-[160px]">
            <span className="font-bold text-amber-600 font-mono">
              {row.original?.fees?.commission ?? "0.00"} E£
            </span>
            <span className="text-xs text-slate-400 font-mono">({rate})</span>
          </div>
        );
      },
    },
    {
      accessorKey: "cashDue.netBalance",
      header: () => (
        <div className="text-right font-bold min-w-[160px]">Net Balance Status</div>
      ),
      cell: ({ row }) => {
        const netBalance = parseFloat(row.original?.cashDue?.netBalance || 0);
        const statusText = row.original?.cashDue?.balanceStatus || "";
        return (
          <div className="text-right flex flex-col items-end min-w-[160px]">
            <span className={`font-bold font-mono ${netBalance < 0 ? "text-rose-600" : "text-green-600"}`}>
              {row.original?.cashDue?.netBalance ?? "0.00"} E£
            </span>
            <span className="text-[10px] text-slate-500 text-right">{statusText}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* اسم المطعم العلوي في حال توفره */}
      {restaurantInfo?.name && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-800">
            Financials for: <span className="text-orange-600">{restaurantInfo.name}</span>
          </h1>
        </div>
      )}

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
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${card.bgIcon}`}>
                <Icon className="w-7 h-7" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Comprehensive Financial Data Table */}
      <GenericDataTable
        title="Detailed Financial Report By Source"
        columns={columns}
        data={reportBySource}
        isLoading={isLoading}
        queryKey="detailedFinancialReport"
        onEdit={false}
        actions={false}
      />
    </div>
  );
}