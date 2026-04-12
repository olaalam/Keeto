import React, { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import DeleteDialog from './DeleteDialog';
import LoadingSpinner from './LoadingSpinner';

export default function GenericDataTable({
    columns, data, title, onAdd, onEdit, deleteApiUrl, queryKey, isLoading
}) {
    const [globalFilter, setGlobalFilter] = useState('');
    const [deleteId, setDeleteId] = useState(null);

    // إضافة عمود العمليات تلقائياً
    const tableColumns = useMemo(() => [
        ...columns,
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {onEdit && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
                            <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                    )}
                    {deleteApiUrl && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.original.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                    )}
                </div>
            ),
        }
    ], [columns, onEdit, deleteApiUrl]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                    <p className="text-muted-foreground text-sm">manage and display data for {title}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="search in fields..."
                            value={globalFilter ?? ""}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    {onAdd && <Button onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> add new</Button>}
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={tableColumns.length} className="text-center h-24"><LoadingSpinner /></TableCell></TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={tableColumns.length} className="text-center h-24">no data.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    <ChevronRight className="h-4 w-4 ml-1" /> prev
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    next <ChevronLeft className="h-4 w-4 mr-1" />
                </Button>
            </div>

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