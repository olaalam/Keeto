import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarRange } from "lucide-react";

const getVisaConditionType = (restaurant) =>
  restaurant.visaSwitchConditionType ||
  restaurant.visaSwitchProgress?.conditionType ||
  "none";

const getVisaConditionLabel = (conditionType) => {
  const labels = {
    amount: "Amount",
    day_of_week: "Weekly",
    day_of_month: "Monthly",
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
    (conditionType === "day_of_week" || conditionType === "day_of_month") &&
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
    label:
      conditionType === "none" ? "No automatic switch" : "Progress unavailable",
    percent: null,
  };
};

export default function WalletManagementReport() {
  const navigate = useNavigate();
  const {
    restaurantId,
    startDate: startDateParam,
    endDate: endDateParam,
  } = useParams();
  const [startDate, setStartDate] = useState(startDateParam || "");
  const [endDate, setEndDate] = useState(endDateParam || "");
  const [walletConditionFilter, setWalletConditionFilter] = useState("all");

  const resetDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

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
      const candidates = [res.data?.data?.data, res.data?.data, res.data];
      return (
        candidates.find(
          (candidate) =>
            candidate &&
            typeof candidate === "object" &&
            ("walletManagement" in candidate ||
              "macroFinancials" in candidate ||
              "totalAttemptedOrders" in candidate),
        ) ??
        candidates.find(
          (candidate) => candidate && typeof candidate === "object",
        )
      );
    },
  });

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
    doc.text("Wallet Management Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Period: ${startDate || "N/A"} - ${endDate || "N/A"}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [["Wallet Summary", "Value"]],
      body: [
        ["Net Balance", walletSummary.totalNetBalance || "0.00"],
        [
          "Due on Restaurants",
          `${walletSummary.totalDueOnRestaurants || "0.00"} E£`,
        ],
        [
          "Due to Restaurants",
          `${walletSummary.totalDueToRestaurants || "0.00"} E£`,
        ],
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

    doc.save(
      `Wallet_Management_Report_${startDate || ""}_${endDate || ""}.pdf`,
    );
  };

  return (
    <div className="container mx-auto space-y-8 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Wallet Management Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Wallet balances and Visa switch condition progress.
          </p>
        </div>
        <Button
          type="button"
          onClick={exportPDF}
          disabled={!walletManagement}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Export PDF
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 pr-2 text-slate-500">
          <CalendarRange className="h-4 w-4" />
          <span className="text-sm font-semibold">Filter by date</span>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          From
          <Input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-9 w-[160px]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          To
          <Input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="h-9 w-[160px]"
          />
        </label>
        {(startDate || endDate) && (
          <Button
            type="button"
            variant="ghost"
            className="h-9 text-slate-500 hover:text-slate-700"
            onClick={resetDateFilter}
          >
            Clear
          </Button>
        )}
      </div>

      {walletManagement ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-400">
                Total Net Balance
              </p>
              <p className="mt-1 font-mono text-2xl font-black text-slate-800">
                {walletSummary.totalNetBalance || "0.00"} E£
              </p>
            </div>
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-400">
                Due on Restaurants
              </p>
              <p className="mt-1 font-mono text-2xl font-black text-emerald-600">
                {walletSummary.totalDueOnRestaurants || "0.00"} E£
              </p>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-400">
                Due to Restaurants
              </p>
              <p className="mt-1 font-mono text-2xl font-black text-rose-600">
                {walletSummary.totalDueToRestaurants || "0.00"} E£
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4">
            <div className="text-sm font-semibold text-slate-700">
              Wallet filters
              <p className="mt-1 text-xs font-normal text-slate-500">
                Date range applies to the wallet report data.
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
                  <SelectItem electItem value="day_of_month">
                    Monthly periodic
                  </SelectItem>
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

          <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
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
                  const conditionType = getVisaConditionType(restaurant);
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
                          {getVisaConditionLabel(conditionType)}
                        </div>
                        {conditionType === "day_of_week" && (
                          <div className="text-xs text-slate-500">
                            {restaurant.visaSwitchDayOfWeek ||
                              restaurant.visaSwitchProgress?.dayOfWeek}
                          </div>
                        )}
                        {conditionType === "day_of_month" && (
                          <div className="text-xs text-slate-500">
                            Day{" "}
                            {restaurant.visaSwitchDayOfMonth ||
                              restaurant.visaSwitchProgress?.dayOfMonth}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
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
                                conditionType,
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
                    <td
                      colSpan={5}
                      className="px-5 py-6 text-center text-slate-500"
                    >
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
    </div>
  );
}
