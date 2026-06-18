import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  DollarSign,
  Percent,
  Coins,
} from "lucide-react";

export default function FinancialReport() {
  const { restaurantId, startDate, endDate } = useParams();

  // جلب البيانات من الـ API لتقرير الماكرو المالي
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["financialReport", restaurantId, startDate, endDate],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/report", {
        params: {
          restaurantId,
          startDate,
          endDate,
        },
      });
      // الوصول للهيكل الصحيح بناءً على الـ JSON المستلم
      return res.data?.data?.data || res.data?.data;
    },
  });

  // استخراج البيانات والمسارات الجديدة بدقة لتفادي الـ Undefined
  const totalAttempted = reportData?.totalAttemptedOrders ?? 0;
  const totalValid = reportData?.totalFinanciallyValidOrders ?? 0;
  const totalCancelled = totalAttempted - totalValid;

  const macroFinancials = reportData?.macroFinancials || {};
  const collectionBreakdown = reportData?.collectionBreakdown || {};
  const sourceBreakdown = reportData?.sourceBreakdown || [];

  // إعداد كروت الإحصائيات العلوية بتنسيق منسق
  const statsCards = [
    {
      title: "Total Orders",
      value: totalAttempted,
      icon: ShoppingBag,
      bgColor: "bg-blue-50 text-blue-600",
    },
    {
      title: "Valid Orders",
      value: totalValid,
      icon: CheckCircle2,
      bgColor: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Cancelled Orders",
      value: totalCancelled >= 0 ? totalCancelled : 0,
      icon: XCircle,
      bgColor: "bg-rose-50 text-rose-600",
    },
    {
      title: "Grand Total Sales",
      value: `${Number(macroFinancials.grandTotalSales || 0).toFixed(2)} E£`,
      icon: DollarSign,
      bgColor: "bg-orange-50 text-orange-600",
    },
    {
      title: "Keeto Total Commission",
      value: `${Number(macroFinancials.keetoTotalCommission || 0).toFixed(2)} E£`,
      icon: Percent,
      bgColor: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Cash Collected (Restaurants)",
      value: `${Number(collectionBreakdown.cashCollectedByRestaurants || 0).toFixed(2)} E£`,
      icon: Coins,
      bgColor: "bg-amber-50 text-amber-600",
    },
  ];

  // تعريف أعمدة الجدول لتعرض تفاصيل تفكيك البيانات حسب المصدر (sourceBreakdown)
  const columns = [
    {
      accessorKey: "source",
      header: () => (
        <div className="text-left font-bold min-w-[140px]">Order Source</div>
      ),
      cell: ({ row }) => {
        const sourceMap = {
          food_aggregator: "Food Aggregator",
          mykeeto: "MyKeeto",
          online_order: "Online Order",
        };
        return (
          <div className="text-left font-bold text-slate-800 capitalize">
            {sourceMap[row.getValue("source")] || row.getValue("source")}
          </div>
        );
      },
    },
    {
      accessorKey: "ordersCount",
      header: () => (
        <div className="text-center font-bold min-w-[100px]">Orders Count</div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium font-mono text-slate-700">
          {row.getValue("ordersCount")}
        </div>
      ),
    },
    {
      accessorKey: "revenue",
      header: () => (
        <div className="text-right font-bold min-w-[120px]">Revenue</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-semibold text-blue-600 font-mono">
          {Number(row.getValue("revenue")).toFixed(2)} E£
        </div>
      ),
    },
    {
      accessorKey: "keetoCommission",
      header: () => (
        <div className="text-right font-bold min-w-[140px]">
          Keeto Commission
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-bold text-rose-600 font-mono">
          {Number(row.getValue("keetoCommission")).toFixed(2)} E£
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Financial Macro-Report Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of platform totals, commission statistics, and collection
          methods.
        </p>
      </div>

      {/* عرض الكروت العلوية في شبكة متجاوبة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white border rounded-2xl shadow-sm p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-slate-400">
                  {card.title}
                </p>
                <h2 className="text-2xl font-black mt-1 text-slate-800 font-mono tracking-tight">
                  {card.value}
                </h2>
              </div>

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bgColor}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* تفاصيل الدفع الرقمي الإضافية */}
      {collectionBreakdown?.digitalDetails && (
        <div className="bg-slate-50 border p-4 rounded-xl flex flex-wrap gap-6 items-center shadow-inner text-sm text-slate-600">
          <span className="font-semibold text-slate-700">
            Digital Platforms Collection:
          </span>
          <div>
            Total Digital:{" "}
            <span className="font-bold font-mono text-indigo-600">
              {Number(collectionBreakdown.digitalCollectedByPlatform).toFixed(
                2,
              )}{" "}
              E£
            </span>
          </div>
          <div className="w-px h-4 bg-slate-300 hidden md:block" />
          <div>
            Visa:{" "}
            <span className="font-mono">
              {Number(collectionBreakdown.digitalDetails.visa).toFixed(2)} E£
            </span>
          </div>
          <div>
            Wallet:{" "}
            <span className="font-mono">
              {Number(collectionBreakdown.digitalDetails.wallet).toFixed(2)} E£
            </span>
          </div>
          {macroFinancials?.restaurantsExtraEarnings && (
            <>
              <div className="w-px h-4 bg-slate-300 hidden md:block" />
              <div>
                Service Fees:{" "}
                <span className="font-mono text-emerald-600">
                  +
                  {Number(
                    macroFinancials.restaurantsExtraEarnings.totalServiceFees,
                  ).toFixed(2)}{" "}
                  E£
                </span>
              </div>
              <div>
                Delivery Fees:{" "}
                <span className="font-mono text-emerald-600">
                  +
                  {Number(
                    macroFinancials.restaurantsExtraEarnings.totalDeliveryFees,
                  ).toFixed(2)}{" "}
                  E£
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* جدول البيانات الرئيسي ممرر له داتا المصادر الصحيحة */}
      <GenericDataTable
        title="Revenue Breakdown By Source"
        columns={columns}
        data={sourceBreakdown}
        isLoading={isLoading}
        queryKey="financialReport"
        onEdit={false}
        actions={false}
      />
    </div>
  );
}
