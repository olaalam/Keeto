import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  DollarSign,
  Percent,
  Coins,
  CalendarRange,
} from "lucide-react";

const getVisaConditionType = (restaurant) =>
  restaurant.visaSwitchConditionType ||
  restaurant.visaSwitchProgress?.conditionType ||
  "none";

const getVisaConditionLabel = (conditionType) => {
  const labels = {
    amount: "Amount",
    day_of_week: "Weekly",
    day_of_month: "Monthly",
    none: "No condition",
  };
  return labels[conditionType] || conditionType;
};

const getVisaProgress = (restaurant) => {
  const conditionType = getVisaConditionType(restaurant);
  const progress = restaurant.visaSwitchProgress || {};
  const remaining =
    progress.remainingDays == null || progress.remainingDays === ""
      ? NaN
      : Number(progress.remainingDays);

  if (conditionType === "amount") {
    const threshold = Number(
      progress.threshold ?? restaurant.visaSwitchAmountThreshold,
    );
    const currentDebt = Number(
      progress.currentDebt ??
        (Number.isFinite(threshold) && progress.remainingAmount != null
          ? threshold - Number(progress.remainingAmount)
          : NaN),
    );
    const remainingAmount =
      progress.remainingAmount != null
        ? Number(progress.remainingAmount)
        : threshold - currentDebt;

    return {
      label: Number.isFinite(remainingAmount)
        ? `${remainingAmount.toFixed(2)} E£ remaining`
        : "Amount not available",
      percent:
        Number.isFinite(threshold) &&
        threshold > 0 &&
        Number.isFinite(currentDebt)
          ? Math.min(100, Math.max(0, (currentDebt / threshold) * 100))
          : null,
    };
  }

  if (
    (conditionType === "day_of_week" ||
      conditionType === "day_of_month") &&
    Number.isFinite(remaining)
  ) {
    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).getDate();
    const periodLength = conditionType === "day_of_week" ? 7 : daysInMonth;

    return {
      label: `${remaining} ${remaining === 1 ? "day" : "days"} remaining`,
      percent: Math.min(
        100,
        Math.max(0, ((periodLength - remaining) / periodLength) * 100),
      ),
    };
  }

  return {
    label: conditionType === "none" ? "No automatic switch" : "Progress unavailable",
    percent: null,
  };
};

