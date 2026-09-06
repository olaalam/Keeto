import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import { useGet } from "@/hooks/useGet";
import { useUpdate } from "@/hooks/useUpdate";
import { useDelete } from "@/hooks/useDelete";
import GenericDataTable from "@/components/GenericDataTable";
import { Star, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

// Searchable restaurant select used by both the "Restaurant Rate" and
// "Order Rate" tabs. Renders as a button that opens a small popover with a
// search input + filtered restaurant list, instead of a plain <select>.
function RestaurantSelect({
  restaurants,
  isLoading,
  value,
  onChange,
  placeholder = "All Restaurants",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRestaurants = restaurants.filter((r) =>
    (r.name || "").toLowerCase().includes(query.toLowerCase()),
  );

  const selectedRestaurant = restaurants.find(
    (r) => String(r.id) === String(value),
  );

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isLoading}
        className="border rounded-lg px-3 py-1.5 text-sm bg-transparent dark:border-slate-800 disabled:opacity-50 min-w-[180px] flex items-center justify-between gap-2"
      >
        <span className="truncate">
          {isLoading
            ? "Loading restaurants..."
            : selectedRestaurant?.name || placeholder}
        </span>
        <svg
          className={`h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && !isLoading && (
        <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b dark:border-slate-800">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurant..."
              className="w-full border rounded-md px-2 py-1 text-sm bg-transparent dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 ${
                !value ? "bg-slate-50 dark:bg-slate-900 font-semibold" : ""
              }`}
            >
              {placeholder}
            </button>
            {filteredRestaurants.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-400">
                No restaurants found
              </div>
            )}
            {filteredRestaurants.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelect(r.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 ${
                  String(value) === String(r.id)
                    ? "bg-slate-50 dark:bg-slate-900 font-semibold"
                    : ""
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Rating() {
  const navigate = useNavigate();

  // =========================================================
  // TAB 1: GENERAL RATINGS -> GET /api/superadmin/ratings/all
  // Query params: page, limit, restaurantId
  // =========================================================
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [generalRestaurantId, setGeneralRestaurantId] = useState("");

  const { data: ratingsResponse, isLoading: isTableLoading } = useQuery({
    queryKey: ["ratings-all", page, limit, generalRestaurantId],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/ratings/all", {
        params: {
          page,
          limit,
          ...(generalRestaurantId ? { restaurantId: generalRestaurantId } : {}),
        },
      });
      return res.data.data;
    },
    keepPreviousData: true,
  });

  const generalRatingsList = ratingsResponse?.data || [];
  const generalPagination = ratingsResponse?.pagination || {
    total: 0,
    page,
    limit,
    totalPages: 1,
  };

  const averageRating =
    ratingsResponse?.averageRating ??
    (generalRatingsList.length
      ? (
          generalRatingsList.reduce(
            (sum, item) => sum + (Number(item.rating) || 0),
            0,
          ) / generalRatingsList.length
        ).toFixed(1)
      : 0);

  // Edit / Delete mutations for a single rating -> PUT/DELETE /api/superadmin/ratings/{id}
  // "ratings-all" matches the queryKey prefix above, so invalidateQueries refetches it
  const updateRatingMutation = useUpdate(
    "/api/superadmin/ratings",
    "ratings-all",
  );
  const deleteRatingMutation = useDelete(
    "/api/superadmin/ratings",
    "ratings-all",
  );

  // Edit / Delete mutations for the customer-ratings tab (separate cache key)
  const customerQueryKeyRef = React.useRef("");
  const updateCustomerRatingMutation = useUpdate("/api/superadmin/ratings", "");
  const deleteCustomerRatingMutation = useDelete("/api/superadmin/ratings", "");
  // Note: useDelete builds `${url}/${id}` internally, which already matches
  // DELETE /api/superadmin/ratings/{rateid} exactly — no customUrl needed.

  // --- Edit modal state (shared, works for both tabs) ---
  const [editingRow, setEditingRow] = useState(null); // { id, rating, comment, source: "general" | "customer" }
  const [editForm, setEditForm] = useState({ rating: 0, comment: "" });

  const openEditModal = (row, source) => {
    setEditingRow({ ...row, source });
    setEditForm({
      rating: Number(row.rating) || 0,
      comment: row.comment || row.ratingComment || "",
    });
  };

  const closeEditModal = () => {
    setEditingRow(null);
    setEditForm({ rating: 0, comment: "" });
  };

  const saveEdit = () => {
    if (!editingRow) return;
    const payload = {
      rating: Number(editForm.rating),
      comment: editForm.comment,
    };

    if (editingRow.source === "general") {
      updateRatingMutation.mutate(
        { id: editingRow.id, payload },
        { onSuccess: () => closeEditModal() },
      );
    } else {
      updateCustomerRatingMutation.mutate(
        {
          id: editingRow.id,
          payload,
          customUrl: `/api/superadmin/ratings/${editingRow.id}`,
        },
        {
          onSuccess: () => {
            closeEditModal();
          },
        },
      );
    }
  };

  const handleDelete = (row, source) => {
    if (!window.confirm("Are you sure you want to delete this rating?")) return;

    if (source === "general") {
      deleteRatingMutation.mutate(row.id);
    } else {
      deleteCustomerRatingMutation.mutate(row.id);
    }
  };

  const renderStars = (ratingValue) => (
    <div className="flex items-center justify-center gap-1.5">
      <span className="font-bold text-slate-700 text-xs">{ratingValue}</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= ratingValue;
          return (
            <Star
              key={starIndex}
              className={`h-4 w-4 ${
                isFilled
                  ? "fill-amber-500 text-amber-500"
                  : "fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800"
              }`}
            />
          );
        })}
      </div>
    </div>
  );

  const renderActions = (row, source) => (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => openEditModal(row, source)}
        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => handleDelete(row, source)}
        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  // General ratings table columns
  const generalColumns = [
    { accessorKey: "userName", header: "Customer Name" },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => renderStars(Number(row.original.rating) || 0),
    },
    { accessorKey: "comment", header: "Comment" },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) =>
        row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString()
          : "N/A",
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => renderActions(row.original, "general"),
    },
  ];

  // Restaurants list for the "Restaurant" filter dropdowns (shared by both tabs,
  // same source as the Users page)
  const { data: restaurants = [], isLoading: isRestaurantsLoading } = useQuery({
    queryKey: ["branches-select"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/branches/select");
      return res.data.data.data.restaurant || [];
    },
  });

  // =========================================================
  // TAB 2: CUSTOMER RATINGS -> GET /api/superadmin/ratings/all-customer-ratings
  // Query params: restaurantId, startDate, endDate
  // =========================================================
  const [restaurantId, setRestaurantId] = useState("");
  const [startDateCustomer, setStartDateCustomer] = useState("");
  const [endDateCustomer, setEndDateCustomer] = useState("");

  const customerQueryKey = `all-customer-ratings-${restaurantId}-${startDateCustomer}-${endDateCustomer}`;
  customerQueryKeyRef.current = customerQueryKey;

  const customerParams = new URLSearchParams();
  if (restaurantId) customerParams.set("restaurantId", restaurantId);
  if (startDateCustomer) customerParams.set("startDate", startDateCustomer);
  if (endDateCustomer) customerParams.set("endDate", endDateCustomer);

  const { data: customerRatingsData, isLoading: isCustomerTableLoading } =
    useGet(
      customerQueryKey,
      `/api/superadmin/ratings/all-customer-ratings${
        customerParams.toString() ? `?${customerParams.toString()}` : ""
      }`,
    );

  const customerRatingsResponse =
    customerRatingsData?.data?.data || customerRatingsData?.data || {};
  const customerRatingsList = customerRatingsResponse?.customers || [];
  const customerSummary = customerRatingsResponse?.summary || {};

  // Flatten orders out of each customer
  const flattenedCustomerOrders = [];
  customerRatingsList.forEach((item) => {
    const customer = item.customer || {};
    if (item.orders && Array.isArray(item.orders)) {
      item.orders.forEach((order) => {
        flattenedCustomerOrders.push({
          id: order.orderId,
          customerName: customer.name || "N/A",
          customerPhone: customer.phone || "N/A",
          customerTotalOrders: item.totalOrders || 0,
          orderNumber: order.orderNumber || "N/A",
          orderCreatedAt: order.orderCreatedAt,
          orderTotalAmount: order.orderTotalAmount || "0.00",
          orderStatus: order.orderStatus || "N/A",
          rating: order.rating || 0,
          ratingComment: order.ratingComment || "",
        });
      });
    }
  });

  const customerOrderColumns = [
    {
      accessorKey: "orderNumber",
      header: "Order Number",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => navigate(`/orders/details/${row.original.id}`)}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
        >
          {row.getValue("orderNumber")}
        </button>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-800 dark:text-slate-100">
            {row.original.customerName}
          </span>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            {row.original.customerTotalOrders || 0} orders
          </span>
        </div>
      ),
    },
    { accessorKey: "customerPhone", header: "Phone Number" },
    {
      accessorKey: "orderTotalAmount",
      header: "Total Amount",
      cell: ({ row }) => `${row.original.orderTotalAmount}`,
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => renderStars(Number(row.original.rating) || 0),
    },
    { accessorKey: "ratingComment", header: "Comment" },
    {
      accessorKey: "orderCreatedAt",
      header: "Date",
      cell: ({ row }) =>
        row.original.orderCreatedAt
          ? new Date(row.original.orderCreatedAt).toLocaleString()
          : "N/A",
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => renderActions(row.original, "customer"),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="general" className="space-y-6 w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full flex">
          <TabsTrigger
            value="general"
            className="rounded-lg font-bold text-sm p-3 flex-1"
          >
            Restaurant Rate
          </TabsTrigger>
          <TabsTrigger
            value="customer"
            className="rounded-lg font-bold text-sm p-3 flex-1"
          >
            Order Rate
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GENERAL RATINGS */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border shadow-sm text-center">
              <h3 className="text-sm text-slate-500">Average Rating</h3>
              <p className="text-3xl font-black text-primary">
                {averageRating || 0}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border shadow-sm text-center">
              <h3 className="text-sm text-slate-500">Total Ratings</h3>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                {generalPagination.total || 0}
              </p>
            </div>
          </div>

          {/* Filter: restaurantId */}
          <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">
                Restaurant:
              </span>
              <RestaurantSelect
                restaurants={restaurants}
                isLoading={isRestaurantsLoading}
                value={generalRestaurantId}
                onChange={(id) => {
                  setGeneralRestaurantId(id);
                  setPage(1); // reset to first page when filter changes
                }}
              />
            </div>
            {generalRestaurantId && (
              <button
                onClick={() => {
                  setGeneralRestaurantId("");
                  setPage(1);
                }}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>

          <GenericDataTable
            title=""
            columns={generalColumns}
            data={generalRatingsList}
            isLoading={isTableLoading}
            actions={false}
            // Server-side pagination, same pattern as the Users page
            serverPagination={generalPagination}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1); // reset to first page when page size changes
            }}
          />
        </TabsContent>

        {/* TAB 2: CUSTOMER / ORDER RATINGS */}
        <TabsContent value="customer" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border shadow-sm text-center">
              <h3 className="text-sm text-slate-500">Total Rated Orders</h3>
              <p className="text-3xl font-black text-primary">
                {customerSummary.totalRatedOrders || 0}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border shadow-sm text-center">
              <h3 className="text-sm text-slate-500">Total Unique Customers</h3>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                {customerSummary.totalUniqueCustomers || 0}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border shadow-sm text-center">
              <h3 className="text-sm text-slate-500">Overall Average Rating</h3>
              <p className="text-3xl font-black text-amber-500">
                {customerSummary.overallAverageRating || 0}
              </p>
            </div>
          </div>

          {/* Filters: restaurantId, startDate, endDate */}
          <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">
                Restaurant:
              </span>
              <RestaurantSelect
                restaurants={restaurants}
                isLoading={isRestaurantsLoading}
                value={restaurantId}
                onChange={setRestaurantId}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">
                From Date:
              </span>
              <input
                type="date"
                value={startDateCustomer}
                onChange={(e) => setStartDateCustomer(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm bg-transparent dark:border-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">
                To Date:
              </span>
              <input
                type="date"
                value={endDateCustomer}
                onChange={(e) => setEndDateCustomer(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm bg-transparent dark:border-slate-800"
              />
            </div>
            {(restaurantId || startDateCustomer || endDateCustomer) && (
              <button
                onClick={() => {
                  setRestaurantId("");
                  setStartDateCustomer("");
                  setEndDateCustomer("");
                }}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>

          <GenericDataTable
            title=""
            columns={customerOrderColumns}
            data={flattenedCustomerOrders}
            isLoading={isCustomerTableLoading}
            actions={false}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Rating Modal */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Edit Rating</h3>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">
                Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starIndex) => (
                  <button
                    key={starIndex}
                    type="button"
                    onClick={() =>
                      setEditForm((f) => ({ ...f, rating: starIndex }))
                    }
                  >
                    <Star
                      className={`h-6 w-6 ${
                        starIndex <= editForm.rating
                          ? "fill-amber-500 text-amber-500"
                          : "fill-slate-200 text-slate-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">
                Comment
              </label>
              <textarea
                value={editForm.comment}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, comment: e.target.value }))
                }
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-transparent dark:border-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 text-sm rounded-lg border font-medium hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={
                  updateRatingMutation.isPending ||
                  updateCustomerRatingMutation.isPending
                }
                className="px-4 py-2 text-sm rounded-lg bg-primary text-white font-medium flex items-center gap-2 disabled:opacity-60"
              >
                {(updateRatingMutation.isPending ||
                  updateCustomerRatingMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
