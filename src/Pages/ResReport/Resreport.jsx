import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
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
  Filter,
  ArrowUp,
  ArrowDown,
  ShoppingBag,
  Store,
  CheckCircle2,
  XCircle,
  Wallet,
  Tag,
  X,
  Phone,
  MessageCircle,
} from "lucide-react";

// Inline Custom SVGs to prevent lucide-react version export errors
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

// Standardized dashboard card component modeled after the provided screenshot
const Card = ({ title, value, icon: Icon, borderColor, bgColor }) => (
  <div
    className={`bg-white border-2 ${borderColor} rounded-3xl p-4 sm:p-6 flex items-center justify-between gap-3`}
  >
    <div className="min-w-0">
      <p className="text-sm text-slate-500 font-medium truncate">{title}</p>
      <h2 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900 truncate">
        {value}
      </h2>
    </div>
    <div
      className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${bgColor}`}
    >
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

const RESTAURANT_TYPES = ["all", "mega", "super", "A", "B", "C", "C-", "test"];

export default function ResReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minOrders, setMinOrders] = useState("");
  const [maxOrders, setMaxOrders] = useState("");

  const [minOrdersInput, setMinOrdersInput] = useState("");
  const [maxOrdersInput, setMaxOrdersInput] = useState("");
  const [orderSort, setOrderSort] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setMinOrders(minOrdersInput), 300);
    return () => clearTimeout(t);
  }, [minOrdersInput]);

  useEffect(() => {
    const t = setTimeout(() => setMaxOrders(maxOrdersInput), 300);
    return () => clearTimeout(t);
  }, [maxOrdersInput]);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["restaurantOrdersReport", startDate, endDate],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/report/restaurant-orders", {
        params: { startDate, endDate },
      });
      return res.data?.data?.data || res.data?.data;
    },
  });

  const summary = reportData?.summary || {};
  const restaurants = reportData?.restaurants || [];

  const displayedRestaurants = useMemo(() => {
    let data = restaurants.filter(
      (r) => (r.restaurantDetails?.status || "inactive") === "active",
    );
    if (selectedTypes.length > 0 && !selectedTypes.includes("all")) {
      data = data.filter((r) =>
        selectedTypes.includes(r.restaurantDetails?.type),
      );
    }
    if (minOrders !== "")
      data = data.filter((r) => (r.ordersCount ?? 0) >= Number(minOrders));
    if (maxOrders !== "")
      data = data.filter((r) => (r.ordersCount ?? 0) <= Number(maxOrders));
    if (orderSort === "asc")
      data.sort((a, b) => (a.ordersCount ?? 0) - (b.ordersCount ?? 0));
    if (orderSort === "desc")
      data.sort((a, b) => (b.ordersCount ?? 0) - (a.ordersCount ?? 0));
    return data;
  }, [restaurants, selectedTypes, minOrders, maxOrders, orderSort]);

  const filteredSummary = useMemo(() => {
    return displayedRestaurants.reduce(
      (acc, restaurant) => {
        acc.totalRestaurants += 1;
        acc.totalOrders += restaurant.ordersCount || 0;
        acc.totalCommission += restaurant.total_commission || 0;

        return acc;
      },
      {
        totalRestaurants: 0,
        totalOrders: 0,
        totalCommission: 0,
      },
    );
  }, [displayedRestaurants]);

  // Generate stats grouped by type for the filtered restaurants
  const statsByType = useMemo(() => {
    // 1. Initialize with predefined order (excluding 'all' since it's a filter, not a type)
    const statsMap = new Map();
    RESTAURANT_TYPES.filter((t) => t !== "all").forEach((type) => {
      statsMap.set(type, { count: 0, orders: 0 });
    });

    // 2. Populate with actual data
    displayedRestaurants.forEach((r) => {
      const type = r.restaurantDetails?.type || "Unknown";

      // If a new/unknown type appears that isn't in RESTAURANT_TYPES, append it to the end
      if (!statsMap.has(type)) {
        statsMap.set(type, { count: 0, orders: 0 });
      }

      const current = statsMap.get(type);
      current.count += 1;
      current.orders += r.ordersCount || 0;
    });

    // 3. Return as an array of entries to strictly preserve the insertion order
    return Array.from(statsMap.entries());
  }, [displayedRestaurants]);

  const toggleType = useCallback((type) => {
    if (type === "all") setSelectedTypes([]);
    else
      setSelectedTypes((prev) =>
        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
      );
  }, []);

  const toggleSort = useCallback((dir) => {
    setOrderSort((prev) => (prev === dir ? "" : dir));
  }, []);

  const hasActiveFilters =
    minOrdersInput !== "" ||
    maxOrdersInput !== "" ||
    orderSort !== "" ||
    selectedTypes.length > 0 ||
    startDate !== "" ||
    endDate !== "";

  const clearFilters = useCallback(() => {
    setMinOrdersInput("");
    setMaxOrdersInput("");
    setMinOrders("");
    setMaxOrders("");
    setOrderSort("");
    setSelectedTypes([]);
    setStartDate("");
    setEndDate("");
  }, []);

  const restaurantColumns = useMemo(
    () => [
      {
        accessorKey: "restaurantDetails.name",
        header: "Restaurant",
        cell: ({ row }) => (
          <button
            onClick={() => setSelectedRestaurant(row.original)}
            className="text-blue-600 hover:underline"
          >
            {row.original.restaurantDetails?.name}
          </button>
        ),
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
        accessorKey: "total_commission",
        header: () => (
          <div className="text-right font-bold min-w-[130px]">
            Total Commission
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-semibold font-mono text-amber-600">
            {(row.getValue("total_commission") ?? 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            EGP
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
    ],
    [],
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 bg-[#fafafa] min-h-screen">
      {showTable && (
        <Button
          variant="outline"
          onClick={() => setShowTable(false)}
          className="mb-2"
        >
          ← Back
        </Button>
      )}
      <h1 className="text-2xl font-bold text-slate-800">
        Restaurant Orders Report
      </h1>

      <div className="bg-white border rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <CalendarRange className="w-4 h-4 shrink-0" />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full sm:w-40"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full sm:w-40"
        />
        {/* Added Clear Button Next to Dates */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {!showTable ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowTable(true)}
            className="w-full text-left"
          >
            <Card
              title="Total Orders"
              value={summary.totalOrders ?? 0}
              icon={ShoppingBag}
              borderColor="border-blue-500"
              bgColor="bg-blue-50 text-blue-600"
            />
          </button>
          <button
            onClick={() => setShowTable(true)}
            className="w-full text-left"
          >
            <Card
              title="Total Restaurants"
              value={summary.totalRestaurants ?? 0}
              icon={Store}
              borderColor="border-emerald-500"
              bgColor="bg-emerald-50 text-emerald-600"
            />
          </button>
          <Card
            title="Valid Orders"
            value={summary.validOrders ?? 0}
            icon={CheckCircle2}
            borderColor="border-emerald-500"
            bgColor="bg-emerald-50 text-emerald-600"
          />
          <Card
            title="Canceled Orders"
            value={summary.canceledOrders ?? 0}
            icon={XCircle}
            borderColor="border-rose-500"
            bgColor="bg-rose-50 text-rose-600"
          />
          <Card
            title="Total Commission"
            value={`${Number(summary.total_commission ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`}
            icon={Wallet}
            borderColor="border-amber-500"
            bgColor="bg-amber-50 text-amber-600"
          />
        </div>
      ) : (
        <>
          <div className="bg-white border rounded-2xl p-4 sm:p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <Filter className="w-4 h-4" />
                Filters
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Orders count range */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                  Orders count between
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="Min"
                    value={minOrdersInput}
                    onChange={(e) => setMinOrdersInput(e.target.value)}
                    className="w-full"
                  />
                  <span className="text-slate-300 text-sm shrink-0">—</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="Max"
                    value={maxOrdersInput}
                    onChange={(e) => setMaxOrdersInput(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Sort by orders */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                  Sort by orders count
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={orderSort === "asc" ? "default" : "outline"}
                    onClick={() => toggleSort("asc")}
                    className="flex-1 justify-center gap-1.5"
                  >
                    <ArrowUp className="w-4 h-4" />
                    Low to high
                  </Button>
                  <Button
                    type="button"
                    variant={orderSort === "desc" ? "default" : "outline"}
                    onClick={() => toggleSort("desc")}
                    className="flex-1 justify-center gap-1.5"
                  >
                    <ArrowDown className="w-4 h-4" />
                    High to low
                  </Button>
                </div>
              </div>
            </div>

            {/* Restaurant type */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                <Tag className="w-3.5 h-3.5" />
                Restaurant type
              </label>
              <div className="flex flex-wrap gap-2">
                {RESTAURANT_TYPES.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={
                      selectedTypes.includes(t) ||
                      (t === "all" && selectedTypes.length === 0)
                        ? "default"
                        : "outline"
                    }
                    onClick={() => toggleType(t)}
                  >
                    {t.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Simple Cards with Soft Backgrounds and No Icons (Matching image_99655f.png layout) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Orders Box */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 sm:p-6 flex flex-col justify-center shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Orders
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">
                {filteredSummary.totalOrders}
              </h2>
            </div>

            {/* Restaurants Box */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 sm:p-6 flex flex-col justify-center shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Restaurants
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">
                {filteredSummary.totalRestaurants}
              </h2>
            </div>
          </div>

          {/* Stats By Type Cards */}
          <div className="bg-white border rounded-2xl p-4 mb-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
              Statistics by Type
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {statsByType.map(([type, stats]) => (
                <div
                  key={type}
                  className="bg-slate-50 border rounded-xl p-3 text-center"
                >
                  <p className="text-sm font-bold text-slate-800 capitalize">
                    {type}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-xs text-slate-600">
                    <span>
                      Rests: <strong>{stats.count}</strong>
                    </span>
                    <span>
                      Orders: <strong>{stats.orders}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-2xl border bg-white">
            <GenericDataTable
              data={displayedRestaurants}
              actions={false}
              columns={restaurantColumns}
            />
          </div>
        </>
      )}

      {/* Popup showing full restaurant details with Facebook and Order Links */}
      <Dialog
        open={!!selectedRestaurant}
        onOpenChange={(open) => !open && setSelectedRestaurant(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6">
          {selectedRestaurant &&
            (() => {
              const d = selectedRestaurant.restaurantDetails || {};
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
                          <div className="flex items-center gap-2 mt-1.5">
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
                          {selectedRestaurant.ordersCount ?? 0}
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Sales Representative
                        </p>
                        <p className="font-semibold text-slate-700 mt-0.5">
                          {d.salesObj?.name || "-"}
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
                              Call Owner
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
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