export default function FinancialReport() {
  const navigate = useNavigate();
  const {
    restaurantId,
    startDate: startDateParam,
    endDate: endDateParam,
  } = useParams();

  // نطاق التاريخ الفعلي بيتحكم فيه المستخدم من الفلتر، ولو مفيش حاجة في الـ URL بنبدأ فاضي
  const [startDate, setStartDate] = useState(startDateParam || "");
  const [endDate, setEndDate] = useState(endDateParam || "");
  const [walletConditionFilter, setWalletConditionFilter] = useState("all");

  const resetDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

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
      const candidates = [
        res.data?.data?.data,
        res.data?.data,
        res.data,
      ];
      return (
        candidates.find(
          (candidate) =>
            candidate &&
            typeof candidate === "object" &&
            ("walletManagement" in candidate ||
              "macroFinancials" in candidate ||
              "totalAttemptedOrders" in candidate),
        ) ??
        candidates.find((candidate) => candidate && typeof candidate === "object")
      );
    },
  });

  // استخراج البيانات والمسارات الجديدة بدقة لتفادي الـ Undefined
  const totalAttempted = reportData?.totalAttemptedOrders ?? 0;
  const totalValid = reportData?.totalFinanciallyValidOrders ?? 0;
  const totalCancelled = totalAttempted - totalValid;

  const macroFinancials = reportData?.macroFinancials || {};
  const collectionBreakdown = reportData?.collectionBreakdown || {};
  const sourceBreakdown = reportData?.sourceBreakdown || [];
  const walletManagement =
    reportData?.walletManagement ??
    reportData?.data?.walletManagement ??
    reportData?.data?.data?.walletManagement;
  const walletSummary = walletManagement?.summary || {};
  const walletRestaurants = Array.isArray(walletManagement?.restaurants)
    ? walletManagement.restaurants
    : [];
  const filteredWalletRestaurants = walletRestaurants.filter(
    (restaurant) =>
      walletConditionFilter === "all" ||
      getVisaConditionType(restaurant) === walletConditionFilter,
  );
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Financial Macro Report", 14, 20);

    doc.setFontSize(11);
    doc.text(`Period: ${startDate || "N/A"} - ${endDate || "N/A"}`, 14, 30);

    // Summary
    autoTable(doc, {
      startY: 40,
      head: [["Metric", "Value"]],
      body: [
        ["Total Orders", totalAttempted],
        ["Valid Orders", totalValid],
        ["Cancelled Orders", totalCancelled],
        [
          "Grand Total Sales",
          `${Number(macroFinancials.grandTotalSales || 0).toFixed(2)} E£`,
        ],
        [
          "Keeto Commission",
          `${Number(macroFinancials.keetoTotalCommission || 0).toFixed(2)} E£`,
        ],
        [
          "Cash Collected",
          `${Number(
            collectionBreakdown.cashCollectedByRestaurants || 0,
          ).toFixed(2)} E£`,
        ],
      ],
    });

    // Revenue Breakdown Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Order Source", "Orders Count", "Revenue", "Keeto Commission"]],
      body: sourceBreakdown.map((item) => [
        item.source,
        item.ordersCount,
        `${Number(item.revenue).toFixed(2)} E£`,
        `${Number(item.keetoCommission).toFixed(2)} E£`,
      ]),
    });

    if (walletManagement) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [["Wallet Summary", "Value"]],
        body: [
          ["Net Balance", walletSummary.totalNetBalance || "0.00"],
          ["Due on Restaurants", `${walletSummary.totalDueOnRestaurants || "0.00"} E£`],
          ["Due to Restaurants", `${walletSummary.totalDueToRestaurants || "0.00"} E£`],
        ],
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Restaurant", "Balance", "Visa Condition", "Remaining"]],
        body: walletRestaurants.map((restaurant) => [
          restaurant.restaurantName,
          `${restaurant.balance} E£`,
          getVisaConditionLabel(getVisaConditionType(restaurant)),
          getVisaProgress(restaurant).label,
        ]),
      });
    }

    doc.save(`Financial_Report_${startDate || ""}_${endDate || ""}.pdf`);
  };
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Financial Macro-Report Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of platform totals, commission statistics, and collection
          methods.
        </p>
        </div>
        <a
          href="#wallet-management"
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          Wallet Management
        </a>
      </div>

      {/* فلتر التاريخ */}
      <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 text-slate-500 pr-2">
          <CalendarRange className="w-4 h-4" />
          <span className="text-sm font-semibold">Filter by date</span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400">From</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 w-[160px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400">To</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 w-[160px]"
          />
        </div>

        {(startDate || endDate) && (
          <Button
            variant="ghost"
            className="h-9 text-slate-500 hover:text-slate-700"
            onClick={resetDateFilter}
          >
            Clear
          </Button>
        )}
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
      <section
        id="wallet-management"
        className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-6"
      >
          <div>
            <h2 className="text-xl font-bold text-slate-800">Wallet Management</h2>
            <p className="text-sm text-slate-500 mt-1">
              Wallet balances and Visa switch condition progress.
            </p>
          </div>

          {walletManagement ? (
            <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border rounded-2xl shadow-sm p-5">
              <p className="text-sm font-medium text-slate-400">Total Net Balance</p>
              <p className="text-2xl font-black mt-1 text-slate-800 font-mono">
                {walletSummary.totalNetBalance || "0.00"} E£
              </p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl shadow-sm p-5">
              <p className="text-sm font-medium text-slate-400">Due on Restaurants</p>
              <p className="text-2xl font-black mt-1 text-emerald-600 font-mono">
                {walletSummary.totalDueOnRestaurants || "0.00"} E£
              </p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl shadow-sm p-5">
              <p className="text-sm font-medium text-slate-400">Due to Restaurants</p>
              <p className="text-2xl font-black mt-1 text-rose-600 font-mono">
                {walletSummary.totalDueToRestaurants || "0.00"} E£
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4">
            <div className="text-sm font-semibold text-slate-700">
              Wallet filters
              <p className="mt-1 text-xs font-normal text-slate-500">
                Date range follows the report date filter above.
              </p>
            </div>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Visa switch condition
              <Select
                value={walletConditionFilter}
                onValueChange={setWalletConditionFilter}
              >
                <SelectTrigger className="h-9 w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All conditions</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="day_of_week">Weekly periodic</SelectItem>
                  <SelectItem value="day_of_month">Monthly periodic</SelectItem>
                  <SelectItem value="none">No condition</SelectItem>
                </SelectContent>
              </Select>
            </label>
            {walletConditionFilter !== "all" && (
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => setWalletConditionFilter("all")}
              >
                Clear filter
              </Button>
            )}
          </div>

          <div className="overflow-x-auto bg-white border rounded-2xl shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Restaurant</th>
                  <th className="px-5 py-3 font-semibold">Balance</th>
                  <th className="px-5 py-3 font-semibold">Visa Condition</th>
                  <th className="px-5 py-3 font-semibold">Remaining</th>
                  <th className="px-5 py-3 font-semibold">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWalletRestaurants.map((restaurant) => {
                  const progress = getVisaProgress(restaurant);
                  return (
                    <tr key={restaurant.restaurantId}>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/restaurants/transaction/${restaurant.restaurantId}`,
                            )
                          }
                          className="block max-w-[240px] truncate text-left font-semibold text-blue-700 hover:underline"
                          title={restaurant.restaurantName}
                        >
                          {restaurant.restaurantName}
                        </button>
                      </td>
                      <td
                        className={`px-5 py-4 font-mono font-bold ${
                          Number(restaurant.balance) < 0
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {restaurant.balance} E£
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-700">
                          {getVisaConditionLabel(
                            getVisaConditionType(restaurant),
                          )}
                        </div>
                        {getVisaConditionType(restaurant) ===
                          "day_of_week" && (
                          <div className="text-xs text-slate-500">
                            {restaurant.visaSwitchDayOfWeek ||
                              restaurant.visaSwitchProgress?.dayOfWeek}
                          </div>
                        )}
                        {getVisaConditionType(restaurant) ===
                          "day_of_month" && (
                          <div className="text-xs text-slate-500">
                            Day{" "}
                            {restaurant.visaSwitchDayOfMonth ||
                              restaurant.visaSwitchProgress?.dayOfMonth}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                        {progress.label}
                      </td>
                      <td className="min-w-[180px] px-5 py-4">
                        {progress.percent == null ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              role="progressbar"
                              aria-label={`${getVisaConditionLabel(
                                getVisaConditionType(restaurant),
                              )} progress`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={Math.round(progress.percent)}
                              className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
                            >
                              <div
                                className="h-full rounded-full bg-blue-600 transition-all"
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs font-medium text-slate-500">
                              {Math.round(progress.percent)}%
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredWalletRestaurants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-slate-500">
                      {walletRestaurants.length === 0
                        ? "No restaurant wallet balances were returned."
                        : "No restaurant wallet balances match this filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
            </>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {isLoading
                ? "Loading wallet management..."
                : "Wallet management data was not included in the financial report response."}
            </p>
          )}
        </section>
      <button
        onClick={exportPDF}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Export PDF
      </button>
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
