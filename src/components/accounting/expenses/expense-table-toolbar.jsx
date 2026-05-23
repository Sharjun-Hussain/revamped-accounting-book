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
import { CompactFilterToolbar } from "@/components/general/compact-filter-toolbar";

export const ExpenseTableToolbar = ({ table, categories, bulkActionsComponent }) => {
  const isFiltered = table.getState().columnFilters.length > 0;
  const dateFilter = table.getColumn("date")?.getFilterValue();

  return (
    <CompactFilterToolbar end={bulkActionsComponent}>
        <div className="relative w-full sm:max-w-[220px] sm:flex-1 sm:min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search payee or description..."
            value={(table.getColumn("description")?.getFilterValue()) ?? ""}
            onChange={(event) =>
              table.getColumn("description")?.setFilterValue(event.target.value)
            }
            className="h-9 pl-8 text-sm bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <Select
          value={table.getColumn("category")?.getFilterValue() ?? ""}
          onValueChange={(value) => {
            table.getColumn("category")?.setFilterValue(value === "all" ? undefined : value);
          }}
        >
          <SelectTrigger className="h-9 w-full sm:w-[150px] text-sm bg-slate-50 border-slate-200 focus:ring-emerald-500">
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

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "h-9 w-full sm:w-[200px] justify-start text-left text-sm font-normal bg-slate-50 border-slate-200",
                !dateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
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

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="h-9 px-2 text-slate-500 hover:text-rose-600"
          >
            Reset
            <X className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )}
    </CompactFilterToolbar>
  );
};
