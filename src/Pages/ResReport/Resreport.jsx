import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  ShoppingBag,
  Store,
  Tag,
  CalendarRange,
  CheckCircle2,
  XCircle,
  Wallet,
  Filter,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

// Consistent color rotation for the dynamic "type" cards
const TYPE_COLORS = [
  "bg-blue-50 text-blue-600",
  "bg-amber-50 text-amber-600",
  "bg-indigo-50 text-indigo-600",
  "bg-rose-50 text-rose-600",
  "bg-purple-50 text-purple-600",
  "bg-cyan-50 text-cyan-600",
  "bg-orange-50 text-orange-600",
];
const TYPE_ORDER = ["mega", "super", "A", "B", "C", "C-", "test"];

export default function ResReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [minOrders, setMinOrders] = useState("");
  const [maxOrders, setMaxOrders] = useState("");
  // "" = no sort, "asc" = fewest orders first, "desc" = most orders first
  const [orderSort, setOrderSort] = useState("");

  // "total" means no type param is sent (server returns every type); any other value
  // is sent to the API as the `type` param, same pattern as startDate/endDate.
  const [activeFilter, setActiveFilter] = useState("total");
  const [showTable, setShowTable] = useState(false);
  // Holds the full restaurant row (restaurantDetails + ordersCount) whose details popup is open
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const resetDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };
  const toggleType = (type) => {
    if (type === "all") {
      setSelectedTypes([]);
      return;
    }

    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };
  const { data: reportData, isLoading } = useQuery({
    queryKey: [
      "restaurantOrdersReport",
      startDate,
      endDate,
      activeFilter,
      selectedTypes,
    ],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/report/restaurant-orders", {
        params: {
          startDate,
          endDate,
          type: activeFilter !== "total" ? activeFilter : undefined,
        },
      });
      return res.data?.data?.data || res.data?.data;
    },
  });
  const summary = reportData?.summary || {};
  const restaurants = reportData?.restaurants || [];
  const restaurantsByType = summary.restaurantsByType || {};
  const orderedTypes = TYPE_ORDER.filter(
    (type) => restaurantsByType[type] !== undefined,
  ).map((type, idx) => ({
    key: type,
    title: `Type: ${type}`,
    value: restaurantsByType[type],
    icon: Tag,
    bgColor: TYPE_COLORS[idx % TYPE_COLORS.length],
    clickable: true,
  }));
  // Inactive restaurants are never shown to the user — filtered out from the start,
  // no toggle needed. Type filtering itself already happened server-side via the API param.
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(
      (r) => (r.restaurantDetails?.status || "inactive") === "active",
    );
  }, [restaurants]);
  const displayedRestaurants = useMemo(() => {
    let data = [...filteredRestaurants];

    // The type-filter buttons only apply while in "All Restaurants" mode.
    // Once a stat card is selected (activeFilter !== "total"), the card's
    // own type already scoped the data via the API call above, so
    // selectedType must not filter it again.
    if (activeFilter === "total" && selectedTypes.length > 0) {
      data = data.filter((r) =>
        selectedTypes.some(
          (type) =>
            type.toLowerCase() ===
            (r.restaurantDetails?.type || "").toLowerCase(),
        ),
      );
    }

    // Filter by order count range (inclusive). Blank = no bound on that side.
    if (minOrders !== "") {
      const min = Number(minOrders);
      data = data.filter((r) => (r.ordersCount ?? 0) >= min);
    }
    if (maxOrders !== "") {
      const max = Number(maxOrders);
      data = data.filter((r) => (r.ordersCount ?? 0) <= max);
    }

    // Sort by order count, if requested.
    if (orderSort === "asc") {
      data.sort((a, b) => (a.ordersCount ?? 0) - (b.ordersCount ?? 0));
    } else if (orderSort === "desc") {
      data.sort((a, b) => (b.ordersCount ?? 0) - (a.ordersCount ?? 0));
    }

    return data;
  }, [
    filteredRestaurants,
    selectedTypes,
    activeFilter,
    minOrders,
    maxOrders,
    orderSort,
  ]);

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Restaurant Orders Report", 14, 20);

    doc.setFontSize(11);
    doc.text(`Period: ${startDate || "N/A"} - ${endDate || "N/A"}`, 14, 30);

    // Summary table
    autoTable(doc, {
      startY: 40,
      head: [["Metric", "Value"]],
      body: [
        ["Total Orders", summary.totalOrders ?? 0],
        ["Total Restaurants", summary.totalRestaurants ?? 0],
        ["Valid Orders", summary.validOrders ?? 0],
        ["Canceled Orders", summary.canceledOrders ?? 0],

        ["Total Commission", (summary.total_commission ?? 0).toFixed(2)],
        ...Object.entries(restaurantsByType).map(([type, count]) => [
          `Type: ${type}`,
          count,
        ]),
      ],
    });

    // Restaurants table (reflects whichever card is currently selected)
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Restaurant", "Type", "Orders Count", "Status"]],
      body: filteredRestaurants.map((r) => {
        const d = r.restaurantDetails || {};
        return [
          d.name || d.nameAr || "-",
          d.type || "Unknown",
          r.ordersCount ?? 0,
          d.status || "-",
        ];
      }),
    });

    doc.save(
      `Restaurant_Orders_Report_${activeFilter}_${startDate || ""}_${endDate || ""}.pdf`,
    );
  };

  // Top stat cards: Total Orders + Total Restaurants + one card per type
  const statsCards = [
    {
      key: "total",
      title: "Total Orders",
      value: summary.totalOrders ?? 0,
      icon: ShoppingBag,
      bgColor: "bg-blue-50 text-blue-600",
      clickable: true,
    },
    {
      key: "restaurants-count",
      title: "Total Restaurants",
      value: summary.totalRestaurants ?? 0,
      icon: Store,
      bgColor: "bg-emerald-50 text-emerald-600",
      clickable: false,
    },
    {
      key: "valid-orders",
      title: "Valid Orders",
      value: summary.validOrders ?? 0,
      icon: CheckCircle2,
      bgColor: "bg-emerald-50 text-emerald-600",
      clickable: false,
    },
    {
      key: "canceled-orders",
      title: "Canceled Orders",
      value: summary.canceledOrders ?? 0,

      icon: XCircle,
      bgColor: "bg-rose-50 text-rose-600",
      clickable: false,
    },
    {
      key: "total-commission",
      title: "Total Commission",
      value: `${(summary.total_commission ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} EGP`,
      icon: Wallet,
      bgColor: "bg-amber-50 text-amber-600",
      clickable: false,
    },

    ...orderedTypes,
  ];

  // Table columns for the restaurants list (nested restaurantDetails object)
  const columns = [
    {
      accessorKey: "restaurantDetails.name",
      header: () => (
        <div className="text-left font-bold min-w-[160px]">Restaurant</div>
      ),
      cell: ({ row }) => {
        const details = row.original.restaurantDetails || {};
        return (
          <button
            type="button"
            onClick={() => setSelectedRestaurant(row.original)}
            className="text-left font-bold text-blue-600 hover:underline underline-offset-2"
          >
            {details.name || details.nameAr || "-"}
          </button>
        );
      },
    },
    {
      accessorKey: "restaurantDetails.type",
      header: () => (
        <div className="text-center font-bold min-w-[80px]">Type</div>
      ),
      cell: ({ row }) => {
        const type = row.original.restaurantDetails?.type || "Unknown";
        return (
          <div className="text-center">
            <span className="inline-block px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
              {type}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "ordersCount",
      header: () => (
        <div className="text-right font-bold min-w-[100px]">Orders Count</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-semibold font-mono text-blue-600">
          {row.getValue("ordersCount") ?? 0}
        </div>
      ),
    },
    {
      accessorKey: "restaurantDetails.status",
      header: () => (
        <div className="text-center font-bold min-w-[100px]">Status</div>
      ),
      cell: ({ row }) => {
        const status = row.original.restaurantDetails?.status || "-";
        const isActive = status === "active";
        return (
          <div className="text-center">
            <span
              className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold capitalize ${
                isActive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {status}
            </span>
          </div>
        );
      },
    },
  ];
  const filteredTotalOrders = useMemo(() => {
    return displayedRestaurants.reduce(
      (sum, restaurant) => sum + (restaurant.ordersCount || 0),
      0,
    );
  }, [displayedRestaurants]);
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Restaurant Orders Report
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of order totals by restaurant and business type.
        </p>
      </div>

      {/* فلتر التاريخ */}
      <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4">
        <div className="flex items-center gap-2 text-slate-500">
          <CalendarRange className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">Filter by date</span>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:w-auto sm:gap-4">
          <div className="flex flex-col gap-1 w-full sm:w-[160px]">
            <label className="text-xs font-medium text-slate-400">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-full"
            />
          </div>

          <div className="flex flex-col gap-1 w-full sm:w-[160px]">
            <label className="text-xs font-medium text-slate-400">To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-full"
            />
          </div>
        </div>

        {(startDate || endDate) && (
          <Button
            variant="ghost"
            className="h-9 w-full sm:w-auto text-slate-500 hover:text-slate-700"
            onClick={resetDateFilter}
          >
            Clear
          </Button>
        )}
      </div>

      {/* فلتر عدد الطلبات (نطاق) + الترتيب تصاعدي/تنازلي */}
      <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">Filter by order count</span>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:w-auto sm:gap-4">
          <div className="flex flex-col gap-1 w-full sm:w-[140px]">
            <label className="text-xs font-medium text-slate-400">Min</label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={minOrders}
              onChange={(e) => setMinOrders(e.target.value)}
              className="h-9 w-full"
            />
          </div>

          <div className="flex flex-col gap-1 w-full sm:w-[140px]">
            <label className="text-xs font-medium text-slate-400">Max</label>
            <Input
              type="number"
              min="0"
              placeholder="Any"
              value={maxOrders}
              onChange={(e) => setMaxOrders(e.target.value)}
              className="h-9 w-full"
            />
          </div>
        </div>

        {(minOrders !== "" || maxOrders !== "") && (
          <Button
            variant="ghost"
            className="h-9 w-full sm:w-auto text-slate-500 hover:text-slate-700"
            onClick={() => {
              setMinOrders("");
              setMaxOrders("");
            }}
          >
            Clear
          </Button>
        )}

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <Button
            type="button"
            variant={orderSort === "asc" ? "default" : "outline"}
            className="h-9 flex-1 sm:flex-none"
            onClick={() => setOrderSort(orderSort === "asc" ? "" : "asc")}
          >
            <ArrowUp className="w-4 h-4 mr-1" />
            Orders
          </Button>
          <Button
            type="button"
            variant={orderSort === "desc" ? "default" : "outline"}
            className="h-9 flex-1 sm:flex-none"
            onClick={() => setOrderSort(orderSort === "desc" ? "" : "desc")}
          >
            <ArrowDown className="w-4 h-4 mr-1" />
            Orders
          </Button>
        </div>
      </div>
      {/* Type filter buttons only make sense in "All Restaurants" mode.
          Once a stat card is picked, its own type takes over, so these
          are hidden to avoid the two filters conflicting. */}
      {activeFilter === "total" && (
        <div className="flex flex-wrap gap-2">
          {["all", "mega", "super", "A", "B", "C", "C-", "test"].map((type) => (
            <Button
              key={type}
              variant={
                type === "all"
                  ? selectedTypes.length === 0
                    ? "default"
                    : "outline"
                  : selectedTypes.includes(type)
                    ? "default"
                    : "outline"
              }
              onClick={() => toggleType(type)}
            >
              {type === "all"
                ? "All"
                : type === "mega"
                  ? "Mega"
                  : type === "super"
                    ? "Super"
                    : type === "A"
                      ? " A"
                      : type === "B"
                        ? " B"
                        : type === "C"
                          ? " C"
                          : type === "C-"
                            ? " C-"
                            : type === "test"
                              ? " Test"
                              : type}
            </Button>
          ))}
        </div>
      )}

      {/* كروت الإحصائيات: قابلة للنقر للفلترة */}
      {!showTable && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsCards.map((card) => {
            const Icon = card.icon;
            const isActive = activeFilter === card.key;
            return (
              <button
                key={card.key}
                type="button"
                disabled={!card.clickable}
                onClick={() => {
                  if (!card.clickable) return;

                  setActiveFilter(card.key);
                  setShowTable(true);
                }}
                className={`text-left bg-white border rounded-2xl shadow-sm p-5 flex items-center justify-between transition ${
                  card.clickable
                    ? "cursor-pointer hover:shadow-md"
                    : "cursor-default"
                } ${isActive ? "ring-2 ring-blue-500 border-blue-200" : ""}`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    {card.title}
                  </p>
                  <h2 className="text-2xl font-black mt-1 text-slate-800 font-mono tracking-tight">
                    {card.value}
                  </h2>
                  {card.subtitle && (
                    <p className="text-xs text-slate-400 mt-1">
                      {card.subtitle}
                    </p>
                  )}
                </div>

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bgColor}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={exportPDF}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Export PDF
      </button>
      {showTable && (
        <div className="flex items-center justify-between mb-5">
          <Button
            variant="outline"
            onClick={() => {
              setShowTable(false);
              setActiveFilter("total");
            }}
          >
            ← Back
          </Button>

          {/*  <h2 className="text-xl font-bold">
            {activeFilter === "total"
              ? "All Restaurants"
              : `Restaurants - ${activeFilter}`}
          </h2> */}
        </div>
      )}
      {/* جدول المطاعم: يعكس الكارت المختار (الكل أو نوع محدد) */}

      {showTable && (
        <>
          <div className="flex justify-end mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
              <p className="text-xs text-slate-500">
                Total Orders (Current Filter)
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredTotalOrders.toLocaleString()}
              </p>
            </div>
          </div>

          <GenericDataTable
            title={
              activeFilter === "total"
                ? "All Restaurants"
                : `Restaurants — Type "${activeFilter}"`
            }
            columns={columns}
            data={displayedRestaurants}
            isLoading={isLoading}
            queryKey="restaurantOrdersReport"
            onEdit={false}
            actions={false}
          />
        </>
      )}

      {/* Popup showing full restaurant details when a name is clicked */}
      <Dialog
        open={!!selectedRestaurant}
        onOpenChange={(open) => !open && setSelectedRestaurant(null)}
      >
        <DialogContent className="max-w-lg">
          {selectedRestaurant &&
            (() => {
              const d = selectedRestaurant.restaurantDetails || {};
              const isActive = d.status === "active";
              const owner =
                `${d.ownerFirstName || ""} ${d.ownerLastName || ""}`.trim();

              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      {d.logo && (
                        <img
                          src={d.logo}
                          alt={d.name}
                          className="w-14 h-14 rounded-xl object-cover border"
                        />
                      )}
                      <div>
                        <DialogTitle className="text-lg">
                          {d.name || d.nameAr || "-"}
                        </DialogTitle>
                        <DialogDescription asChild>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-semibold capitalize ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-rose-50 text-rose-600"
                              }`}
                            >
                              {d.status || "-"}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                              {d.type || "Unknown"}
                            </span>
                          </div>
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-4 text-sm mt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Orders Count
                        </p>
                        <p className="font-semibold font-mono text-blue-600">
                          {selectedRestaurant.ordersCount ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Delivery Time
                        </p>
                        <p className="font-semibold text-slate-700">
                          {d.minDeliveryTime || 0}–{d.maxDeliveryTime || 0}{" "}
                          {d.deliveryTimeUnit || "min"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Responsible Person
                      </p>
                      <p className="font-semibold text-slate-700">
                        {owner || "-"}
                      </p>
                       <p className="text-xs font-medium text-slate-400">
                        Responsible Person position
                      </p>
                        <p className="font-semibold text-slate-700">
                        {d.ownerposition || "-"}
                      </p>
                      <p className="text-slate-500">{d.ownerPhone || "-"}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Address
                      </p>
                      <p className="font-medium text-slate-700">
                        {d.address || d.addressAr || "-"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Tax Number
                        </p>
                        <p className="font-medium text-slate-700">
                          {d.taxNumber || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Tax Expiry
                        </p>
                        <p className="font-medium text-slate-700">
                          {d.taxExpireDate
                            ? new Date(d.taxExpireDate).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                    </div>

                    {d.taxCertificate && (
                      <button
                        type="button"
                        onClick={() => window.open(d.taxCertificate, "_blank")}
                        className="text-blue-600 text-sm font-medium hover:underline"
                      >
                        View Tax Certificate
                      </button>
                    )}

                    <div className="text-xs text-slate-400 pt-2 border-t">
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
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
