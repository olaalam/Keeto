import React, { useMemo, useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Download,
  FileBarChart,
  Filter,
  Link as LinkIcon,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const RESTAURANT_TYPES = ["mega", "super", "A", "B", "C", "C-", "test"];
const TYPE_RANK = new Map(RESTAURANT_TYPES.map((type, index) => [type, index]));
const OPERATIONS_URL = "/api/superadmin/restaurant-operations";
const OPERATION_TYPES = ["branch", "callcenter"];
const OPERATION_STATUSES = [
  "demo",
  "sales",
  "data",
  "customer support",
  "visit",
  "start order",
  "qr",
  "points",
  "social media",
];
const APP_STATES = ["on", "off"];
const titleCase = (text) =>
  text.replace(/\b\w/g, (letter) => letter.toUpperCase());
const OPERATION_TYPE_OPTIONS = OPERATION_TYPES.map((value) => ({
  value,
  label: value === "callcenter" ? "Call Center" : "Branch",
}));
const STATUS_OPTIONS = OPERATION_STATUSES.map((value) => ({
  value,
  label: titleCase(value),
}));
const APP_OPTIONS = APP_STATES.map((value) => ({
  value,
  label: value.toUpperCase(),
}));

function CollectionView({ title, items, kind }) {
  const collection = Array.isArray(items) ? items : [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!collection.length}
        >
          View ({collection.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="max-h-72 overflow-y-auto">
        <p className="mb-1 font-semibold text-slate-800">{title}</p>
        {kind === "notes" ? (
          <ul className="space-y-1.5">
            {collection.map((note, index) => (
              <li
                key={index}
                className="whitespace-pre-wrap break-words rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700"
              >
                {note}
              </li>
            ))}
          </ul>
        ) : kind === "cuisines" ? (
          <div className="flex flex-wrap gap-1.5">
            {collection.map((cuisine) => (
              <Badge
                key={cuisine.id || cuisine.name}
                variant="secondary"
                className="font-medium"
              >
                {cuisine.name || cuisine.nameAr || "-"}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {collection.map((branch) => (
              <div
                key={branch.id || branch.name}
                className="rounded-lg border border-slate-100 bg-slate-50 p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-700">
                    {branch.name || branch.nameAr || "-"}
                  </p>
                  <span className="text-xs capitalize text-slate-500">
                    {branch.status || "-"}
                  </span>
                </div>
                {(branch.address || branch.addressAr) && (
                  <p className="mt-1 text-xs text-slate-500">
                    {branch.address || branch.addressAr}
                  </p>
                )}
                {branch.phoneNumber && (
                  <p className="mt-1 text-xs text-slate-500">
                    {branch.phoneNumber}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function MultiSelectFilter({ label, options, selected, onChange }) {
  const toggle = (value) =>
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0">
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 space-y-1 p-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => toggle(option.value)}
              className="h-4 w-4 accent-slate-800"
            />
            {option.label}
          </label>
        ))}
        {selected.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 w-full text-rose-600"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function getRows(responseData) {
  let result = responseData;

  for (
    let depth = 0;
    depth < 5 && result && !Array.isArray(result);
    depth += 1
  ) {
    if (result.success === false) {
      throw new Error(result.error?.message || "The request was unsuccessful.");
    }

    const collection =
      result.restaurantOperations ??
      result.operations ??
      result.restaurants ??
      result.rows ??
      result.items ??
      result.data;

    if (collection === undefined) break;
    result = collection;
  }

  if (!Array.isArray(result)) {
    throw new Error(
      "The restaurant operations API returned an unexpected response.",
    );
  }

  if (
    result.some((row) => !row || typeof row !== "object" || Array.isArray(row))
  ) {
    throw new Error(
      "The restaurant operations API returned invalid report rows.",
    );
  }

  return result;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function formatNotes(notes) {
  if (notes === null || notes === undefined || notes === "") return "-";
  if (Array.isArray(notes)) {
    return notes.length
      ? notes
          .map((note) =>
            typeof note === "object" && note !== null
              ? Object.values(note).filter(Boolean).join(": ")
              : String(note),
          )
          .join("; ")
      : "-";
  }
  if (typeof notes === "object") return JSON.stringify(notes);
  return String(notes);
}

function getErrorMessage(error) {
  const apiError = error?.response?.data?.error;
  const details = apiError?.details;

  if (Array.isArray(details) && details.length > 0) {
    return details
      .map(({ field, message }) => `${field ? `${field}: ` : ""}${message}`)
      .join("; ");
  }

  return (
    apiError?.message ||
    error?.message ||
    "Failed to load this restaurant type."
  );
}

function notesToLines(notes) {
  if (notes === null || notes === undefined || notes === "") return [];
  if (Array.isArray(notes)) {
    return notes
      .map((note) =>
        typeof note === "object" && note !== null
          ? Object.values(note).filter(Boolean).join(": ")
          : String(note),
      )
      .filter(Boolean);
  }
  if (typeof notes === "object") return [JSON.stringify(notes)];
  return String(notes)
    .split(/\r?\n/)
    .map((note) => note.trim())
    .filter(Boolean);
}

function textToLines(text) {
  return text
    .split(/\r?\n/)
    .map((note) => note.trim())
    .filter(Boolean);
}

// Notes are an array of strings. Edited here only, saved on their own.
function NotesEditor({ notes, isSaving, onSave }) {
  const savedNotes = notesToLines(notes);
  const [items, setItems] = useState(savedNotes);
  const [newNote, setNewNote] = useState("");

  const pending = newNote.trim();
  const finalNotes = pending ? [...items, pending] : items;
  const isDirty = JSON.stringify(finalNotes) !== JSON.stringify(savedNotes);

  const addNote = () => {
    if (!pending) return;
    setItems([...items, pending]);
    setNewNote("");
  };

  const save = () => {
    onSave(finalNotes); // sent as an array: ["note 1", "note 2"]
    setItems(finalNotes);
    setNewNote("");
  };

  return (
    <div className="mt-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Notes
      </h3>
      {items.length === 0 && (
        <p className="mt-1.5 text-xs text-slate-400">No notes yet.</p>
      )}
      <ul className="mt-1.5 space-y-1.5">
        {items.map((note, index) => (
          <li
            key={index}
            className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5"
          >
            <span className="whitespace-pre-wrap break-words text-sm text-slate-700">
              {note}
            </span>
            <button
              type="button"
              aria-label="Remove note"
              onClick={() => setItems(items.filter((_, i) => i !== index))}
              className="shrink-0 text-slate-400 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <Input
          aria-label="New note"
          value={newNote}
          onChange={(event) => setNewNote(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addNote();
            }
          }}
          placeholder="Write a note and press Enter"
          className="text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addNote}
          disabled={!pending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={isSaving || !isDirty}
          onClick={save}
          className="gap-1.5"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? "Saving..." : "Save Notes"}
        </Button>
      </div>
    </div>
  );
}

export default function RestaurantOperations() {
  const [selectedTypes, setSelectedTypes] = useState([]); // empty = all types
  const [filters, setFilters] = useState({
    operationType: [],
    status: [],
    app: [],
  });
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [pendingKeys, setPendingKeys] = useState(() => new Set());
  const queryClient = useQueryClient();

  const requestedTypes =
    selectedTypes.length === 0 ? RESTAURANT_TYPES : selectedTypes;
  const operationQueries = useQueries({
    queries: requestedTypes.map((restaurantType) => ({
      queryKey: ["restaurantOperations", restaurantType, filters],
      placeholderData: (previous) => previous,
      queryFn: async () => {
        // Multi-select values are sent comma-separated, e.g. status=demo,sales
        const params = { restaurantType };
        Object.entries(filters).forEach(([key, values]) => {
          if (values.length) params[key] = values.join(",");
        });
        const response = await api.get(OPERATIONS_URL, { params });

        return {
          restaurantType,
          rows: getRows(response.data),
        };
      },
    })),
  });

  const rows = useMemo(
    () =>
      operationQueries
        .flatMap((query) =>
          (query.data?.rows || []).map((record) => ({
            ...record,
            _reportRestaurantType:
              record.restaurant?.type || query.data.restaurantType,
          })),
        )
        .sort(
          (a, b) =>
            (TYPE_RANK.get(a.restaurant?.type || a._reportRestaurantType) ??
              RESTAURANT_TYPES.length) -
            (TYPE_RANK.get(b.restaurant?.type || b._reportRestaurantType) ??
              RESTAURANT_TYPES.length),
        ),
    [operationQueries],
  );

  const isFieldPending = (recordId, field) =>
    pendingKeys.has(`${recordId}:${field}`);

  // Apply a partial change to one record everywhere it is cached / displayed,
  // without refetching (so other edits are never overwritten).
  const patchRecord = (recordId, patch) => {
    queryClient.setQueriesData({ queryKey: ["restaurantOperations"] }, (old) =>
      old?.rows
        ? {
            ...old,
            rows: old.rows.map((record) =>
              record.id === recordId ? { ...record, ...patch } : record,
            ),
          }
        : old,
    );
    setSelectedOperation((current) =>
      current?.id === recordId ? { ...current, ...patch } : current,
    );
  };

  const setPending = (key, active) =>
    setPendingKeys((current) => {
      const next = new Set(current);
      if (active) next.add(key);
      else next.delete(key);
      return next;
    });

  // Every call updates ONE field only.
  const updateOperationMutation = useMutation({
    mutationFn: async ({ restaurantId, body }) => {
      if (!restaurantId)
        throw new Error("This operation is missing its restaurant ID.");
      return api.put(`${OPERATIONS_URL}/${restaurantId}`, body);
    },
    onMutate: ({ recordId, field, body }) => {
      setPending(`${recordId}:${field}`, true);
      patchRecord(recordId, { [field]: body[field] }); // optimistic
    },
    onSuccess: () => {
      toast.success("Updated successfully.");
    },
    onError: (error, { recordId, field, previousValue }) => {
      patchRecord(recordId, { [field]: previousValue }); // rollback this field only
      toast.error(getErrorMessage(error));
    },
    onSettled: (_data, _error, { recordId, field }) => {
      setPending(`${recordId}:${field}`, false);
    },
  });

  const updateField = (operation, field, value) => {
    if (isFieldPending(operation.id, field)) return;
    updateOperationMutation.mutate({
      restaurantId: operation.restaurantId,
      recordId: operation.id,
      field,
      previousValue: operation[field],
      body: {
        operationType: operation.operationType || OPERATION_TYPES[0],
        status: operation.status || OPERATION_STATUSES[0],
        app: operation.app || APP_STATES[0],
        notes: notesToLines(operation.notes),
        [field]: value, // only this field changes
      },
    });
  };

  const openOperationDetails = (operation) => {
    setSelectedOperation(operation);
  };

  const columns = [
    {
      id: "restaurant",
      accessorFn: (row) => row.restaurant?.name || row.restaurant?.nameAr,
      header: () => <div className="min-w-[170px] font-bold">Restaurant</div>,
      cell: ({ row }) => {
        const restaurant = row.original.restaurant || {};
        return (
          <button
            type="button"
            onClick={() => openOperationDetails(row.original)}
            className="flex min-w-[150px] items-center gap-2 text-left font-semibold text-blue-700 hover:text-blue-900 hover:underline"
          >
            {restaurant.logo ? (
              <img
                src={restaurant.logo}
                alt=""
                className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                {(restaurant.name || restaurant.nameAr || "?")
                  .slice(0, 1)
                  .toUpperCase()}
              </span>
            )}
            <span>{restaurant.name || restaurant.nameAr || "-"}</span>
          </button>
        );
      },
    },
    {
      accessorKey: "operationType",
      header: () => (
        <div className="min-w-[130px] font-bold">Operation Type</div>
      ),
      cell: ({ row }) => {
        const operation = row.original;
        return (
          <Select
            value={operation.operationType || OPERATION_TYPES[0]}
            disabled={isFieldPending(operation.id, "operationType")}
            onValueChange={(value) =>
              updateField(operation, "operationType", value)
            }
          >
            <SelectTrigger aria-label="Operation type" className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "callcenter" ? "Call Center" : "Branch"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Operation Status",
      cell: ({ row }) => {
        const operation = row.original;
        return (
          <Select
            value={operation.status || OPERATION_STATUSES[0]}
            disabled={isFieldPending(operation.id, "status")}
            onValueChange={(value) => updateField(operation, "status", value)}
          >
            <SelectTrigger aria-label="Operation status" className="w-[155px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATION_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace(/\b\w/g, (letter) => letter.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "app",
      header: "App",
      cell: ({ row }) => {
        const operation = row.original;
        return (
          <div className="flex items-center gap-2">
            <Switch
              aria-label="App state"
              checked={operation.app === "on"}
              disabled={isFieldPending(operation.id, "app")}
              onCheckedChange={(checked) =>
                updateField(operation, "app", checked ? "on" : "off")
              }
            />
            <span className="w-7 text-xs font-semibold uppercase text-slate-600">
              {operation.app === "on" ? "On" : "Off"}
            </span>
          </div>
        );
      },
    },
    {
      id: "restaurantType",
      accessorFn: (row) => row.restaurant?.type || row._reportRestaurantType,
      header: "Restaurant Type",
      cell: ({ getValue }) => (
        <Badge variant="outline" className="uppercase">
          {getValue() || "Unknown"}
        </Badge>
      ),
    },
    {
      id: "city",
      accessorFn: (row) =>
        row.restaurant?.city?.name || row.restaurant?.city?.nameAr,
      header: "City",
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      id: "cuisines",
      accessorFn: (row) => row.restaurant?.cuisines || [],
      header: "Cuisines",
      cell: ({ row }) => (
        <CollectionView
          title="Cuisines"
          items={row.original.restaurant?.cuisines}
          kind="cuisines"
        />
      ),
    },
    {
      id: "branches",
      accessorFn: (row) => row.restaurant?.branches || [],
      header: "Branches",
      cell: ({ row }) => (
        <CollectionView
          title="Branches"
          items={row.original.restaurant?.branches}
          kind="branches"
        />
      ),
    },
    {
      id: "notes",
      accessorFn: (row) => notesToLines(row.notes),
      header: "Notes",
      cell: ({ row }) => (
        <CollectionView
          title="Notes"
          items={notesToLines(row.original.notes)}
          kind="notes"
        />
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ getValue }) => formatDate(getValue()),
    },
  ];

  const isLoading = operationQueries.some((query) => query.isLoading);
  const errors = operationQueries
    .map((query, index) =>
      query.isError
        ? {
            type: requestedTypes[index],
            message: getErrorMessage(query.error),
          }
        : null,
    )
    .filter(Boolean);

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    Object.values(filters).some((v) => v.length > 0);

  const setFilter = (key) => (values) =>
    setFilters((current) => ({ ...current, [key]: values }));

  const clearFilters = () => {
    setSelectedTypes([]);
    setFilters({ operationType: [], status: [], app: [] });
  };

  const exportPDF = () => {
    const pdf = new jsPDF({ orientation: "landscape" });
    const headers = [
      "Restaurant",
      "Operation Type",
      "Operation Status",
      "App",
      "Restaurant Type",
      "City",
      "Notes",
      "Created At",
    ];
    const body = rows.map((row) => [
      row.restaurant?.name || row.restaurant?.nameAr || "-",
      row.operationType || "-",
      row.status || "-",
      row.app || "-",
      row.restaurant?.type || row._reportRestaurantType || "-",
      row.restaurant?.city?.name || row.restaurant?.city?.nameAr || "-",
      formatNotes(row.notes),
      formatDate(row.createdAt),
    ]);

    pdf.setFontSize(16);
    pdf.text("Restaurant Operations Report", 14, 16);
    autoTable(pdf, {
      startY: 22,
      head: [headers],
      body,
      styles: { fontSize: 8, overflow: "linebreak" },
      headStyles: { fillColor: [250, 204, 21], textColor: [30, 30, 30] },
    });
    pdf.save("Restaurant-Operations-Report.pdf");
  };

  return (
    <div className="container mx-auto min-h-screen space-y-6 bg-[#fafafa] px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Restaurant Operations Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Restaurant operation details grouped by restaurant type.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={exportPDF}
          disabled={rows.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
          <Filter className="h-4 w-4" />
          Filter by restaurant type
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={selectedTypes.length === 0 ? "default" : "outline"}
            onClick={() => setSelectedTypes([])}
          >
            All types
          </Button>
          {RESTAURANT_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={selectedTypes.includes(type) ? "default" : "outline"}
              onClick={() =>
                setSelectedTypes((current) =>
                  current.includes(type)
                    ? current.filter((item) => item !== type)
                    : [...current, type],
                )
              }
            >
              {type.toUpperCase()}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MultiSelectFilter
            label="Operation Type"
            options={OPERATION_TYPE_OPTIONS}
            selected={filters.operationType}
            onChange={setFilter("operationType")}
          />
          <MultiSelectFilter
            label="Operation Status"
            options={STATUS_OPTIONS}
            selected={filters.status}
            onChange={setFilter("status")}
          />
          <MultiSelectFilter
            label="App"
            options={APP_OPTIONS}
            selected={filters.app}
            onChange={setFilter("app")}
          />
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <X className="mr-1 h-4 w-4" />
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Some restaurant operation data could not be loaded.
          </div>
          {errors.map(({ type, message }) => (
            <p key={type}>
              <span className="font-semibold">{type.toUpperCase()}:</span>{" "}
              {message}
            </p>
          ))}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <FileBarChart className="h-5 w-5 text-amber-500" />
            Operations ({rows.length})
          </h2>
          {isLoading && (
            <span className="text-sm text-slate-500">Loading report...</span>
          )}
        </div>
        <GenericDataTable
          columns={columns}
          data={rows}
          title="Restaurant Operations"
          isLoading={isLoading}
          actions={false}
          sortByDate={false}
        />
      </div>

      <Dialog
        open={!!selectedOperation}
        onOpenChange={(open) => {
          if (!open) setSelectedOperation(null);
        }}
      >
        <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl p-6 sm:max-w-lg">
          {selectedOperation &&
            (() => {
              const restaurant = selectedOperation.restaurant || {};
              const owner =
                `${restaurant.ownerFirstName || ""} ${restaurant.ownerLastName || ""}`.trim();
              const phoneDigits = (restaurant.ownerPhone || "").replace(
                /\D/g,
                "",
              );
              const cuisines = restaurant.cuisines || [];
              const branches = restaurant.branches || [];

              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                      {restaurant.logo ? (
                        <img
                          src={restaurant.logo}
                          alt=""
                          className="h-14 w-14 rounded-xl border border-slate-200 object-cover shadow-sm"
                        />
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-500">
                          {(restaurant.name || restaurant.nameAr || "?")
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <DialogTitle className="text-lg font-bold text-slate-800">
                          {restaurant.name || restaurant.nameAr || "-"}
                        </DialogTitle>
                        <DialogDescription asChild>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${
                                restaurant.status === "active"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-rose-50 text-rose-600"
                              }`}
                            >
                              {restaurant.status || "-"}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                              {restaurant.type ||
                                selectedOperation._reportRestaurantType ||
                                "Unknown"}
                            </span>
                            {restaurant.city && (
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                {restaurant.city.name ||
                                  restaurant.city.nameAr ||
                                  "-"}
                              </span>
                            )}
                          </div>
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  {restaurant.cover && (
                    <img
                      src={restaurant.cover}
                      alt=""
                      className="h-32 w-full rounded-xl border border-slate-100 object-cover"
                    />
                  )}

                  <div className="space-y-5 pt-2 text-sm">
                    <section>
                      <h3 className="mb-3 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Operation Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          ["Operation Type", selectedOperation.operationType],
                          ["Status", selectedOperation.status],
                          ["App", selectedOperation.app],
                          ["Created", formatDate(selectedOperation.createdAt)],
                          ["Updated", formatDate(selectedOperation.updatedAt)],
                        ].map(([label, value]) => (
                          <div key={label} className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              {label}
                            </p>
                            <p className="mt-0.5 break-words font-semibold capitalize text-slate-700">
                              {value || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                      <NotesEditor
                        key={selectedOperation.id}
                        notes={selectedOperation.notes}
                        isSaving={isFieldPending(selectedOperation.id, "notes")}
                        onSave={(notes) =>
                          updateField(selectedOperation, "notes", notes)
                        }
                      />
                    </section>

                    <section className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Arabic Name
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-700">
                          {restaurant.nameAr || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          French Name
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-700">
                          {restaurant.nameFr || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Responsible Person
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-700">
                          {owner || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Owner Phone
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-700">
                          {restaurant.ownerPhone || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Call Center Phone
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-700">
                          {restaurant.callcenterphone || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Sales Representative
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-700">
                          {restaurant.sales?.name || "-"}
                        </p>
                        {restaurant.sales?.phone && (
                          <p className="text-xs text-slate-500">
                            {restaurant.sales.phone}
                          </p>
                        )}
                        {restaurant.sales?.email && (
                          <p className="break-all text-xs text-slate-500">
                            {restaurant.sales.email}
                          </p>
                        )}
                      </div>
                    </section>

                    <section className="border-t border-slate-100 pt-4">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Contact Channels & Links
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {restaurant.ownerPhone && (
                          <>
                            <a
                              href={`tel:${restaurant.ownerPhone}`}
                              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/40 bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              Call
                            </a>
                            <a
                              href={`https://wa.me/${phoneDigits}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 rounded-xl border border-green-200/40 bg-green-50 px-3 py-2.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp Chat
                            </a>
                          </>
                        )}
                        {restaurant.facebookLink && (
                          <a
                            href={restaurant.facebookLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-xl border border-blue-200/40 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Facebook Page
                          </a>
                        )}
                        {restaurant.orderLink && (
                          <a
                            href={restaurant.orderLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200/40 bg-indigo-50 px-3 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                            Direct Order Link
                          </a>
                        )}
                        {!restaurant.ownerPhone &&
                          !restaurant.facebookLink &&
                          !restaurant.orderLink && (
                            <p className="text-xs italic text-slate-400">
                              No contact lines or metadata available.
                            </p>
                          )}
                      </div>
                    </section>

                    <section className="border-t border-slate-100 pt-4">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Cuisines
                      </h3>
                      {cuisines.length ? (
                        <div className="flex flex-wrap gap-2">
                          {cuisines.map((cuisine) => (
                            <Badge
                              key={cuisine.id || cuisine.name}
                              variant="secondary"
                              className="font-medium"
                            >
                              {cuisine.name || cuisine.nameAr || "-"}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500">No cuisines listed.</p>
                      )}
                    </section>

                    <section className="border-t border-slate-100 pt-4">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Branches ({branches.length})
                      </h3>
                      {branches.length ? (
                        <div className="space-y-2">
                          {branches.map((branch) => (
                            <div
                              key={branch.id || branch.name}
                              className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-semibold text-slate-700">
                                  {branch.name || branch.nameAr || "-"}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="capitalize"
                                >
                                  {branch.status || "-"}
                                </Badge>
                              </div>
                              {(branch.address || branch.addressAr) && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {branch.address || branch.addressAr}
                                </p>
                              )}
                              {branch.phoneNumber && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {branch.phoneNumber}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500">No branches listed.</p>
                      )}
                    </section>
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
