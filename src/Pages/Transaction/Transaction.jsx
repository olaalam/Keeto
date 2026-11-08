import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarRange,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getTransactions = (response) => {
  const payload = response?.data?.data?.data ?? response?.data?.data;
  const rows = Array.isArray(payload)
    ? payload
    : payload?.transactions ?? payload?.items;

  if (!Array.isArray(rows)) {
    throw new Error("The transactions endpoint returned an unexpected response.");
  }

  return rows;
};

const renderText = (value) => {
  const text = value == null || value === "" ? "—" : String(value);
  return (
    <span className="block max-w-[220px] truncate" title={text}>
      {text}
    </span>
  );
};

const formatAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} E£`
    : "—";
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

export default function Transaction() {
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [visaSwitchConditionType, setVisaSwitchConditionType] = useState("");
  const [cancelType, setCancelType] = useState("");

  const {
    data: transactions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "transactions",
      restaurantId,
      startDate,
      endDate,
      visaSwitchConditionType,
      cancelType,
    ],
    queryFn: async () => {
      const response = await api.get(
        `/api/superadmin/wallets/transactions/${restaurantId}`,
        {
          params: {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            visaSwitchConditionType: visaSwitchConditionType || undefined,
            cancelType: cancelType || undefined,
          },
        },
      );
      return getTransactions(response);
    },
    enabled: Boolean(restaurantId),
  });

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setVisaSwitchConditionType("");
    setCancelType("");
  };

  const latestTransaction = [...transactions].sort(
    (first, second) =>
      new Date(second.createdAt || 0).getTime() -
      new Date(first.createdAt || 0).getTime(),
  )[0];
  const totalMovement = transactions.reduce(
    (total, transaction) => total + (Number(transaction.amount) || 0),
    0,
  );
  const activeFilterCount = [
    startDate,
    endDate,
    visaSwitchConditionType,
    cancelType,
  ].filter(Boolean).length;

  const columns = [
    {
      accessorKey: "order.dailyOrderNumber",
      header: "Order Daily Number",
      cell: ({ row }) =>
        renderText(
          row.original.order?.dailyOrderNumber ?? row.original.orderDailyNumber,
        ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => renderText(formatDate(row.original.createdAt)),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
          {row.original.type || "Transaction"}
        </span>
      ),
    },
    {
      accessorKey: "cancelType",
      header: "Cancel Type",
      cell: ({ row }) =>
        renderText(row.original.cancelType ?? row.original.order?.cancelType),
    },
    {
      accessorKey: "visaSwitchConditionType",
      header: "Condition Type",
      cell: ({ row }) => renderText(row.original.visaSwitchConditionType),
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => renderText(row.original.method),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = Number(row.original.amount);
        const isCredit = amount >= 0;
        const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
        return (
          <span
            className={`inline-flex items-center gap-1 font-mono font-bold ${
              isCredit ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {formatAmount(row.original.amount)}
          </span>
        );
      },
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => renderText(row.original.note),
    },
  ];

  return (
    <div className="container mx-auto space-y-7 py-8">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
              className="h-8 px-2 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <Wallet className="h-7 w-7 text-blue-200" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-200">
                  Restaurant wallet
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  Transaction history
                </h1>
                <p className="mt-1 max-w-full truncate text-xs text-slate-400 sm:text-sm">
                  Restaurant ID: {restaurantId}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Showing
            </p>
            <p className="mt-1 text-2xl font-bold">
              {isLoading ? "—" : transactions.length}
            </p>
            <p className="text-xs text-slate-400">transactions</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Transaction count</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {isLoading ? "Loading..." : transactions.length.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Net movement in results</p>
            <p className="mt-1 truncate font-mono text-xl font-bold text-slate-900">
              {isLoading ? "Loading..." : formatAmount(totalMovement)}
            </p>
          </div>
          <p className="ml-auto hidden text-right text-xs text-slate-400 md:block">
            Latest balance
            <span className="mt-1 block font-mono font-semibold text-slate-700">
              {formatAmount(latestTransaction?.balanceAfter)}
            </span>
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <CalendarRange className="h-4 w-4 text-indigo-600" />
              Filter transactions
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Narrow the results by date and Visa switch condition.
            </p>
          </div>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {activeFilterCount} active{" "}
              {activeFilterCount === 1 ? "filter" : "filters"}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
            Start date
            <Input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-10 w-44 rounded-xl border-slate-200 bg-slate-50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
            End date
            <Input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-10 w-44 rounded-xl border-slate-200 bg-slate-50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
            Visa switch condition
            <Select
              value={visaSwitchConditionType || "all"}
              onValueChange={(value) =>
                setVisaSwitchConditionType(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="h-10 w-52 rounded-xl border-slate-200 bg-slate-50">
                <SelectValue placeholder="All conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All conditions</SelectItem>
                <SelectItem value="amount">Amount based</SelectItem>
                <SelectItem value="day_of_week">Periodic · weekly</SelectItem>
                <SelectItem value="day_of_month">Periodic · monthly</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
            Cancelled by
            <Select
              value={cancelType || "all"}
              onValueChange={(value) =>
                setCancelType(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="h-10 w-48 rounded-xl border-slate-200 bg-slate-50">
                <SelectValue placeholder="All cancellation types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cancellation types</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </label>
          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{error.message}</span>
          <Button
            type="button"
            variant="outline"
            className="border-red-200 bg-white text-red-700 hover:bg-red-100"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">All transactions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Detailed wallet activity for this restaurant.
            </p>
          </div>
          {!isLoading && !error && (
            <span className="text-xs font-medium text-slate-500">
              {transactions.length} records
            </span>
          )}
        </div>
        <GenericDataTable
          title="Transaction records"
          columns={columns}
          data={transactions}
          isLoading={isLoading}
          queryKey="transactions"
          actions={false}
        />
      </section>
    </div>
  );
}
