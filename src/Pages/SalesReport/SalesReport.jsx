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
  ArrowLeft,
  ChevronRight,
  Phone,
  MessageCircle,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
const RESTAURANT_TYPES = ["super", "mega", "A", "B", "C", "C-"];

// Inline Custom SVGs (kept consistent with ResReport) to avoid lucide-react export issues
const FacebookIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

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
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedSalesman, setSelectedSalesman] = useState(null);

  // Controls the salesman popup's sub-view:
  // null = "breakdown by type" summary view
  // "all" = flat list of all restaurants (opened from Active/Inactive boxes)
  // any other string = a specific restaurant type (opened from a type card), e.g. "C", "C-"
  const [restaurantListSource, setRestaurantListSource] = useState(null);
  // The id of the restaurant the user clicked inside that list, used to fetch its details
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

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

  // 3. Fetching restaurant details.
  // CONFIRMED response shape from /api/superadmin/report/restaurant-orders:
  //   res.data.data.data.restaurants = [
  //     { restaurantDetails: { id, name, ... }, ordersCount, validOrders, ... },
  //     ...
  //   ]
  // IMPORTANT: this backend endpoint ignores any `restaurantId` filter and
  // always returns the full list of restaurants. So instead of re-fetching
  // (and re-filtering) on every click, we fetch this list ONCE, cache it,
  // and just look up the clicked restaurant locally by id — that's also
  // what actually fixes "every restaurant opens the same one".
  const {
    data: allRestaurantDetails,
    isLoading: isLoadingAllRestaurantDetails,
  } = useQuery({
    queryKey: ["allRestaurantDetails"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/report/restaurant-orders");
      const list = res.data?.data?.data?.restaurants;
      return Array.isArray(list) ? list : [];
    },
    // Only bother fetching once the user has actually opened a restaurant
    // list/detail, and keep it cached for the rest of the session.
    enabled: !!restaurantListSource || !!selectedRestaurantId,
    staleTime: 5 * 60 * 1000,
  });

  const restaurantDetailData = selectedRestaurantId
    ? (allRestaurantDetails || []).find(
        (r) => r.restaurantDetails?.id === selectedRestaurantId,
      ) || null
    : null;

  const isLoadingRestaurantDetail =
    !!selectedRestaurantId &&
    isLoadingAllRestaurantDetails &&
    !restaurantDetailData;

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
  const fetchSalesDetails = async () => {
    setExportLoading(true);

    try {
      const details = await Promise.all(
        salesList.map(async (salesman) => {
          const res = await api.get("/api/superadmin/report/sales", {
            params: {
              startDate: startDate || undefined,
              endDate: endDate || undefined,
              type: selectedType || undefined,
              salesId: salesman.id,
            },
          });

          return res.data?.data?.salesList?.[0];
        }),
      );

      console.log(details);

      return details;
    } finally {
      setExportLoading(false);
    }
  };
  const exportPDF = async () => {
    const details = await fetchSalesDetails();

    const doc = new jsPDF("landscape");
    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 300, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Sales Report", 14, 16);

    doc.setTextColor(120);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate || "N/A"} - ${endDate || "N/A"}`, 14, 35);
    const cards = [
      {
        title: "Restaurants",
        value: summary.totalActiveRestaurants ?? 0,
      },
      {
        title: "Points",
        value: summary.totalActiveSalesPoints ?? 0,
      },
      {
        title: "Sales Reps",
        value: details.length,
      },
    ];

    let x = 14;

    cards.forEach((card) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, 45, 80, 25, 3, 3, "F");

      doc.setTextColor(100);
      doc.setFontSize(9);
      doc.text(card.title, x + 4, 53);

      doc.setTextColor(30);
      doc.setFontSize(14);
      doc.text(String(card.value), x + 4, 64);

      x += 90;
    });
    autoTable(doc, {
      startY: 85,
      head: [["Sales", "Phone", "Restaurants", "Active", "Inactive", "Points"]],
      body: details.map((item) => [
        item.name,
        item.phone,
        item.restaurantSummary.totalRestaurants,
        item.restaurantSummary.activeCount,
        item.restaurantSummary.inactiveCount,
        item.totalPoints,
      ]),
    });
    details.forEach((salesman) => {
      doc.addPage();

      // Title
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text(salesman.name, 14, 20);

      // معلومات الـ Sales
      doc.setFontSize(11);
      doc.setTextColor(90);

      doc.text(`Phone: ${salesman.phone || "-"}`, 14, 35);
      doc.text(`Status: ${salesman.status}`, 14, 43);

      doc.text(
        `Restaurants: ${salesman.restaurantSummary.totalRestaurants}`,
        110,
        35,
      );

      doc.text(`Active: ${salesman.restaurantSummary.activeCount}`, 110, 43);

      doc.text(
        `Inactive: ${salesman.restaurantSummary.inactiveCount}`,
        190,
        35,
      );

      doc.text(`Points: ${salesman.totalPoints}`, 190, 43);
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("Restaurant Type Breakdown", 14, 60);
      autoTable(doc, {
        startY: 65,

        head: [["Type", "Total", "Active", "Inactive"]],

        body: salesman.groupedByType.map((item) => [
          item.type,
          item.totalRestaurants,
          item.activeCount,
          item.inactiveCount,
        ]),

        styles: {
          fontSize: 10,
          cellPadding: 3,
        },

        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
        },
      });
      const typeMap = {};

      salesman.groupedByType.forEach((group) => {
        group.restaurants?.forEach((restaurant) => {
          typeMap[restaurant.id] = group.type;
        });
      });
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("Restaurants", 14, doc.lastAutoTable.finalY + 10);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,

        head: [["Restaurant", "Type"]],

        body: salesman.restaurants.map((restaurant) => [
          restaurant.name,

          typeMap[restaurant.id] || "-",
          
        ]),

        styles: {
          fontSize: 9,
          cellPadding: 3,
        },

        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
        },
      });
    });

    doc.save("Sales_Report.pdf");
  };
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 bg-[#fafafa] min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800">Sales Report</h1>
      <Button onClick={exportPDF} disabled={exportLoading}>
        {exportLoading ? "Generating..." : "Export PDF"}
      </Button>
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
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSalesman(null);
            setRestaurantListSource(null);
            setSelectedRestaurantId(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-xl">
          {displayData && (
            <>
              {/* Header */}
              <DialogHeader className="bg-slate-50 p-5 border-b border-slate-100">
                {restaurantListSource && (
                  <button
                    onClick={() => setRestaurantListSource(null)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to summary
                  </button>
                )}
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
                {!restaurantListSource ? (
                  <>
                    {/* Active / Inactive Box - click either to see the full restaurant list */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setRestaurantListSource("all")}
                        className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-emerald-700">
                          {displayData.restaurantSummary?.activeCount ?? 0}
                        </p>
                        <p className="text-xs font-semibold text-emerald-600 uppercase">
                          Active Rest
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRestaurantListSource("all")}
                        className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center hover:border-rose-300 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <XCircle className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-rose-700">
                          {displayData.restaurantSummary?.inactiveCount ?? 0}
                        </p>
                        <p className="text-xs font-semibold text-rose-600 uppercase">
                          Inactive Rest
                        </p>
                      </button>
                    </div>

                    {/* Dynamic Restaurant Types - click a type card to see just its restaurants */}
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
                            displayData.groupedByType.map((group, idx) => {
                              const isEmpty =
                                (group.totalRestaurants ?? 0) === 0;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  disabled={isEmpty}
                                  onClick={() =>
                                    !isEmpty &&
                                    setRestaurantListSource(group.type)
                                  }
                                  className={`w-full flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100 text-left transition-all ${
                                    isEmpty
                                      ? "opacity-50 cursor-not-allowed"
                                      : "hover:border-blue-300 hover:shadow-sm cursor-pointer"
                                  }`}
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
                                </button>
                              );
                            })
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
                  </>
                ) : (
                  /* Restaurant list — either "all" (flat list) or a specific type's restaurants.
                     Click one to fetch and view its full details. */
                  (() => {
                    const restaurants =
                      restaurantListSource === "all"
                        ? displayData.restaurants || []
                        : displayData.groupedByType?.find(
                            (g) => g.type === restaurantListSource,
                          )?.restaurants || [];

                    // Only needed for the flat "all" list — a specific type list
                    // already shows its type in the header.
                    const typeById = {};
                    if (restaurantListSource === "all") {
                      (displayData.groupedByType || []).forEach((group) => {
                        (group.restaurants || []).forEach((r) => {
                          typeById[r.id] = group.type;
                        });
                      });
                    }

                    const listTitle =
                      restaurantListSource === "all"
                        ? `Restaurants (${restaurants.length})`
                        : `Type ${restaurantListSource} Restaurants (${restaurants.length})`;

                    return (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                          {listTitle}
                        </h4>

                        {restaurants.length > 0 ? (
                          restaurants.map((restaurant) => (
                            <button
                              key={restaurant.id}
                              type="button"
                              onClick={() =>
                                setSelectedRestaurantId(restaurant.id)
                              }
                              className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-300 hover:shadow-sm transition-all text-left"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate">
                                  {restaurant.name}
                                </p>
                                {restaurant.nameAr && (
                                  <p className="text-xs text-slate-400 truncate">
                                    {restaurant.nameAr}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {restaurantListSource === "all" &&
                                  typeById[restaurant.id] && (
                                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">
                                      {typeById[restaurant.id]}
                                    </span>
                                  )}
                                {restaurant.status && (
                                  <span
                                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                                      restaurant.status === "active"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-rose-50 text-rose-600"
                                    }`}
                                  >
                                    {restaurant.status}
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm text-slate-500">
                              No restaurants available.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Restaurant Detail Pop-up — opened from the restaurant list above, styled to match ResReport's popup */}
      <Dialog
        open={!!selectedRestaurantId}
        onOpenChange={(open) => !open && setSelectedRestaurantId(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6">
          {isLoadingRestaurantDetail || !restaurantDetailData ? (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-slate-500">
                Loading restaurant details...
              </p>
            </div>
          ) : (
            (() => {
              const rd = restaurantDetailData || {};
              const d = rd.restaurantDetails || rd;
              const isActive = d.status === "active";
              const owner =
                `${d.ownerFirstName || ""} ${d.ownerLastName || ""}`.trim();
              const phoneRegex = d.ownerPhone
                ? d.ownerPhone.replace(/\D/g, "")
                : "";

              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                      {d.logo && (
                        <img
                          src={d.logo}
                          alt={d.name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm"
                        />
                      )}
                      <div>
                        <DialogTitle className="text-lg font-bold text-slate-800">
                          {d.name || d.nameAr || "-"}
                        </DialogTitle>
                        <DialogDescription asChild>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-rose-50 text-rose-600"
                              }`}
                            >
                              {d.status || "-"}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
                              {d.type || "Unknown"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${
                                d.deliverystatus === "delivered"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {d.deliverystatus === "delivered"
                                ? "Delivered"
                                : "Not Delivered"}
                            </span>
                          </div>
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-5 text-sm pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 mb-0.5">
                          Orders Count
                        </p>
                        <p className="font-bold font-mono text-blue-600 text-lg">
                          {rd.ordersCount ?? 0}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 mb-0.5">
                          Delivery Time
                        </p>
                        <p className="font-bold text-slate-700 text-lg">
                          {d.minDeliveryTime || 0}–{d.maxDeliveryTime || 0}
                          <span className="text-xs font-normal text-slate-400 ml-1">
                            {d.deliveryTimeUnit || "min"}
                          </span>
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 mb-0.5">
                          Delivery Status
                        </p>
                        <p
                          className={`font-bold text-lg capitalize ${
                            d.deliverystatus === "delivered"
                              ? "text-emerald-600"
                              : "text-slate-500"
                          }`}
                        >
                          {d.deliverystatus === "delivered"
                            ? "Delivered"
                            : "Not Delivered"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Sales Representative
                        </p>
                        <p className="font-semibold text-slate-700 mt-0.5">
                          {d.salesObj?.name || selectedSalesman?.name || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Responsible Person
                        </p>
                        <p className="font-semibold text-slate-700 mt-0.5">
                          {owner || "-"}
                          {d.ownerposition && (
                            <span className="text-slate-400 font-normal text-xs ml-1">
                              ({d.ownerposition})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Contact Channels & Custom Social Links */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Contact Channels & Links
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {d.ownerPhone && (
                          <>
                            <a
                              href={`tel:${d.ownerPhone}`}
                              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors border border-slate-200/40"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              Call
                            </a>
                            <a
                              href={`https://wa.me/${phoneRegex}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-50 text-green-600 rounded-xl text-xs font-semibold hover:bg-green-100 transition-colors border border-green-200/40"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WhatsApp Chat
                            </a>
                          </>
                        )}

                        {d.facebookLink && (
                          <a
                            href={d.facebookLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors border border-blue-200/40"
                          >
                            <FacebookIcon className="w-3.5 h-3.5" />
                            Facebook Page
                          </a>
                        )}

                        {d.orderLink && (
                          <a
                            href={d.orderLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors border border-indigo-200/40"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            Direct Order Link
                          </a>
                        )}
                      </div>

                      {!d.ownerPhone && !d.facebookLink && !d.orderLink && (
                        <p className="text-xs text-slate-400 italic">
                          No contact lines or metadata available.
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 pt-3 border-t border-slate-100">
                      Registered{" "}
                      {d.createdAt
                        ? new Date(d.createdAt).toLocaleDateString()
                        : "-"}
                      {d.updatedAt &&
                        ` · Updated ${new Date(d.updatedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </>
              );
            })()
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
