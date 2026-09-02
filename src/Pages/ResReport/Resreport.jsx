import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CalendarRange,
  Filter,
  ArrowUp,
  UserCog,
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
  ArrowLeft,
  ChevronRight,
  MapPin,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// Small self-contained toggle switch (no extra UI dependency) used for the
// "show/hide columns" controls above the restaurants table.
const ColumnSwitch = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-yellow-400" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
    <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
      {label}
    </span>
  </label>
);

// Standardized dashboard card component modeled after the provided screenshot
const Card = ({ title, value, icon: Icon, borderColor, bgColor }) => (
  <div
    className={`bg-white border-2 ${borderColor} rounded-3xl p-4 sm:p-6 flex items-center justify-between gap-3`}
  >
    <div className="min-w-0">
      <p className="text-sm text-slate-500 font-medium ">{title}</p>
      <h2 className="text-lg sm:text-xl font-bold mt-1 text-slate-900">
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

// Columns available in the "show/hide columns" switches above the table.
// "restaurantDetails.name" (Restaurant) is intentionally excluded so at
// least one identifying column always stays visible.
const COLUMN_OPTIONS = [
  { id: "restaurantDetails.type", label: "Type" },
  { id: "restaurantDetails.city", label: "City" },
  { id: "ordersCount", label: "Orders Count" },
  { id: "total_commission", label: "Total Commission" },
  { id: "restaurantDetails.status", label: "Status" },
  { id: "restaurantDetails.deliverystatus", label: "Delivery Status" },
  { id: "restaurantDetails.FacebookLink", label: "Facebook Link" },
  { id: "signupUsersCount", label: "Signup Users Count" },
];

// Rank used to order/tie-break by restaurant type: mega > super > A > B > C > C- > test
const TYPE_ORDER = ["mega", "super", "A", "B", "C", "C-", "test"].reduce(
  (acc, type, index) => {
    acc[type] = index;
    return acc;
  },
  {},
);
const getTypeRank = (type) =>
  TYPE_ORDER[type] !== undefined ? TYPE_ORDER[type] : TYPE_ORDER.length;

// Color map for distinct styling based on restaurant type
const TYPE_COLORS = {
  mega: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    title: "text-rose-800",
    text: "text-rose-600",
    accent: "bg-rose-500",
  },
  super: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    title: "text-sky-800",
    text: "text-sky-600",
    accent: "bg-sky-500",
  },
  A: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    title: "text-emerald-800",
    text: "text-emerald-600",
    accent: "bg-emerald-500",
  },
  B: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "text-amber-800",
    text: "text-amber-700",
    accent: "bg-amber-500",
  },
  C: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    title: "text-orange-800",
    text: "text-orange-700",
    accent: "bg-orange-500",
  },
  "C-": {
    bg: "bg-violet-50",
    border: "border-violet-200",
    title: "text-violet-800",
    text: "text-violet-600",
    accent: "bg-violet-500",
  },
  test: {
    bg: "bg-slate-100",
    border: "border-slate-300 border-dashed",
    title: "text-slate-700",
    text: "text-slate-500",
    accent: "bg-slate-400",
  },
  default: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    title: "text-gray-800",
    text: "text-gray-600",
    accent: "bg-gray-400",
  },
};

