"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowUpDown,
  Calendar as CalendarIcon,
  CreditCard,
  Banknote,
  Globe,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Wallet,
  Activity,
  X,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";

// UI Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table";

// UTILS Import
import { exportToCSV, exportToPDF } from "@/lib/export-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BillingSkeleton } from "@/components/billing/BillingSkeleton";

// --- COLUMNS (Visually Rich) ---
const columns = [
  {
    accessorKey: "id",
    header: "Receipt No.",
    cell: ({ row }) => (
      <div className="flex items-center">
        <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/50 shadow-sm">
          #{row.getValue("id")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Member Details",
    cell: ({ row }) => {
      const name = row.original.name || "Unknown";
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      return (
        <div className="flex items-center gap-3 py-1">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-sm">
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center border border-white">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-xs">
                {initials}
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">{name}</span>
            <span className="text-[11px] font-medium text-slate-500">{row.original.member_id}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "date",
    header: "Date & Time",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue?.from) return true;
      const rowDate = new Date(row.getValue(columnId));
      const from = filterValue.from;
      const to = filterValue.to || from;

      rowDate.setHours(0, 0, 0, 0);
      from.setHours(0, 0, 0, 0);
      to.setHours(0, 0, 0, 0);

      return rowDate >= from && rowDate <= to;
    },
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-slate-800">
          {format(new Date(row.getValue("date")), "MMM dd, yyyy")}
        </span>
        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
          <CalendarIcon className="w-3 h-3 text-slate-400" />
          {format(new Date(row.getValue("date")), "hh:mm a")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      const m = row.getValue("method");
      const getMethodStyle = () => {
        switch (m) {
          case "Cash": return { bg: "bg-emerald-100/80", text: "text-emerald-700", icon: <Banknote className="w-4 h-4" /> };
          case "Bank Transfer": return { bg: "bg-blue-100/80", text: "text-blue-700", icon: <CreditCard className="w-4 h-4" /> };
          case "Online": return { bg: "bg-purple-100/80", text: "text-purple-700", icon: <Globe className="w-4 h-4" /> };
          default: return { bg: "bg-slate-100", text: "text-slate-700", icon: <Activity className="w-4 h-4" /> };
        }
      };
      const style = getMethodStyle();

      return (
        <div className="flex items-center gap-2.5">
          <div className={cn("p-1.5 rounded-lg shadow-sm border border-white/50", style.bg, style.text)}>
            {style.icon}
          </div>
          <span className="text-sm font-medium text-slate-700">{m}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0 hover:bg-transparent text-slate-500 font-semibold h-auto flex items-center gap-1.5 transition-colors hover:text-indigo-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount <ArrowUpDown className="h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-bold text-slate-900 tabular-nums">
        Rs. {row.getValue("amount").toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.getValue("status");
      const isValid = s === "Valid";

      return (
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm",
          isValid
            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
            : "bg-rose-50 text-rose-700 border-rose-200/60"
        )}>
          <span className="relative flex h-2 w-2">
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              isValid ? "bg-emerald-400" : "bg-rose-400"
            )}></span>
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              isValid ? "bg-emerald-500" : "bg-rose-500"
            )}></span>
          </span>
          {s}
        </div>
      )
    }
  },
];

