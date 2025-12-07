"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ArrowUpRight,
  Filter,
  Download,
  Calendar as CalendarIcon,
  CreditCard,
  HandCoins,
  Search,
  Wallet,
  FileSpreadsheet,
  FileText,
  X
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format, isWithinInterval, parseISO, startOfDay } from "date-fns";

// UI Imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Calendar } from "@/components/ui/calendar";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table"; 
import { cn } from "@/lib/utils";

// Import Shared Utilities
import { exportToCSV, exportToPDF } from "@/lib/export-utils";

// --- 1. MOCK DATA ---
const trendData = [
  { name: 'Aug', Sanda: 45000, Donations: 20000 },
  { name: 'Sep', Sanda: 48000, Donations: 25000 },
  { name: 'Oct', Sanda: 52000, Donations: 18000 },
  { name: 'Nov', Sanda: 50000, Donations: 45000 }, 
  { name: 'Dec', Sanda: 55000, Donations: 30000 },
];

const pieData = [
  { name: 'Sanda (Fees)', value: 250000, color: '#059669' }, 
  { name: 'General Donations', value: 120000, color: '#0284c7' }, 
  { name: 'Zakat Fund', value: 85000, color: '#d97706' }, 
  { name: 'Jummah Collection', value: 45000, color: '#7c3aed' }, 
];

const mockLedger = [
  { id: "INC-9001", date: "2025-12-05", source: "Sanda", reference: "Abdul Rahman (M-001)", amount: 3000, method: "Cash", category: "Monthly Fee" },
  { id: "INC-9002", date: "2025-12-04", source: "Donation", reference: "Mr. Farook", amount: 15000, method: "Bank Transfer", category: "Building Fund" },
  { id: "INC-9003", date: "2025-12-04", source: "Sanda", reference: "Mohamed Fazil (M-002)", amount: 2000, method: "Online", category: "Monthly Fee" },
  { id: "INC-9004", date: "2025-12-03", source: "Donation", reference: "Friday Collection", amount: 12450, method: "Cash", category: "Jummah" },
  { id: "INC-9005", date: "2025-12-01", source: "Sanda", reference: "Yusuf Khan (M-003)", amount: 1500, method: "Cash", category: "Arrears Payment" },
  { id: "INC-9006", date: "2025-11-20", source: "Donation", reference: "Anonymous", amount: 5000, method: "Cash", category: "General" },
  { id: "INC-9007", date: "2025-11-15", source: "Sanda", reference: "Zaid Ahmed", amount: 1000, method: "Cash", category: "Monthly Fee" },
];

// --- 2. COLUMNS DEFINITION ---
const columns = [
  {
    accessorKey: "date",
    header: "Date",
    // Custom Filter Logic for Date Range
    filterFn: (row, columnId, filterValue) => {
        if (!filterValue || !filterValue.from) return true;
        
        const rowDate = parseISO(row.getValue(columnId)); // Convert string to Date
        const fromDate = startOfDay(filterValue.from);
        const toDate = filterValue.to ? startOfDay(filterValue.to) : fromDate;

        // Check if row date is within interval
        return isWithinInterval(rowDate, { start: fromDate, end: toDate });
    },
    cell: ({ row }) => <span className="text-sm text-slate-600">{format(new Date(row.getValue("date")), "MMM dd, yyyy")}</span>,
  },
  {
    accessorKey: "source",
    header: "Income Source",
    cell: ({ row }) => {
      const source = row.getValue("source");
      return (
        <Badge variant="outline" className={
            source === "Sanda" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-blue-50 text-blue-700 border-blue-200"
        }>
            {source === "Sanda" ? <CreditCard className="w-3 h-3 mr-1" /> : <HandCoins className="w-3 h-3 mr-1" />}
            {source}
        </Badge>
      );
    },
  },
  {
    accessorKey: "reference",
    header: "Reference / Payer",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-slate-900">{row.original.reference}</div>
        <div className="text-xs text-slate-500">{row.original.category}</div>
      </div>
    ),
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{row.getValue("method")}</span>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <div className="text-right">Amount</div>,
    cell: ({ row }) => <div className="text-right font-bold text-slate-900">Rs. {row.getValue("amount").toLocaleString()}</div>,
  },
];

