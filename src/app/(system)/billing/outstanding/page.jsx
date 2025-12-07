"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Phone,
  Search,
  ArrowUpDown,
  MoreHorizontal,
  Wallet,
  Download,
  CreditCard,
  UserX,
  FileText
} from "lucide-react";
import { format } from "date-fns";

// UI Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table"; 
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Import Shared PDF Utility
import { exportToPDF, exportToCSV } from "@/lib/export-utils"; 

// --- 1. MOCK DATA ---
const mockArrears = [
  { 
    id: "M-001", 
    name: "Abdul Rahman", 
    phone: "94771234567", 
    arrears: 5000, 
    months_due: 5, 
    last_paid: "2024-07-15",
    status: "Active" 
  },
  { 
    id: "M-003", 
    name: "Yusuf Khan", 
    phone: "94755551234", 
    arrears: 12000, 
    months_due: 12, 
    last_paid: "2023-12-01",
    status: "Active" 
  },
  { 
    id: "M-004", 
    name: "Zaid Ahmed", 
    phone: "94761112222", 
    arrears: 1000, 
    months_due: 1, 
    last_paid: "2024-11-10",
    status: "Active" 
  },
  { 
    id: "M-008", 
    name: "Farook Hameed", 
    phone: "94718889999", 
    arrears: 2500, 
    months_due: 2, 
    last_paid: "2024-10-05",
    status: "Moved" 
  },
];

// --- 2. ACTION HANDLERS ---

// A. WhatsApp Reminder
const sendWhatsApp = (member) => {
  const message = `Assalamu Alaikum ${member.name}. This is a gentle reminder from Al-Manar Mosque regarding outstanding Sanda dues of Rs. ${member.arrears.toLocaleString()}. Please arrange to settle at your earliest convenience. Jazakallah Khair.`;
  const url = `https://wa.me/${member.phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

// B. Print Individual Statement
const printStatement = (member) => {
  // 1. Generate Dummy Breakdown for the PDF
  const breakdownData = Array.from({ length: member.months_due }, (_, i) => ({
    month: format(new Date(2024, 11 - i, 1), "MMMM yyyy"), // Mock months going back
    amount: (member.arrears / member.months_due).toLocaleString(),
    status: "Unpaid"
  }));

  const columns = [
    { header: "Month", dataKey: "month" },
    { header: "Status", dataKey: "status" },
    { header: "Amount Due (LKR)", dataKey: "amount" },
  ];

  // 2. Use our PDF Utility
  // We append a summary row for the PDF
  breakdownData.push({ month: "TOTAL OUTSTANDING", amount: member.arrears.toLocaleString(), status: "" });

  exportToPDF(
    columns, 
    breakdownData, 
    `Statement of Accounts - ${member.name} (${member.id})`, 
    `Statement_${member.id}.pdf`
  );
};

// --- 3. COLUMNS DEFINITION ---
const columns = [
  {
    accessorKey: "name",
    header: "Member Details",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border border-slate-200">
          <AvatarFallback className={row.original.months_due > 6 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}>
            {row.original.name.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-slate-900">{row.original.name}</div>
          <div className="text-xs text-slate-500">{row.original.id} • {row.original.phone}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "arrears",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Arrears Amount <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-bold text-rose-600">Rs. {row.getValue("arrears").toLocaleString()}</div>
    ),
  },
  {
    accessorKey: "months_due",
    header: "Pending Duration",
    cell: ({ row }) => {
        const count = row.getValue("months_due");
        return (
            <Badge variant="outline" className={
                count >= 6 ? "bg-rose-50 text-rose-700 border-rose-200" :
                count >= 3 ? "bg-amber-50 text-amber-700 border-amber-200" :
                "bg-slate-50 text-slate-700 border-slate-200"
            }>
                {count} Months
            </Badge>
        )
    }
  },
  {
    accessorKey: "last_paid",
    header: "Last Payment",
    cell: ({ row }) => <span className="text-sm text-slate-500">{row.getValue("last_paid")}</span>,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
         {/* WhatsApp Button (Quick Action) */}
         <Button 
            size="icon" variant="ghost" 
            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={() => sendWhatsApp(row.original)}
            title="Send WhatsApp Reminder"
         >
            <Phone className="h-4 w-4" />
         </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Recovery Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => printStatement(row.original)}>
                <FileText className="w-4 h-4 mr-2" /> Print Statement
            </DropdownMenuItem>
             <DropdownMenuItem>
                <CreditCard className="w-4 h-4 mr-2" /> Collect Payment
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-slate-500">
                <UserX className="w-4 h-4 mr-2" /> Mark as Bad Debt
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

export default function ArrearsPage() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  
  const table = useReactTable({
    data: mockArrears,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  });

  // Export Full List
  const handleExportList = () => {
    exportToCSV(mockArrears, "arrears_list.csv");
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <AlertCircle className="h-8 w-8 text-rose-600" />
                    Outstanding Arrears
                </h1>
                <p className="text-slate-500">Manage overdue payments and recover member dues.</p>
            </div>
            
            <div className="flex gap-2">
                 <Button variant="outline" className="bg-white" onClick={handleExportList}>
                    <Download className="w-4 h-4 mr-2" /> Export List
                 </Button>
            </div>
        </div>

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Total Outstanding</CardTitle>
                    <Wallet className="h-4 w-4 text-rose-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">Rs. 20,500</div>
                    <p className="text-xs text-rose-600 mt-1">Across 4 members</p>
                </CardContent>
             </Card>
             <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Critical ({">"} 6 Months)</CardTitle>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">1 Member</div>
                    <p className="text-xs text-slate-500 mt-1">Needs immediate attention</p>
                </CardContent>
             </Card>
        </div>

        {/* TOOLBAR */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search member name..."
                            value={(table.getColumn("name")?.getFilterValue()) ?? ""}
                            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                            className="pl-10 bg-slate-50 border-slate-200"
                        />
                    </div>
                    
                    <Select
                        onValueChange={() => {
                             // Simple reset for this example
                             table.resetColumnFilters(); 
                        }}
                    >
                        <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Filter Risk Level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="high">High Risk ({">"}6 Months)</SelectItem>
                            <SelectItem value="medium">Medium (3-6 Months)</SelectItem>
                        </SelectContent>
                    </Select>
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