export default function PaymentHistoryPage() {
  // --- STATES ---
  const [dateRange, setDateRange] = useState(undefined);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  // Data Fetching
  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from.toISOString());
    if (dateRange?.to) params.append('to', dateRange.to.toISOString());
    return `/billing/history?${params.toString()}`;
  }, [dateRange]);

  const { data: payments = [], isLoading: loading } = useSWR(swrKey, apiFetcher);

  const table = useReactTable({
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  });

  // --- DERIVED STATS ---
  const filteredRows = table.getFilteredRowModel().rows.map(r => r.original);

  const stats = useMemo(() => {
    const validPayments = filteredRows.filter(p => p.status === "Valid");
    const totalVolume = validPayments.reduce((sum, p) => sum + p.amount, 0);
    const averageSize = validPayments.length ? (totalVolume / validPayments.length) : 0;

    return {
      totalVolume,
      transactionCount: filteredRows.length,
      averageSize
    };
  }, [filteredRows]);

  // --- HANDLERS ---
  const handleDateSelect = (range) => {
    setDateRange(range);
    table.getColumn("date")?.setFilterValue(range);
  };

  const clearDateFilter = () => {
    setDateRange(undefined);
    table.getColumn("date")?.setFilterValue(undefined);
  }

  const handleExport = (type) => {
    if (filteredRows.length === 0) {
      toast.error("No data available to export");
      return;
    }

    if (type === 'csv') {
      const csvData = filteredRows.map(r => ({
        "Receipt ID": r.id,
        "Date": format(new Date(r.date), "yyyy-MM-dd HH:mm"),
        "Member ID": r.member_id,
        "Name": r.name,
        "Amount": r.amount,
        "Method": r.method,
        "Status": r.status
      }));
      exportToCSV(csvData, "payment_history.csv");
      toast.success("CSV Exported successfully");
    }
    else if (type === 'pdf') {
      const pdfColumns = [
        { header: "Date", dataKey: "dateFormatted" },
        { header: "Receipt #", dataKey: "id" },
        { header: "Member", dataKey: "name" },
        { header: "Method", dataKey: "method" },
        { header: "Status", dataKey: "status" },
        { header: "Amount (LKR)", dataKey: "amountFormatted" },
      ];

      const pdfData = filteredRows.map(r => ({
        ...r,
        dateFormatted: format(new Date(r.date), "yyyy-MM-dd"),
        amountFormatted: r.amount.toLocaleString()
      }));

      exportToPDF(pdfColumns, pdfData, "Payment History Report", "payment_report.pdf");
      toast.success("PDF Exported successfully");
    }
  };

  if (loading) {
    return <BillingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden text-slate-900">

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-indigo-50/80 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-100/40 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col space-y-8 px-4 sm:px-8 pb-16 pt-4 max-w-[95rem] mx-auto"
      >

        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm mb-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Financial Overview
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Payment History
            </h1>
            <p className="text-slate-500 text-base max-w-2xl">
              Review and analyze collected payments. Use the filters below to generate specific reports for your accounting team.
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 border-0 h-11 px-6 rounded-xl transition-all active:scale-95 group">
                <Download className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                <span className="font-semibold">Export Report</span>
                <ChevronDown className="w-4 h-4 ml-2 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-100 p-2">
              <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Select Format</DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer rounded-lg p-3 hover:bg-slate-50 focus:bg-slate-50">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md mr-3">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-700">Excel / CSV</span>
                  <span className="text-[10px] text-slate-400">Raw spreadsheet data</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer rounded-lg p-3 hover:bg-slate-50 focus:bg-slate-50">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-md mr-3">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-700">PDF Document</span>
                  <span className="text-[10px] text-slate-400">Formatted for printing</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* PREMIUM STATS WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RichStatCard
            title="Total Collected"
            value={`Rs. ${stats.totalVolume.toLocaleString()}`}
            icon={<Wallet className="w-5 h-5 text-emerald-600" />}
            gradient="from-emerald-500/10 to-transparent"
            iconBg="bg-emerald-100"
            iconBorder="border-emerald-200"
          />
          <RichStatCard
            title="Total Transactions"
            value={stats.transactionCount}
            icon={<Activity className="w-5 h-5 text-blue-600" />}
            gradient="from-blue-500/10 to-transparent"
            iconBg="bg-blue-100"
            iconBorder="border-blue-200"
          />
          <RichStatCard
            title="Average Transaction"
            value={`Rs. ${Math.round(stats.averageSize).toLocaleString()}`}
            icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
            gradient="from-purple-500/10 to-transparent"
            iconBg="bg-purple-100"
            iconBorder="border-purple-200"
          />
        </div>

        {/* MAIN DATA SECTION */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">

          {/* FLOATING TOOLBAR */}
          <div className="p-5 border-b border-slate-100/80 bg-white/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-[320px] group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  placeholder="Search member name or ID..."
                  value={(table.getColumn("name")?.getFilterValue()) ?? ""}
                  onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                  className="h-11 pl-10 text-sm font-medium bg-slate-50/50 border-slate-200 shadow-inner rounded-xl focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 w-full transition-all hover:bg-slate-50"
                />
              </div>
            </div>

            {/* Date Filter & Clear */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-11 w-full sm:w-[260px] justify-start text-left text-sm font-semibold bg-white border-slate-200 shadow-sm rounded-xl transition-all hover:border-slate-300 hover:shadow",
                      !dateRange && "text-slate-500"
                    )}
                  >
                    <div className="p-1.5 bg-slate-100 rounded-md mr-3">
                      <CalendarIcon className="h-4 w-4 text-slate-600" />
                    </div>
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <span className="text-slate-900">
                          {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, y")}
                        </span>
                      ) : (
                        <span className="text-slate-900">{format(dateRange.from, "MMM dd, y")}</span>
                      )
                    ) : (
                      <span>Filter by date range...</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100 overflow-hidden" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    className="p-4 bg-white"
                  />
                </PopoverContent>
              </Popover>

              <AnimatePresence>
                {dateRange && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearDateFilter}
                      className="h-11 w-11 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shadow-sm border border-transparent hover:border-rose-100"
                      title="Clear dates"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* DATA GRID */}
          <div className="p-0 [&_.border-b]:border-slate-100/80 [&_th]:text-xs [&_th]:font-bold [&_th]:text-slate-500 [&_th]:bg-slate-50/50 [&_th]:uppercase [&_th]:tracking-wider [&_tr:hover]:bg-slate-50/50 [&_tr]:transition-colors">
            <DataTable table={table} columns={columns} />
          </div>
        </div>

      </motion.div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function RichStatCard({ title, value, icon, gradient, iconBg, iconBorder }) {
  return (
    <div className={cn(
      "relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/30 group hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
    )}>
      {/* Background Gradient Mesh */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", gradient)} />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-sm font-bold text-slate-500 tracking-wide">{title}</h3>
          <div className={cn("p-2.5 rounded-xl border shadow-sm group-hover:scale-110 transition-transform duration-300", iconBg, iconBorder)}>
            {icon}
          </div>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm">{value}</p>
        </div>
      </div>
    </div>
  )
}