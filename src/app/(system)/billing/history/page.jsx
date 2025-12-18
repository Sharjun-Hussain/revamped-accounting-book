"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Printer,
  History,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Calendar as CalendarIcon,
  CreditCard,
  Banknote,
  Globe,
  Ban,
  Download,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { format } from "date-fns";

// UI Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Calendar } from "@/components/ui/calendar"; // Ensure you have shadcn calendar
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table"; 

// UTILS Import
import { exportToCSV, exportToPDF } from "@/lib/export-utils";
import { cn } from "@/lib/utils";

import { accountingService } from "@/services/accountingService";
import { toast } from "sonner";

import { BillingSkeleton } from "@/components/billing/BillingSkeleton";

// --- MOCK DATA REMOVED ---

// --- COLUMNS ---
const columns = [
  {
    accessorKey: "id",
    header: "Receipt #",
    cell: ({ row }) => <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">{row.getValue("id")}</span>,
  },
  {
    accessorKey: "date",
    header: "Date",
    // CUSTOM FILTER FUNCTION FOR DATE RANGE
    filterFn: (row, columnId, filterValue) => {
        if (!filterValue?.from) return true;
        const rowDate = new Date(row.getValue(columnId));
        const from = filterValue.from;
        const to = filterValue.to || from; // If no end date, assume single day
        
        // Reset times for comparison
        rowDate.setHours(0,0,0,0);
        from.setHours(0,0,0,0);
        to.setHours(0,0,0,0);

        return rowDate >= from && rowDate <= to;
    },
    cell: ({ row }) => (
        <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">{format(new Date(row.getValue("date")), "MMM dd, yyyy")}</span>
            <span className="text-[10px] text-slate-400">{format(new Date(row.getValue("date")), "hh:mm a")}</span>
        </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Member",
    cell: ({ row }) => (
        <div>
            <div className="font-medium text-slate-900">{row.original.name}</div>
            <div className="text-xs text-emerald-600 font-mono">{row.original.member_id}</div>
        </div>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Amount <ArrowUpDown className="ml-2 h-3 w-3" /></Button>,
    cell: ({ row }) => <div className="font-bold text-slate-900">Rs. {row.getValue("amount").toLocaleString()}</div>,
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
        const m = row.getValue("method");
        return (
            <div className="flex items-center gap-2 text-xs text-slate-600">
                {m === "Cash" && <Banknote className="w-3 h-3 text-emerald-500" />}
                {m === "Bank Transfer" && <CreditCard className="w-3 h-3 text-blue-500" />}
                {m === "Online" && <Globe className="w-3 h-3 text-purple-500" />}
                {m}
            </div>
        )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const s = row.getValue("status");
        return <Badge variant="outline" className={s === "Valid" ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}>{s}</Badge>
    }
  },
];

export default function PaymentHistoryPage() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  // DATE RANGE STATE
  const [dateRange, setDateRange] = useState(undefined);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch Payments
  const fetchPayments = async () => {
    try {
        setLoading(true);
        const params = {};
        if (dateRange?.from) params.from = dateRange.from.toISOString();
        if (dateRange?.to) params.to = dateRange.to.toISOString();
        
        const data = await accountingService.getPaymentHistory(params);
        setPayments(data);
    } catch (error) {
        console.error("Error fetching payments:", error);
        toast.error("Failed to load payment history");
    } finally {
        setLoading(false);
    }
  };

  useState(() => {
    fetchPayments();
  }, [dateRange]);

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

  // --- HANDLERS ---

  // 1. Handle Date Picker Change
  const handleDateSelect = (range) => {
    setDateRange(range);
    // Apply filter to 'date' column
    table.getColumn("date")?.setFilterValue(range);
  };

  // 2. Clear Date Filter
  const clearDateFilter = () => {
    setDateRange(undefined);
    table.getColumn("date")?.setFilterValue(undefined);
  }

  // 3. Handle Exports
  const handleExport = (type) => {
    // Get visible rows (respecting filters)
    const rows = table.getFilteredRowModel().rows.map(r => r.original);
    
    if (type === 'csv') {
        // Flatten data for CSV
        const csvData = rows.map(r => ({
            "Receipt ID": r.id,
            "Date": format(new Date(r.date), "yyyy-MM-dd HH:mm"),
            "Member ID": r.member_id,
            "Name": r.name,
            "Amount": r.amount,
            "Method": r.method,
            "Status": r.status
        }));
        exportToCSV(csvData, "payment_history.csv");
    } 
    else if (type === 'pdf') {
        const columns = [
            { header: "Date", dataKey: "dateFormatted" },
            { header: "Receipt #", dataKey: "id" },
            { header: "Member", dataKey: "name" },
            { header: "Method", dataKey: "method" },
            { header: "Status", dataKey: "status" },
            { header: "Amount (LKR)", dataKey: "amountFormatted" },
        ];

        // Format data for PDF
        const pdfData = rows.map(r => ({
            ...r,
            dateFormatted: format(new Date(r.date), "yyyy-MM-dd"),
            amountFormatted: r.amount.toLocaleString()
        }));

        exportToPDF(columns, pdfData, "Payment History Report", "payment_report.pdf");
    }
  };

  if (loading) {
    return <BillingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <History className="h-8 w-8 text-emerald-600" />
                    Payment History
                </h1>
                <p className="text-slate-500">View and manage past Sanda collections.</p>
            </div>
            
            {/* EXPORT BUTTONS */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-white text-slate-700">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                        <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel / CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                        <FileText className="w-4 h-4 mr-2 text-red-600" /> PDF (Letterhead)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* TOOLBAR */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    
                    {/* Filters */}
                    <div className="flex flex-1 items-center gap-3 w-full flex-wrap">
                        {/* Name Search */}
                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search receipt ID or name..."
                                value={(table.getColumn("name")?.getFilterValue()) ?? ""}
                                onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                                className="pl-10 bg-slate-50 border-slate-200"
                            />
                        </div>
                        
                        {/* Date Range Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal bg-slate-50 border-slate-200",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                                {format(dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
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
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={handleDateSelect}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                        
                        {/* Clear Date Button */}
                        {dateRange && (
                             <Button variant="ghost" onClick={clearDateFilter} className="h-9 px-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                                Reset Date
                             </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* DATA TABLE */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
             <DataTable table={table} columns={columns} />
        </Card>

      </motion.div>
    </div>
  );
}