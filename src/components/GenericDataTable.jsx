import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DeleteDialog from "./DeleteDialog";
import LoadingSpinner from "./LoadingSpinner";

export default function GenericDataTable({
  columns,
  data = [],
  title,
  onAdd,
  onEdit,
  deleteApiUrl,
  queryKey,
  isLoading,
  actions = true,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();
  const [highlightedId, setHighlightedId] = useState(null);

  // Pre-process and sort data to append newly added items at the very end
  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...data].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime; // newest first → newly added at top
    });
  }, [data]);

  // إضافة عمود الترقيم التلقائي وعمود العمليات
  const tableColumns = useMemo(() => {
    // 1. نبدأ بعمود الترقيم التسلسلي في بداية الجدول
    const baseColumns = [
      {
        id: "rowNumber",
        header: "#",
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;

          // 👇 الحل المضمون: إيجاد مكان الصف الفعلي داخل الصفحة الحالية فقط
          const indexInCurrentPage = table
            .getRowModel()
            .rows.findIndex((r) => r.id === row.id);

          return (
            <span className="font-mono text-gray-500">
              {pageIndex * pageSize + indexInCurrentPage + 1}
            </span>
          );
        },
        size: 50,
      },
      ...columns,
    ];

    // 2. إذا كانت actions تساوي true، نضيف عمود العمليات لنهاية المصفوفة
    if (actions) {
      baseColumns.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(row.original)}
              >
                <Pencil className="h-4 w-4 text-blue-600" />
              </Button>
            )}
            {deleteApiUrl && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(row.original.id)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
        ),
      });
    }

    return baseColumns;
  }, [columns, onEdit, deleteApiUrl, actions]);

  const table = useReactTable({
    data: sortedData, // Using the custom sorted array wrapper here
    columns: tableColumns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  return (
    <div className="space-y-5 w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="text-lg font-bold">{title?.[0]}</span>
          </div>

          {/* Text */}
          <div className="space-y-0.5">
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              {title}
            </h2>

            <p className="text-xs text-gray-500">
              Manage and monitor{" "}
              <span className="font-medium text-gray-700">{title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 rounded-lg"
            />
          </div>

          {onAdd && (
            <Button onClick={onAdd} className="rounded-lg shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs uppercase text-gray-500"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="text-center h-32"
                >
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group hover:bg-gray-50 transition"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="text-center h-32 text-gray-500"
                >
                  No data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* DELETE */}
      <DeleteDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        apiUrl={deleteApiUrl}
        onSuccessKey={queryKey}
        id={deleteId}
      />
    </div>
  );
}