// Renders the inline restaurant comparison used by ResReport. Two modes:
//  - Flat side-by-side: every selected restaurant gets its own column.
//  - Group vs one: when `versusId` is set, every other selected restaurant
//    is aggregated into a single "Group" column (sum + average) and
//    compared against that one restaurant.
function RestaurantCompareTable({ compareIds, versusId, restaurants }) {
  const findRestaurant = (id) =>
    restaurants.find((r) => r.restaurantDetails?.id === id);

  const numericFormat = {
    ordersCount: (v) => v,
    total_commission: (v) =>
      `${Number(v).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} EGP`,
    signupUsersCount: (v) => v,
  };

  const numericRows = [
    {
      key: "ordersCount",
      label: "Orders Count",
      getValue: (r) => r.ordersCount ?? 0,
    },
    {
      key: "total_commission",
      label: "Total Commission",
      getValue: (r) => r.total_commission ?? 0,
    },
    {
      key: "signupUsersCount",
      label: "Signup Users Count",
      getValue: (r) => r.signupUsersCount ?? 0,
    },
  ];

  const textRows = [
    {
      key: "type",
      label: "Type",
      getValue: (r) => r.restaurantDetails?.type || "Unknown",
    },
    {
      key: "city",
      label: "City",
      getValue: (r) => r.restaurantDetails?.city?.name || "-",
    },
    {
      key: "status",
      label: "Status",
      getValue: (r) => r.restaurantDetails?.status || "-",
    },
    {
      key: "deliverystatus",
      label: "Delivery Status",
      getValue: (r) =>
        r.restaurantDetails?.deliverystatus === "delivered"
          ? "Delivered"
          : "Not Delivered",
    },
  ];

  // --- Group vs one ---
  if (versusId && compareIds.includes(versusId)) {
    const versusRestaurant = findRestaurant(versusId);
    const groupList = compareIds
      .filter((id) => id !== versusId)
      .map(findRestaurant)
      .filter(Boolean);

    if (!versusRestaurant || groupList.length === 0) {
      return (
        <p className="text-xs text-slate-400 italic">
          Pick at least one more restaurant for the group.
        </p>
      );
    }

    const versusD = versusRestaurant.restaurantDetails || {};

    return (
      <div className="space-y-4">
        <table className="w-full text-sm border-collapse min-w-[480px]">
          <thead>
            <tr>
              <th className="text-left p-2 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase w-40">
                Metric
              </th>
              <th className="p-2 border-b border-slate-100 text-center min-w-[170px]">
                <span className="font-bold text-slate-800">
                  Group ({groupList.length} restaurant
                  {groupList.length !== 1 ? "s" : ""})
                </span>
              </th>
              <th className="p-2 border-b border-slate-100 text-center min-w-[170px]">
                <div className="flex flex-col items-center gap-1">
                  {versusD.logo && (
                    <img
                      src={versusD.logo}
                      alt={versusD.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                    />
                  )}
                  <span className="font-bold text-amber-700">
                    {versusD.name || versusD.nameAr || "-"}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {numericRows.map((row) => {
              const groupTotal = groupList.reduce(
                (sum, r) => sum + (row.getValue(r) || 0),
                0,
              );
              const groupAvg = groupTotal / groupList.length;
              const versusVal = row.getValue(versusRestaurant) || 0;
              const format = numericFormat[row.key];
              const groupWins = groupTotal > versusVal;
              const versusWins = versusVal > groupTotal;
              return (
                <tr key={row.key}>
                  <td className="p-2 border-b border-slate-50 text-xs font-bold text-slate-500 uppercase">
                    {row.label}
                  </td>
                  <td
                    className={`p-2 border-b border-slate-50 text-center font-mono font-semibold rounded-lg ${
                      groupWins
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700"
                    }`}
                  >
                    {format(groupTotal)}
                    <span className="block text-[10px] font-normal text-slate-400 normal-case">
                      avg {format(Math.round(groupAvg * 100) / 100)} /
                      restaurant
                    </span>
                  </td>
                  <td
                    className={`p-2 border-b border-slate-50 text-center font-mono font-semibold rounded-lg ${
                      versusWins
                        ? "bg-amber-50 text-amber-700"
                        : "text-slate-700"
                    }`}
                  >
                    {format(versusVal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
            Group members
          </p>
          <div className="flex flex-wrap gap-1.5">
            {groupList.map((r) => {
              const d = r.restaurantDetails || {};
              return (
                <span
                  key={d.id}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium"
                >
                  {d.name || d.nameAr || "-"}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- Flat side-by-side ---
  const compareList = compareIds.map(findRestaurant).filter(Boolean);

  return (
    <table className="w-full text-sm border-collapse min-w-[560px]">
      <thead>
        <tr>
          <th className="text-left p-2 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase w-36">
            Metric
          </th>
          {compareList.map((r) => {
            const d = r.restaurantDetails || {};
            return (
              <th
                key={d.id}
                className="p-2 border-b border-slate-100 text-center align-top min-w-[150px]"
              >
                <div className="flex flex-col items-center gap-1.5">
                  {d.logo && (
                    <img
                      src={d.logo}
                      alt={d.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                    />
                  )}
                  <span
                    className="font-bold text-slate-800 truncate max-w-[140px]"
                    title={d.name}
                  >
                    {d.name || d.nameAr || "-"}
                  </span>
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {numericRows.map((row) => {
          const values = compareList.map((r) => row.getValue(r));
          const maxVal = Math.max(...values);
          const format = numericFormat[row.key];
          return (
            <tr key={row.key}>
              <td className="p-2 border-b border-slate-50 text-xs font-bold text-slate-500 uppercase">
                {row.label}
              </td>
              {compareList.map((r, i) => {
                const v = values[i];
                const isBest = maxVal > 0 && v === maxVal;
                return (
                  <td
                    key={r.restaurantDetails?.id}
                    className={`p-2 border-b border-slate-50 text-center font-mono font-semibold rounded-lg ${
                      isBest
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700"
                    }`}
                  >
                    {format(v)}
                  </td>
                );
              })}
            </tr>
          );
        })}
        {textRows.map((row) => (
          <tr key={row.key}>
            <td className="p-2 border-b border-slate-50 text-xs font-bold text-slate-500 uppercase">
              {row.label}
            </td>
            {compareList.map((r) => (
              <td
                key={r.restaurantDetails?.id}
                className="p-2 border-b border-slate-50 text-center capitalize text-slate-700"
              >
                {row.getValue(r)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ResReport() {
  // Date filter defaults to today (YYYY-MM-DD, matching <input type="date">)
  // so the report loads scoped to today's orders instead of "all time".
  const getTodayDateString = () => new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(getTodayDateString);
  const [endDate, setEndDate] = useState("");
  const [minOrders, setMinOrders] = useState("");
  const [maxOrders, setMaxOrders] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("all");
  const [minOrdersInput, setMinOrdersInput] = useState("");
  const [maxOrdersInput, setMaxOrdersInput] = useState("");
  const [orderSort, setOrderSort] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  // Holds selected city ids (from the active-cities API) used to filter the
  // restaurants table. Empty array == "All cities".
  const [selectedCities, setSelectedCities] = useState([]);
  // Controls the open/closed state of the searchable city multi-select dropdown.
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  // Tracks which optional columns are hidden. A column is visible unless
  // its id is explicitly set to false here.
  const [columnVisibility, setColumnVisibility] = useState({});
  // User-added "blank" columns — just a title with no data, appended to the
  // end of the table. Each entry: { id, label }.
  // Persisted to localStorage so they survive a page refresh / leaving the site,
  // and only disappear when the user removes them.
  const [customColumns, setCustomColumns] = useState(() => {
    try {
      const saved = localStorage.getItem("resreport_customColumns");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const tableRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        "resreport_customColumns",
        JSON.stringify(customColumns),
      );
    } catch {
      // ignore storage errors (e.g. private browsing / quota)
    }
  }, [customColumns]);

  // "with" -> restaurants that have orders, "without" -> restaurants with no orders.
  // We deliberately do NOT add a per-type list here (per request) — only these two.
  const [restaurantListMode, setRestaurantListMode] = useState(null);
  // Remembers which list (if any) the currently open detail popup was opened
  // from, so we can offer a "Back to list" link instead of just closing.
  const [detailOpenedFromList, setDetailOpenedFromList] = useState(null);

  // --- Restaurant comparison ---
  // Holds restaurantDetails.id values checked in the table for comparison.
  // Supports 1 vs 1, many vs one, or a flat side-by-side view, up to
  // MAX_COMPARE selected restaurants. When `versusId` is set, that one
  // restaurant is compared against the aggregated totals of everyone else
  // selected (the "group").
  const [compareIds, setCompareIds] = useState([]);
  const [versusId, setVersusId] = useState(null);
  const MAX_COMPARE = 6;

  const toggleCompareSelect = useCallback((id) => {
    if (!id) return;
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        setVersusId((v) => (v === id ? null : v));
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  const setAsVersus = useCallback((id) => {
    setVersusId((prev) => (prev === id ? null : id));
  }, []);

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

  // Active cities, used to build the "City" filter buttons and to resolve
  // each restaurant's city name in the table.
  const { data: citiesData } = useQuery({
    queryKey: ["activeCities"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/zones/cities/active");
      return res.data?.data?.data || res.data?.data || [];
    },
  });
  const cities = citiesData || [];

  // Full (unfiltered) split by whether the restaurant has any orders — this
  // mirrors the summary.restaurantsWithOrders / restaurantsWithoutOrders
  // counts shown in the top cards, so clicking a card shows exactly those
  // restaurants.
  const restaurantsWithOrdersList = useMemo(
    () => restaurants.filter((r) => (r.ordersCount ?? 0) > 0),
    [restaurants],
  );
  const restaurantsWithoutOrdersList = useMemo(
    () => restaurants.filter((r) => (r.ordersCount ?? 0) === 0),
    [restaurants],
  );

  const displayedRestaurants = useMemo(() => {
    let data = restaurants.filter(
      (r) => (r.restaurantDetails?.status || "inactive") === "active",
    );
    if (selectedTypes.length > 0 && !selectedTypes.includes("all")) {
      data = data.filter((r) =>
        selectedTypes.includes(r.restaurantDetails?.type),
      );
    }
    if (selectedCities.length > 0) {
      data = data.filter((r) =>
        selectedCities.includes(r.restaurantDetails?.city?.id),
      );
    }
    if (deliveryStatus !== "all") {
      data = data.filter((r) => {
        const status = r.restaurantDetails?.deliverystatus;

        if (deliveryStatus === "delivered") {
          return status === "delivered";
        }

        if (deliveryStatus === "non-delivered") {
          return status !== "delivered";
        }

        return true;
      });
    }
    if (minOrders !== "")
      data = data.filter((r) => (r.ordersCount ?? 0) >= Number(minOrders));
    if (maxOrders !== "")
      data = data.filter((r) => (r.ordersCount ?? 0) <= Number(maxOrders));
    if (orderSort === "asc") {
      data.sort((a, b) => {
        const diff = (a.ordersCount ?? 0) - (b.ordersCount ?? 0);
        if (diff !== 0) return diff;
        // Same ordersCount -> tie-break by type order (mega, super, A, B, C, C-, test)
        return (
          getTypeRank(a.restaurantDetails?.type) -
          getTypeRank(b.restaurantDetails?.type)
        );
      });
    } else if (orderSort === "desc") {
      data.sort((a, b) => {
        const diff = (b.ordersCount ?? 0) - (a.ordersCount ?? 0);
        if (diff !== 0) return diff;
        // Same ordersCount -> tie-break by type order (mega, super, A, B, C, C-, test)
        return (
          getTypeRank(a.restaurantDetails?.type) -
          getTypeRank(b.restaurantDetails?.type)
        );
      });
    } else {
      // No orders sort active — default to ordering by restaurant type
      // (mega, super, A, B, C, C-, test) so the table is never in raw/random order.
      data.sort(
        (a, b) =>
          getTypeRank(a.restaurantDetails?.type) -
          getTypeRank(b.restaurantDetails?.type),
      );
    }
    return data;
  }, [
    restaurants,
    selectedTypes,
    selectedCities,
    minOrders,
    maxOrders,
    orderSort,
    deliveryStatus,
  ]);

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

  const toggleCity = useCallback((cityId) => {
    if (cityId === "all") setSelectedCities([]);
    else
      setSelectedCities((prev) =>
        prev.includes(cityId)
          ? prev.filter((c) => c !== cityId)
          : [...prev, cityId],
      );
  }, []);

  const hasActiveFilters =
    minOrdersInput !== "" ||
    maxOrdersInput !== "" ||
    orderSort !== "" ||
    selectedTypes.length > 0 ||
    selectedCities.length > 0 ||
    startDate !== getTodayDateString() ||
    endDate !== "" ||
    deliveryStatus !== "all";

  const clearFilters = useCallback(() => {
    setMinOrdersInput("");
    setMaxOrdersInput("");
    setMinOrders("");
    setMaxOrders("");
    setOrderSort("");
    setSelectedTypes([]);
    setSelectedCities([]);
    setStartDate("");
    setEndDate("");
    setDeliveryStatus("all");
  }, []);

  const restaurantColumns = useMemo(
    () => [
      {
        id: "compare_select",
        header: () => (
          <div className="text-center font-bold w-10" title="Select to compare">
            Cmp
          </div>
        ),
        cell: ({ row }) => {
          const id = row.original.restaurantDetails?.id;
          const checked = compareIds.includes(id);
          const disabled = !checked && compareIds.length >= MAX_COMPARE;
          return (
            <div className="text-center">
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggleCompareSelect(id)}
                title={
                  disabled
                    ? `You can compare up to ${MAX_COMPARE} restaurants at once`
                    : "Select for comparison"
                }
                className="w-4 h-4 accent-blue-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              />
            </div>
          );
        },
      },
      {
        accessorKey: "restaurantDetails.name",
        header: "Restaurant",
        cell: ({ row }) => (
          <button
            onClick={() => {
              setDetailOpenedFromList(null);
              setSelectedRestaurant(row.original);
            }}
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
        accessorKey: "restaurantDetails.city",
        header: () => (
          <div className="text-center font-bold min-w-[100px]">City</div>
        ),
        cell: ({ row }) => {
          const city = row.original.restaurantDetails?.city;
          return (
            <div className="text-center">
              {city ? (
                <span className="inline-block px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                  {city.name}
                </span>
              ) : (
                <span className="text-slate-400 text-xs">-</span>
              )}
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
      {
        accessorKey: "restaurantDetails.deliverystatus",
        header: () => (
          <div className="text-center font-bold min-w-[100px]">
            Delivery Status
          </div>
        ),
        cell: ({ row }) => {
          const Deliverystatus =
            row.original.restaurantDetails?.deliverystatus || "-";
          const isDelivering = Deliverystatus === "delivered";
          return (
            <div className="text-center">
              <span
                className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold capitalize ${
                  isDelivering
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {Deliverystatus}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "restaurantDetails.FacebookLink",
        header: "Facebook Link",
        cell: ({ row }) => {
          const facebookLink = row.original.restaurantDetails?.facebookLink;

          return facebookLink ? (
            <a
              href={facebookLink}
              target="_blank"
              rel="noopener noreferrer"
              title={facebookLink}
              className="block max-w-[200px] truncate text-blue-600 hover:underline"
            >
              Yes
            </a>
          ) : (
            "No"
          );
        },
      },

      {
        accessorKey: "signupUsersCount",
        header: () => (
          <div className="text-right font-bold min-w-[100px]">
            Signup Users Count
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-semibold font-mono text-blue-600">
            {row.getValue("signupUsersCount") ?? 0}
          </div>
        ),
      },
    ],
    [compareIds, toggleCompareSelect],
  );

  const toggleColumnVisibility = useCallback((id) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [id]: prev[id] === false ? true : false,
    }));
  }, []);

  // Adds a new blank column (title only, no data) to the table.
  const addCustomColumn = useCallback(() => {
    const title = newColumnTitle.trim();
    if (!title) return;
    const id = `custom_${Date.now()}`;
    setCustomColumns((prev) => [...prev, { id, label: title }]);
    setNewColumnTitle("");
  }, [newColumnTitle]);

  const removeCustomColumn = useCallback((id) => {
    setCustomColumns((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Column definitions for the user-added blank columns — header only,
  // every cell renders empty.
  const customColumnDefs = useMemo(
    () =>
      customColumns.map((c) => ({
        id: c.id,
        header: () => (
          <div className="text-center font-bold min-w-[120px]">{c.label}</div>
        ),
        cell: () => "",
      })),
    [customColumns],
  );

  // Columns actually passed to the table — hidden ones are filtered out.
  // The Restaurant name column is never filtered, so a row always has an
  // identifying column visible.
  const visibleColumns = useMemo(
    () =>
      restaurantColumns
        .filter((col) => {
          const id = col.id ?? col.accessorKey;
          if (id === "restaurantDetails.name" || id === "compare_select")
            return true;
          return columnVisibility[id] !== false;
        })
        .concat(customColumnDefs),
    [restaurantColumns, columnVisibility, customColumnDefs],
  );
  // Maps a column id to the human-readable header used in the exported PDF.
  const COLUMN_ID_TO_LABEL = {
    "restaurantDetails.name": "Restaurant",
    "restaurantDetails.type": "Type",
    "restaurantDetails.city": "City",
    ordersCount: "Orders Count",
    total_commission: "Total Commission",
    "restaurantDetails.status": "Status",
    "restaurantDetails.deliverystatus": "Delivery Status",
    "restaurantDetails.FacebookLink": "Facebook Link",
    signupUsersCount: "Signup Users Count",
  };

  // Pulls the same value that's rendered in a given table cell, straight
  // from the row object — so the PDF always matches what's on screen
  // (respecting current filters, since it reads from displayedRestaurants,
  // not a fresh API call).
  const getExportCellValue = (row, colId) => {
    const d = row.restaurantDetails || {};
    switch (colId) {
      case "restaurantDetails.name":
        return d.name || d.nameAr || "-";
      case "restaurantDetails.type":
        return d.type || "Unknown";
      case "restaurantDetails.city":
        return d.city?.name || "-";
      case "ordersCount":
        return String(row.ordersCount ?? 0);
      case "total_commission":
        return `${(row.total_commission ?? 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} EGP`;
      case "restaurantDetails.status":
        return d.status || "-";
      case "restaurantDetails.deliverystatus":
        return d.deliverystatus === "delivered" ? "Delivered" : "Not Delivered";
      case "restaurantDetails.FacebookLink":
        return d.facebookLink ? "Yes" : "No";
      case "signupUsersCount":
        return String(row.signupUsersCount ?? 0);
      default:
        // Custom blank columns render empty in the table too.
        return "";
    }
  };

  // Builds the PDF directly from the data currently shown in the table
  // (displayedRestaurants + visibleColumns) rather than re-fetching from
  // the API or screenshotting the DOM.
  const exportPDF = () => {
    try {
      const columnIds = visibleColumns
        .map((col) => col.id ?? col.accessorKey)
        .filter((id) => id !== "compare_select");

      const head = [
        columnIds.map((id) => {
          const custom = customColumns.find((c) => c.id === id);
          return custom ? custom.label : COLUMN_ID_TO_LABEL[id] || id;
        }),
      ];

      const body = displayedRestaurants.map((r) =>
        columnIds.map((id) => getExportCellValue(r, id)),
      );

      const pdf = new jsPDF("landscape", "mm", "a4");

      pdf.setFontSize(14);
      pdf.text("Restaurant Orders Report", 14, 12);

      autoTable(pdf, {
        head,
        body,
        startY: 18,
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [250, 204, 21], textColor: [30, 30, 30] },
        margin: { left: 10, right: 10 },
      });

      const date = new Date().toISOString().split("T")[0];
      pdf.save(`Restaurant-Orders-Report-${date}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
    }
  };
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
        <div className="relative w-full sm:w-40">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full pr-7"
          />
          {startDate !== "" && (
            <button
              type="button"
              onClick={() => setStartDate("")}
              title="Clear start date"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
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
              value={`${summary.totalOrders ?? 0} /  ${summary.restaurantsWithOrders ?? 0} with orders`}
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

          <button
            onClick={() => setRestaurantListMode("without")}
            className="w-full text-left"
          >
            <Card
              title="Restaurants missing Orders"
              value={summary.restaurantsWithoutOrders ?? 0}
              icon={ShoppingBag}
              borderColor="border-rose-500"
              bgColor="bg-rose-50 text-rose-600"
            />
          </button>
          <Card
            title="Total Commission"
            value={`${Number(summary.total_commission ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`}
            icon={Wallet}
            borderColor="border-amber-500"
            bgColor="bg-amber-50 text-amber-600"
          />
          <Card
            title="Total Signup Users"
            value={summary.totalSignupUsers ?? 0}
            icon={UserCog}
            borderColor="border-blue-500"
            bgColor="bg-blue-50 text-blue-600"
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

            {/* City */}
            <div className="min-w-0">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                <MapPin className="w-3.5 h-3.5" />
                City
              </label>
              <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={cityPopoverOpen}
                    className="w-full h-auto min-h-9 justify-between font-normal py-1.5"
                  >
                    <span className="flex flex-1 flex-wrap items-center gap-1 min-w-0 text-left">
                      {selectedCities.length === 0 ? (
                        <span className="text-slate-500">All cities</span>
                      ) : selectedCities.length <= 2 ? (
                        cities
                          .filter((city) => selectedCities.includes(city.id))
                          .map((city) => (
                            <Badge
                              key={city.id}
                              variant="secondary"
                              className="rounded-md font-normal truncate max-w-[120px]"
                            >
                              {city.name}
                            </Badge>
                          ))
                      ) : (
                        <Badge
                          variant="secondary"
                          className="rounded-md font-normal"
                        >
                          {selectedCities.length} cities selected
                        </Badge>
                      )}
                    </span>
                    <ChevronsUpDown className="w-4 h-4 shrink-0 opacity-50 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0 w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)]"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search city..." />
                    <CommandList className="max-h-56">
                      <CommandEmpty>No city found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => toggleCity("all")}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCities.length === 0
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          All cities
                        </CommandItem>
                        {cities.map((city) => (
                          <CommandItem
                            key={city.id}
                            value={city.name}
                            onSelect={() => toggleCity(city.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCities.includes(city.id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {city.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {/* Delivery status filter */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
              Delivery Status
            </label>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={deliveryStatus === "all" ? "default" : "outline"}
                onClick={() => setDeliveryStatus("all")}
              >
                All
              </Button>

              <Button
                size="sm"
                variant={deliveryStatus === "delivered" ? "default" : "outline"}
                onClick={() => setDeliveryStatus("delivered")}
              >
                Delivered
              </Button>

              <Button
                size="sm"
                variant={
                  deliveryStatus === "non-delivered" ? "default" : "outline"
                }
                onClick={() => setDeliveryStatus("non-delivered")}
              >
                Non Delivered
              </Button>
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
              {statsByType.map(([type, stats]) => {
                const colors = TYPE_COLORS[type] || TYPE_COLORS.default;

                return (
                  <div
                    key={type}
                    className={`relative overflow-hidden border rounded-xl p-3 pt-4 text-center min-w-0 ${colors.bg} ${colors.border}`}
                  >
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 ${colors.accent}`}
                    />
                    <p
                      className={`text-sm font-bold capitalize truncate ${colors.title}`}
                    >
                      {type}
                    </p>
                    <div className="flex items-stretch justify-between mt-1.5 pt-2 text-xs border-t border-black/10">
                      <div className="flex-1 min-w-0 flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate max-w-full">
                          Restaurants
                        </span>
                        <span className={`font-bold text-sm ${colors.text}`}>
                          {stats.count}
                        </span>
                      </div>
                      <div className="w-px bg-black/10 mx-2 shrink-0" />
                      <div className="flex-1 min-w-0 flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate max-w-full">
                          Orders
                        </span>
                        <span className={`font-bold text-sm ${colors.text}`}>
                          {stats.orders}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Button
            type="button"
            onClick={exportPDF}
            className="bg-yellow-400 hover:bg-yellow-700 text-white"
          >
            Export PDF
          </Button>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Columns:
            </span>
            {COLUMN_OPTIONS.map((opt) => (
              <ColumnSwitch
                key={opt.id}
                label={opt.label}
                checked={columnVisibility[opt.id] !== false}
                onChange={() => toggleColumnVisibility(opt.id)}
              />
            ))}

            {/* Divider between the show/hide switches and the "add a blank
                column" control */}
            <span className="w-px h-4 bg-slate-200" />

            {/* Add a custom column: title only, no data — just adds an
                empty column to the table for manual notes/printing etc. */}
            <div className="flex items-center gap-1.5">
              <Input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomColumn();
                  }
                }}
                placeholder="New column title"
                className="h-8 w-40 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addCustomColumn}
                disabled={!newColumnTitle.trim()}
                className="h-8"
              >
                + Add Column
              </Button>
            </div>

            {/* Chips for currently added blank columns, each removable */}
            {customColumns.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600"
              >
                {c.label}
                <button
                  type="button"
                  onClick={() => removeCustomColumn(c.id)}
                  className="rounded-full hover:bg-slate-200 p-0.5"
                  aria-label={`Remove ${c.label} column`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div
            ref={tableRef}
            className="w-full overflow-x-auto rounded-2xl border bg-white"
          >
            <GenericDataTable
              data={displayedRestaurants}
              actions={false}
              columns={visibleColumns}
            />
          </div>

          {/* Inline restaurant comparison — populated by the "Cmp" checkboxes
              in the table above. Supports a flat side-by-side view, or,
              once one restaurant is marked "Versus", a group-of-many vs
              that one restaurant view. Renders on the page, not a popup. */}
          {compareIds.length > 0 && (
            <div className="bg-white border rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <Tag className="w-4 h-4" />
                  Compare Restaurants ({compareIds.length})
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCompareIds([]);
                    setVersusId(null);
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear selection
                </button>
              </div>

              {/* Chips: each selected restaurant, with a toggle to mark it
                  as the "versus" side instead of part of the group. */}
              <div className="flex flex-wrap gap-2">
                {compareIds.map((id) => {
                  const r = restaurants.find(
                    (x) => x.restaurantDetails?.id === id,
                  );
                  const d = r?.restaurantDetails || {};
                  const isVersus = versusId === id;
                  return (
                    <span
                      key={id}
                      className={`flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium border ${
                        isVersus
                          ? "bg-amber-50 border-amber-300 text-amber-700"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      {d.name || d.nameAr || "-"}
                      <button
                        type="button"
                        onClick={() => setAsVersus(id)}
                        title={
                          isVersus
                            ? "Currently the 'versus' side — click to unset"
                            : "Compare the rest of the group against this one"
                        }
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          isVersus
                            ? "bg-amber-400 text-white"
                            : "bg-white text-slate-500 hover:text-blue-600 border border-slate-200"
                        }`}
                      >
                        {isVersus ? "Versus" : "vs?"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCompareSelect(id)}
                        className="rounded-full hover:bg-black/10 p-0.5"
                        aria-label={`Remove ${d.name} from comparison`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>

              {compareIds.length < 2 ? (
                <p className="text-xs text-slate-400 italic">
                  Select at least one more restaurant to compare.
                </p>
              ) : (
                <RestaurantCompareTable
                  compareIds={compareIds}
                  versusId={versusId}
                  restaurants={restaurants}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Restaurant list popup — opened from "Restaurants make Orders" / "Restaurants missing Orders" cards */}
      <Dialog
        open={!!restaurantListMode}
        onOpenChange={(open) => !open && setRestaurantListMode(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl p-0">
          {(() => {
            const list =
              restaurantListMode === "with"
                ? restaurantsWithOrdersList
                : restaurantsWithoutOrdersList;
            const title =
              restaurantListMode === "with"
                ? `Restaurants with Orders (${list.length})`
                : `Restaurants without Orders (${list.length})`;

            return (
              <>
                <DialogHeader className="bg-slate-50 p-5 border-b border-slate-100">
                  <DialogTitle className="text-lg font-bold text-slate-800">
                    {title}
                  </DialogTitle>
                </DialogHeader>

                <div className="p-4 space-y-2">
                  {list.length > 0 ? (
                    [...list]
                      .sort((a, b) => {
                        return (
                          getTypeRank(a.restaurantDetails?.type) -
                          getTypeRank(b.restaurantDetails?.type)
                        );
                      })
                      .map((r) => {
                        const d = r.restaurantDetails || {};
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              // No API call needed here — this report already
                              // loaded the full restaurant record client-side,
                              // so we just reuse it directly for the detail
                              // popup instead of re-fetching by id.
                              setDetailOpenedFromList(restaurantListMode);
                              setSelectedRestaurant(r);
                              setRestaurantListMode(null);
                            }}
                            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-300 hover:shadow-sm transition-all text-left"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">
                                {d.name || d.nameAr || "-"}
                              </p>
                              {d.nameAr && (
                                <p className="text-xs text-slate-400 truncate">
                                  {d.nameAr}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">
                                {d.type || "Unknown"}
                              </span>
                              <span className="text-xs font-bold font-mono text-slate-600">
                                {r.ordersCount ?? 0} orders
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
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </button>
                        );
                      })
                  ) : (
                    <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-500">
                        No restaurants in this list.
                      </p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Popup showing full restaurant details with Facebook and Order Links */}
      <Dialog
        open={!!selectedRestaurant}
        onOpenChange={(open) => {
          if (!open) {
            // If this popup was opened from one of the lists above, going
            // back there is one click away via the "Back" link instead.
            setSelectedRestaurant(null);
            setDetailOpenedFromList(null);
          }
        }}
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
                    {detailOpenedFromList && (
                      <button
                        onClick={() => {
                          setRestaurantListMode(detailOpenedFromList);
                          setSelectedRestaurant(null);
                          setDetailOpenedFromList(null);
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to list
                      </button>
                    )}
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
                      {/*  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
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
                      </div> */}
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
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Signup Users Count
                        </p>
                        <p className="font-semibold text-slate-700 mt-0.5">
                          {selectedRestaurant.signupUsersCount || "-"}
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
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