export default function IncomeSummaryPage() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [dateRange, setDateRange] = useState(undefined);

  const table = useReactTable({
    data: mockLedger,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  });

  // --- HANDLER: DATE CHANGE ---
  const handleDateSelect = (range) => {
    setDateRange(range);
    // Apply filter to the 'date' column
    table.getColumn("date")?.setFilterValue(range);
  };

  // --- HANDLER: EXPORT (FILTERED) ---
  const handleExport = (type) => {
    // 1. Critical: Get filtered rows only
    const rows = table.getFilteredRowModel().rows.map(r => r.original);

    if (rows.length === 0) {
        alert("No records to export based on current filters.");
        return;
    }

    if (type === 'csv') {
        const csvData = rows.map(r => ({
            "Transaction ID": r.id,
            "Date": r.date,
            "Source": r.source,
            "Reference": r.reference,
            "Category": r.category,
            "Method": r.method,
            "Amount": r.amount
        }));
        exportToCSV(csvData, `Income_Summary_${format(new Date(), "yyyy-MM-dd")}.csv`);
    } 
    else if (type === 'pdf') {
        const columns = [
            { header: "Date", dataKey: "date" },
            { header: "Source", dataKey: "source" },
            { header: "Reference", dataKey: "reference" },
            { header: "Category", dataKey: "category" },
            { header: "Amount (LKR)", dataKey: "amountFormatted" },
        ];

        const pdfData = rows.map(r => ({
            ...r,
            amountFormatted: r.amount.toLocaleString()
        }));

        const title = dateRange?.from 
            ? `Income Report (${format(dateRange.from, 'MMM d')} - ${dateRange.to ? format(dateRange.to, 'MMM d') : ''})` 
            : "Full Income History";

        exportToPDF(columns, pdfData, title, "Income_Report.pdf");
    }
  };

  // --- HELPER: CALCULATE TOTAL FOR FILTERED ROWS ---
  const filteredTotal = table.getFilteredRowModel().rows.reduce((sum, row) => sum + row.original.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-emerald-600" />
                    Income Summary
                </h1>
                <p className="text-slate-500">Overview of all incoming funds, collections, and donations.</p>
            </div>
            
            {/* EXPORT DROPDOWN */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-white text-slate-700 shadow-sm border-slate-200">
                        <Download className="w-4 h-4 mr-2" /> Export Filtered
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

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Total Income (Dec)</CardTitle>
                    <Wallet className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">Rs. 500,000</div>
                    <div className="flex items-center text-xs text-emerald-600 mt-1 font-medium">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +12.5% vs Last Month
                    </div>
                </CardContent>
             </Card>
             <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Sanda Collections</CardTitle>
                    <CreditCard className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">Rs. 250,000</div>
                    <div className="flex items-center text-xs text-emerald-600 mt-1 font-medium">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +5% Growth
                    </div>
                </CardContent>
             </Card>
             <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Donations & Zakat</CardTitle>
                    <HandCoins className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">Rs. 250,000</div>
                    <div className="flex items-center text-xs text-slate-400 mt-1">
                        Stable vs Last Month
                    </div>
                </CardContent>
             </Card>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-800">Monthly Revenue Trend</CardTitle>
                    <CardDescription>Comparison of Sanda vs Donations over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '12px' }}
                            />
                            <Bar dataKey="Sanda" stackId="a" fill="#059669" radius={[0, 0, 4, 4]} barSize={32} />
                            <Bar dataKey="Donations" stackId="a" fill="#0284c7" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-800">Income Breakdown</CardTitle>
                    <CardDescription>Distribution of fund sources</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend 
                                verticalAlign="middle" 
                                align="right" 
                                layout="vertical"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '12px', color: '#475569' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        {/* TOOLBAR & LEDGER TABLE */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    
                    {/* FILTER GROUP */}
                    <div className="flex flex-1 items-center gap-3 w-full flex-wrap">
                        
                        {/* 1. Date Range Picker */}
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
                                        <span>Filter by Date</span>
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

                        {/* Reset Date Button */}
                        {dateRange && (
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDateSelect(undefined)} 
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-9"
                            >
                                <X className="w-4 h-4 mr-1" /> Reset Date
                            </Button>
                        )}

                        {/* 2. Text Search */}
                        <div className="relative w-full md:max-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search ref/name..."
                                value={(table.getColumn("reference")?.getFilterValue()) ?? ""}
                                onChange={(event) => table.getColumn("reference")?.setFilterValue(event.target.value)}
                                className="pl-10 bg-slate-50 border-slate-200"
                            />
                        </div>
                        
                        {/* 3. Source Select */}
                        <Select
                            onValueChange={(value) => table.getColumn("source")?.setFilterValue(value === "all" ? undefined : value)}
                        >
                            <SelectTrigger className="w-[150px] bg-slate-50 border-slate-200">
                                <Filter className="w-3 h-3 mr-2 text-slate-500" />
                                <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="Sanda">Sanda</SelectItem>
                                <SelectItem value="Donation">Donations</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* DYNAMIC TOTAL (Updates based on filters) */}
                    <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                        <span className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Filtered Total</span>
                        <span className="font-bold text-emerald-900 text-lg">Rs. {filteredTotal.toLocaleString()}</span>
                    </div>
                </div>

                <DataTable table={table} columns={columns} />
            </CardContent>
        </Card>

      </motion.div>
    </div>
  );
}