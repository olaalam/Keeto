import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import { toast } from "sonner";
import GenericDataTable from "@/components/GenericDataTable";
import { useGet } from "@/hooks/useGet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle } from "lucide-react";

export default function RestaurantRatingRequestsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeTab, setActiveTab] = useState("requests");
  const [filters, setFilters] = useState({
    targetType: "",
    restaurantId: "",
  });

  const tabStatusMap = {
    requests: "pending",
    approved: "approved",
    rejected: "rejected",
  };

  const params = {
    page,
    limit,
    status: tabStatusMap[activeTab],
    ...(filters.targetType ? { targetType: filters.targetType } : {}),
    ...(filters.restaurantId ? { restaurantId: filters.restaurantId } : {}),
  };

  const { data: response, isLoading } = useGet(
    "restaurant-rating-requests",
    "/api/superadmin/ratings/requests",
    params,
  );

  const { data: restaurantsResponse = [], isLoading: isRestaurantsLoading } =
    useQuery({
      queryKey: ["restaurant-rating-request-restaurants"],
      queryFn: async () => {
        const { data } = await api.get("/api/superadmin/restaurants");
        const payload = data?.data?.data || data?.data || data || [];
        return Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.restaurants)
            ? payload.restaurants
            : [];
      },
    });

  // Response shape: { success, data: { message, data: [...requests], pagination } }
  const rawData =
    response?.data?.data?.data ||
    response?.data?.data ||
    response?.data ||
    response ||
    [];
  const requests = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.requests)
      ? rawData.requests
      : [];

  const pagination = response?.data?.data?.pagination ||
    response?.data?.pagination ||
    response?.pagination || {
      total: 0,
      page,
      limit,
      totalPages: 1,
    };

  const approveMutation = useMutation({
    mutationFn: async (id) => {
      const url = `/api/superadmin/ratings/requests/${id}/approve`;
      const { data } = await api.post(url, { adminNotes: "Approved by admin" });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["restaurant-rating-requests"],
      });
      toast.success("Rating request approved");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Approve failed");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id) => {
      const url = `/api/superadmin/ratings/requests/${id}/reject`;
      const { data } = await api.post(url, { adminNotes: "Rejected by admin" });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["restaurant-rating-requests"],
      });
      toast.success("Rating request rejected");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Reject failed");
    },
  });

  const columns = [
    {
      accessorKey: "restaurant",
      header: "Restaurant",
      cell: ({ row }) => {
        const r = row.original.restaurant;
        if (!r) return "—";
        return (
          <div className="flex items-center gap-2">
            {r.logo && (
              <img
                src={r.logo}
                alt={r.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            <span className="font-medium text-slate-800">
              {r.name || r.nameAr || "—"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "customer",
      header: "Requested By",
      cell: ({ row }) => {
        const c = row.original.customer;
        if (!c) return "—";
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">{c.name || "—"}</span>
            <span className="text-xs text-slate-500">
              {c.phone || c.email || ""}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "requestType",
      header: "Request Type",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.requestType || "—"}</span>
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating (Current → New)",
      cell: ({ row }) => {
        const r = row.original;
        const currentRating = r.restaurantRating?.rating;
        return (
          <span className="font-semibold text-slate-700">
            {currentRating ?? "—"}
            {" → "}
            <span className="text-violet-600">{r.newRating ?? "—"}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "comment",
      header: "Comment",
      cell: ({ row }) => {
        const r = row.original;
        const currentComment = r.restaurantRating?.comment;
        return (
          <div className="flex flex-col max-w-xs">
            {currentComment && (
              <span className="text-xs text-slate-400 line-through truncate">
                {currentComment}
              </span>
            )}
            <span className="text-slate-600 truncate">
              {r.newComment || "—"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="text-slate-600">{row.original.reason || "—"}</span>
      ),
    },
    {
      accessorKey: "targetType",
      header: "Target Type",
      cell: ({ row }) => (
        <span className="capitalize">
          {row.original.targetType || "restaurant"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <span className="text-slate-500">
          {row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "pending";
        const styles = {
          pending: "bg-amber-50 text-amber-700 border-amber-200",
          approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
          rejected: "bg-rose-50 text-rose-700 border-rose-200",
        };
        return (
          <span
            className={`border px-2 py-1 rounded-full text-xs font-bold capitalize ${styles[status] || styles.pending}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        const id = item.id;
        const isPending = item.status === "pending";
        if (!isPending) {
          return (
            <span className="text-xs text-slate-400">No action needed</span>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => approveMutation.mutate(id)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
            <button
              type="button"
              onClick={() => rejectMutation.mutate(id)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Restaurant Rating Requests
          </h1>
          <p className="text-sm text-slate-500">
            Moderate restaurant rating requests
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filters.restaurantId}
            onChange={(e) =>
              setFilters((current) => ({
                ...current,
                restaurantId: e.target.value,
              }))
            }
            disabled={isRestaurantsLoading}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Restaurants</option>
            {restaurantsResponse.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name ||
                  restaurant.restaurantName ||
                  restaurant.title ||
                  `Restaurant ${restaurant.id}`}
              </option>
            ))}
          </select>
          <select
            value={filters.targetType}
            onChange={(e) =>
              setFilters((current) => ({
                ...current,
                targetType: e.target.value,
              }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All target type</option>
            <option value="restaurant">Restaurant</option>
            <option value="order">Order</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          setPage(1);
        }}
        className="mb-4"
      >
        <TabsList className="rounded-xl bg-slate-100 p-1">
          <TabsTrigger
            value="requests"
            className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Requests
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Approved
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Rejected
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <GenericDataTable
        title="Rating Requests"
        columns={columns}
        data={requests}
        isLoading={isLoading}
        queryKey="restaurant-rating-requests"
        actions={false}
        serverPagination={pagination}
        onPageChange={(nextPage) => setPage(nextPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </div>
  );
}
