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
} from "lucide-react";

// Defined outside the component so it isn't re-created (and every card
// re-mounted) on each render — keeps re-renders cheap.
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
  // Raw, immediately-controlled input values. The committed min/max state
  // above (used for filtering) updates 300ms after typing stops, so large
  // tables aren't re-filtered on every keystroke.
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
    selectedTypes.length > 0;

  const clearFilters = useCallback(() => {
    setMinOrdersInput("");
    setMaxOrdersInput("");
    setMinOrders("");
    setMaxOrders("");
    setOrderSort("");
    setSelectedTypes([]);
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
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
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
            value={`${(summary.total_commission ?? 0).toFixed(2)} EGP`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card
              title=" Orders"
              value={filteredSummary.totalOrders}
              icon={ShoppingBag}
              borderColor="border-blue-500"
              bgColor="bg-blue-50 text-blue-600"
            />

            <Card
              title=" Restaurants"
              value={filteredSummary.totalRestaurants}
              icon={Store}
              borderColor="border-emerald-500"
              bgColor="bg-emerald-50 text-emerald-600"
            />
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

      {/* Popup showing full restaurant details when a name is clicked */}
      <Dialog
        open={!!selectedRestaurant}
        onOpenChange={(open) => !open && setSelectedRestaurant(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-lg max-h-[85vh] overflow-y-auto">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        Sales Representative
                      </p>
                      <p className="font-semibold text-slate-700">
                        {d.salesObj?.name || "-"}
                      </p>
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
