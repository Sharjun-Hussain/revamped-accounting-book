"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const ExpenseTableToolbar = ({ table, categories, bulkActionsComponent }) => {
  const isFiltered = table.getState().columnFilters.length > 0;
  const dateFilter = table.getColumn("date")?.getFilterValue();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex flex-1 items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
        {/* Filter by Description/Payee */}
        <div className="relative w-full max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search payee or description..."
            value={(table.getColumn("description")?.getFilterValue()) ?? ""}
            onChange={(event) =>
              table.getColumn("description")?.setFilterValue(event.target.value)
            }
            className="pl-10 bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Filter by Category */}
        <Select
          value={table.getColumn("category")?.getFilterValue() ?? ""}
          onValueChange={(value) => {
            table.getColumn("category")?.setFilterValue(value === "all" ? undefined : value);
          }}
        >
          <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 focus:ring-emerald-500">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter by Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal bg-slate-50 border-slate-200",
                !dateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter?.from ? (
                dateFilter.to ? (
                  <>
                    {format(dateFilter.from, "LLL dd, y")} -{" "}
                    {format(dateFilter.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateFilter.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateFilter?.from}
              selected={dateFilter}
              onSelect={(range) => table.getColumn("date")?.setFilterValue(range)}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Reset Filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3 text-slate-500 hover:text-rose-600"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      
      {bulkActionsComponent}
    </div>
  );
};
