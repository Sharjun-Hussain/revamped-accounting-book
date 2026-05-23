"use client";

import React, { useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderIcon, PlusCircle, Download, Search, X } from "lucide-react";
import { CompactTableCard } from "@/components/general/compact-table-card";
import { CompactFilterToolbar } from "@/components/general/compact-filter-toolbar";

const ResourceTableToolbar = ({
  table,
  searchColumn,
  searchPlaceholder,
  bulkActionsComponent,
  filterComponents,
}) => {
  const columnFilters = table.getState().columnFilters;
  const isFiltered = columnFilters.length > 0;

  return (
    <CompactFilterToolbar end={bulkActionsComponent}>
      <div className="relative w-full sm:max-w-[220px] sm:flex-1 sm:min-w-[180px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder || "Search..."}
          value={table.getColumn(searchColumn)?.getFilterValue() ?? ""}
          onChange={(event) =>
            table.getColumn(searchColumn)?.setFilterValue(event.target.value)
          }
          className="h-9 pl-8 text-sm"
        />
      </div>
      {filterComponents?.(table)}

      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.resetColumnFilters()}
          className="h-9 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Clear ({columnFilters.length})
        </Button>
      )}
    </CompactFilterToolbar>
  );
};

export const ResourceManagementLayout = ({
  data,
  columns,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  headerTitle,
  headerDescription,
  addButtonLabel = "Add New",
  onAddClick,
  onExportClick,
  isAdding,
  statCardsComponent,
  bulkActionsComponent,
  searchColumn,
  searchPlaceholder,
  loadingSkeleton,
  filterComponents,
}) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  if (isLoading) {
    return loadingSkeleton || <p>Loading...</p>;
  }

  if (isError) {
    return (
      <div className="hidden h-full flex-1 flex-col space-y-4 px-6 pb-6 pt-3 md:flex">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error: {errorMessage}</p>
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderedBulkActions = bulkActionsComponent
    ? React.cloneElement(bulkActionsComponent, { table })
    : null;

  return (
    <div className="hidden h-full flex-1 flex-col space-y-4 px-6 pb-6 pt-3 md:flex">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{headerTitle}</h1>
          <p className="text-muted-foreground">{headerDescription}</p>
        </div>
        <div className="flex items-center space-x-3">
          {onExportClick && (
            <Button variant="outline" className="gap-2" onClick={onExportClick}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          {onAddClick && (
            <Button onClick={onAddClick} disabled={isAdding} className="gap-2">
              {isAdding ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              {addButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {statCardsComponent}

      <CompactTableCard
        toolbar={
          <ResourceTableToolbar
            table={table}
            searchColumn={searchColumn}
            searchPlaceholder={searchPlaceholder}
            bulkActionsComponent={renderedBulkActions}
            filterComponents={filterComponents}
          />
        }
      >
        <DataTable table={table} columns={columns} />
      </CompactTableCard>
    </div>
  );
};
