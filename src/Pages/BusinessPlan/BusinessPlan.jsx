import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios";
import {
  Search,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";

export default function BusinessPlan() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 1. Fetching Data
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["business-plans"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/businessplans");
      return res.data?.data?.data || res.data?.data || [];
    },
  });

  // 2. Data Consolidation — one row per restaurant, no duplicates.
  const consolidatedPlans = useMemo(() => {
    if (!plans || plans.length === 0) return [];

    const map = new Map();

    plans.forEach((plan) => {
      const currentRestaurantId =
        plan.restaurantId || plan.restaurantDetails?.id;

      if (!currentRestaurantId) return;

      if (!map.has(currentRestaurantId)) {
        map.set(currentRestaurantId, {
          id: plan.id || currentRestaurantId, // Preserves the plan ID for editing
          restaurantId: currentRestaurantId,
          restaurantName: plan.restaurantDetails?.name || "Unknown",
          restauranttype: plan.restaurantDetails?.type || "",
          onlineOrderServiceFees: "0.00",
          onlineOrderCommission: "0.00",
          myKeetoServiceFees: "0.00",
          myKeetoCommission: "0.00",
          aggregatorServiceFees: "0.00",
          aggregatorCommission: "0.00",
          isMonthlyActive: false,
          isQuarterlyActive: false,
          isAnnuallyActive: false,
        });
      }

      const entry = map.get(currentRestaurantId);
      const platform = (plan.platformType || "").toLowerCase().trim();

      if (platform === "online_order") {
        entry.onlineOrderServiceFees = plan.serviceFee || "0.00";
        entry.onlineOrderCommission = plan.commissionRate || "0.00";
      } else if (platform === "mykeeto") {
        entry.myKeetoServiceFees = plan.serviceFee || "0.00";
        entry.myKeetoCommission = plan.commissionRate || "0.00";
      } else if (platform === "food_aggregator") {
        entry.aggregatorServiceFees = plan.serviceFee || "0.00";
        entry.aggregatorCommission = plan.commissionRate || "0.00";
      } else if (platform === "") {
        // Empty platformType row carries the POS plan flags.
        entry.isMonthlyActive = plan.isMonthlyActive || false;
        entry.isQuarterlyActive = plan.isQuarterlyActive || false;
        entry.isAnnuallyActive = plan.isAnnuallyActive || false;
      }
    });

    return Array.from(map.values());
  }, [plans]);

  // 3. Search filter
  const filteredPlans = useMemo(() => {
    if (!search.trim()) return consolidatedPlans;
    const q = search.trim().toLowerCase();
    return consolidatedPlans.filter((p) =>
      p.restaurantName.toLowerCase().includes(q),
    );
  }, [consolidatedPlans, search]);

  // 4. Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPlans = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredPlans.slice(start, start + pageSize);
  }, [filteredPlans, safeCurrentPage]);

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  // Small badge for POS status checks
  const PosBadge = ({ active }) => (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
        active ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"
      }`}
    >
      {active ? "✓" : "✕"}
    </span>
  );

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b mb-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Business Plans</h1>
            <p className="text-sm text-slate-400">
              Manage and monitor{" "}
              <span className="text-amber-500 font-medium">Business Plans</span>
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-b-2xl border border-t-0 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
            {/* Row 1: Group Headers */}
            <tr>
              <th
                rowSpan={2}
                className="px-4 py-3 text-left font-bold border-b border-r w-12"
              >
                #
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-left font-bold border-b border-r min-w-[180px]"
              >
                Restaurant
              </th>
              <th
                colSpan={2}
                className="px-4 py-2 text-center font-bold border-b border-r"
              >
                Online Order
              </th>
              <th
                colSpan={2}
                className="px-4 py-2 text-center font-bold border-b border-r"
              >
                MyKeeto
              </th>
              <th
                colSpan={2}
                className="px-4 py-2 text-center font-bold border-b border-r"
              >
                Food Aggregator
              </th>
              <th
                colSpan={3}
                className="px-4 py-2 text-center font-bold border-b border-r"
              >
                POS
              </th>
              <th
                rowSpan={2}
                className="px-4 py-3 text-center font-bold border-b min-w-[80px]"
              >
                Actions
              </th>
            </tr>
            {/* Row 2: Sub-columns */}
            <tr className="text-xs uppercase tracking-wide">
              <th className="px-4 py-2 text-center font-semibold border-b border-r">
                Service Fees
              </th>
              <th className="px-4 py-2 text-center font-semibold border-b border-r">
                Commission
              </th>
              <th className="px-4 py-2 text-center font-semibold border-b border-r">
                Service Fees
              </th>
              <th className="px-4 py-2 text-center font-semibold border-b border-r">
                Commission
              </th>
              <th className="px-4 py-2 text-center font-semibold border-b border-r">
                Service Fees
              </th>
              <th className="px-4 py-2 text-center font-semibold border-b border-r">
                Commission
              </th>
              <th className="px-4 py-2 text-center font-semibold border-b border-r">
                Monthly
              </th>
              <th className="px-4 py-2 text-center font-semibold border-b border-r">
                Quarterly
              </th>
              <th className="px-4 py-2 text-center font-semibold border-b border-r">
                Yearly
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Loading business plans...
                </td>
              </tr>
            ) : filteredPlans.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No restaurants found.
                </td>
              </tr>
            ) : (
              paginatedPlans.map((p, idx) => (
                <tr
                  key={p.restaurantId}
                  className="border-b last:border-b-0 hover:bg-amber-50/60 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-400 border-r">
                    {(safeCurrentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700 border-r whitespace-nowrap">
                    {p.restaurantName}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600 border-r">
                    {p.onlineOrderServiceFees} EGP
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600 border-r">
                    {p.onlineOrderCommission}%
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600 border-r">
                    {p.myKeetoServiceFees} EGP
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600 border-r">
                    {p.myKeetoCommission}%
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600 border-r">
                    {p.aggregatorServiceFees} EGP
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600 border-r">
                    {p.aggregatorCommission}%
                  </td>
                  <td className="px-4 py-3 text-center border-r">
                    <PosBadge active={p.isMonthlyActive} />
                  </td>
                  <td className="px-4 py-3 text-center border-r">
                    <PosBadge active={p.isQuarterlyActive} />
                  </td>
                  <td className="px-4 py-3 text-center border-r">
                    <PosBadge active={p.isAnnuallyActive} />
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/restaurants/business-plans/edit/${p.restaurantId}`,
                        )
                      }
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                      title="Edit Business Plan"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && filteredPlans.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 pt-4">
          <p className="text-xs text-slate-400">
            Showing{" "}
            <span className="font-medium text-slate-600">
              {(safeCurrentPage - 1) * pageSize + 1}
            </span>
            {"–"}
            <span className="font-medium text-slate-600">
              {Math.min(safeCurrentPage * pageSize, filteredPlans.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-600">
              {filteredPlans.length}
            </span>{" "}
            restaurants
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg border text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - safeCurrentPage) <= 1,
              )
              .reduce((acc, page, i, arr) => {
                if (i > 0 && page - arr[i - 1] > 1)
                  acc.push("ellipsis-" + page);
                acc.push(page);
                return acc;
              }, [])
              .map((page) =>
                typeof page === "string" ? (
                  <span
                    key={page}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 text-sm"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === safeCurrentPage
                        ? "bg-amber-400 text-white"
                        : "border text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

            <button
              type="button"
              onClick={() => goToPage(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className="flex items-center justify-center w-8 h-8 rounded-lg border text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
