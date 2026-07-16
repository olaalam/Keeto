import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios"; // Adjust path if needed
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CalendarRange,
  Store,
  Coins,
  User,
  X,
  CheckCircle2,
  XCircle,
  Filter,
  Loader2,
} from "lucide-react";

const RESTAURANT_TYPES = ["super", "mega", "A", "B", "C", "C-"];

const SummaryCard = ({ title, value, icon: Icon, colorScheme }) => {
  const colors = {
    green: {
      bg: "bg-emerald-50",
      border: "border-emerald-500",
      text: "text-emerald-900",
      label: "text-emerald-600",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-600",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-500",
      text: "text-yellow-900",
      label: "text-yellow-600",
      iconBg: "bg-yellow-100",
      iconText: "text-yellow-600",
    },
  };

  const theme = colors[colorScheme] || colors.green;

  return (
    <div
      className={`${theme.bg} border-2 ${theme.border} rounded-3xl p-5 flex items-center justify-between gap-4 shadow-sm`}
    >
      <div className="min-w-0">
        <p
          className={`text-sm font-bold uppercase tracking-wider ${theme.label} truncate`}
        >
          {title}
        </p>
        <h2 className={`text-3xl font-bold mt-1 ${theme.text} truncate`}>
          {value}
        </h2>
      </div>
      <div
        className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${theme.iconBg} ${theme.iconText}`}
      >
        <Icon className="w-7 h-7" />
      </div>
    </div>
  );
};

export default function SalesReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [salesId, setSalesId] = useState("");

  const [selectedSalesman, setSelectedSalesman] = useState(null);

  // 1. Fetching Main List Data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["salesReport", startDate, endDate, selectedType, salesId],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/report/sales", {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          type: selectedType || undefined,
          salesId: salesId || undefined,
        },
      });
      return res.data?.data || {};
    },
  });

  // 2. Fetching Specific Details when a card is clicked
  const { data: detailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: [
      "salesReportDetail",
      selectedSalesman?.id,
      startDate,
      endDate,
      selectedType,
    ],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/report/sales", {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          type: selectedType || undefined,
          salesId: selectedSalesman.id, // Target the specific user
        },
      });
      // The API returns the list; grab the first (and only) matching user
      return res.data?.data?.salesList?.[0] || null;
    },
    enabled: !!selectedSalesman?.id, // Only run this query if the modal is open
  });

  const summary = reportData?.summary || {};
  const salesList = reportData?.salesList || [];

  const hasActiveFilters =
    startDate !== "" || endDate !== "" || selectedType !== "" || salesId !== "";

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedType("");
    setSalesId("");
  };

  // Decide which data object to show in the modal (fallback to basic list data while loading details)
  const displayData = detailData || selectedSalesman;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 bg-[#fafafa] min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800">Sales Report</h1>

      {/* Advanced Filter Bar */}
      <div className="bg-white border rounded-2xl p-4 flex flex-col sm:flex-row flex-wrap gap-4 items-center shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <CalendarRange className="w-5 h-5 text-slate-400 shrink-0" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-36 text-sm"
          />
          <span className="text-slate-300">—</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-36 text-sm"
          />
        </div>

        <div className="w-px h-8 bg-slate-200 hidden sm:block mx-1"></div>

        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex h-10 w-full sm:w-36 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All Types</option>
            {RESTAURANT_TYPES.map((t) => (
              <option key={t} value={t} className="uppercase">
                {t}
              </option>
            ))}
          </select>
{/* 
          <Input
            type="text"
            placeholder="Filter by Sales ID..."
            value={salesId}
            onChange={(e) => setSalesId(e.target.value)}
            className="w-full sm:max-w-xs text-sm"
          /> */}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 sm:ml-auto w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Top Global Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SummaryCard
          title="Total Restaurants"
          value={summary.totalActiveRestaurants ?? 0}
          icon={Store}
          colorScheme="green"
        />
        <SummaryCard
          title="Total Points"
          value={summary.totalActiveSalesPoints ?? 0}
          icon={Coins}
          colorScheme="yellow"
        />
      </div>

      {/* Salesmen List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-700">
          Sales Representatives
        </h2>

        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {salesList.map((salesman, index) => (
              <div
                key={salesman.id}
                onClick={() => setSelectedSalesman(salesman)}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative overflow-hidden"
              >
                <span className="absolute top-0 right-0 bg-slate-100 text-slate-400 text-xs font-bold px-3 py-1 rounded-bl-xl">
                  #{index + 1}
                </span>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0 border border-blue-100">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-lg truncate group-hover:text-blue-600 transition-colors">
                      {salesman.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {salesman.phone || "No phone available"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">
                      Total Rest
                    </p>
                    <p className="font-bold text-slate-700 mt-0.5">
                      {salesman.restaurantSummary?.totalRestaurants ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">
                      Total Points
                    </p>
                    <p className="font-bold text-yellow-600 mt-0.5">
                      {salesman.totalPoints ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {salesList.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white border border-dashed rounded-2xl">
                <p className="text-slate-500">
                  No salesmen found matching your filters.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Salesman Detail Pop-up */}
      <Dialog
        open={!!selectedSalesman}
        onOpenChange={(open) => !open && setSelectedSalesman(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-xl">
          {displayData && (
            <>
              {/* Header */}
              <DialogHeader className="bg-slate-50 p-5 border-b border-slate-100">
                <DialogTitle className="text-xl font-bold text-slate-800 text-center">
                  {displayData.name}
                </DialogTitle>
              {/*   <DialogDescription className="text-center mt-1">
                  ID:{" "}
                  <span className="font-mono text-xs text-slate-400">
                    {displayData.id}
                  </span>
                </DialogDescription> */}
              </DialogHeader>

              {/* Body */}
              <div className="p-5 space-y-6 bg-white max-h-[70vh] overflow-y-auto">
                {/* Active / Inactive Box */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-emerald-700">
                      {displayData.restaurantSummary?.activeCount ?? 0}
                    </p>
                    <p className="text-xs font-semibold text-emerald-600 uppercase">
                      Active Rest
                    </p>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                    <XCircle className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-rose-700">
                      {displayData.restaurantSummary?.inactiveCount ?? 0}
                    </p>
                    <p className="text-xs font-semibold text-rose-600 uppercase">
                      Inactive Rest
                    </p>
                  </div>
                </div>

                {/* Dynamic Restaurant Types */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                    Breakdown By Type
                  </h4>

                  {isLoadingDetail ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                      <p className="text-sm text-slate-500">
                        Loading breakdown data...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayData.groupedByType &&
                      displayData.groupedByType.length > 0 ? (
                        displayData.groupedByType.map((group, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100"
                          >
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                              <span className="text-sm font-bold text-slate-700 uppercase">
                                Type {group.type}
                              </span>
                              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                Total: {group.totalRestaurants ?? 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-medium px-1">
                              <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Active: {group.activeCount ?? 0}
                              </span>
                              <span className="text-rose-600 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                Inactive: {group.inactiveCount ?? 0}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-sm text-slate-500">
                            No type breakdown available.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
