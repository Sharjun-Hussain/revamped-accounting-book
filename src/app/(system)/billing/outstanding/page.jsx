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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

import { accountingService } from "@/services/accountingService";
import { toast } from "sonner";

import { BillingSkeleton } from "@/components/billing/BillingSkeleton";

// --- MOCK DATA REMOVED ---

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
        const details = row.original.details || [];
        
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Badge variant="outline" className={`cursor-pointer hover:bg-slate-100 ${
                        count >= 6 ? "bg-rose-50 text-rose-700 border-rose-200" :
                        count >= 3 ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                    }`}>
                        {count} Months
                    </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-900 border-b pb-1 mb-2">Unpaid Months</h4>
                        {details.length > 0 ? (
                            <div className="max-h-[200px] overflow-y-auto space-y-1">
                                {details.map((inv, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="text-slate-600">{inv.period}</span>
                                        <span className="font-mono font-medium text-rose-600">Rs. {inv.balance.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500">No details available</p>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
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
  const [arrearsData, setArrearsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArrears = async () => {
    try {
        setLoading(true);
        const data = await accountingService.getOutstandingArrears();
        setArrearsData(data);
    } catch (error) {
        console.error("Error fetching arrears:", error);
        toast.error("Failed to load outstanding arrears");
    } finally {
        setLoading(false);
    }
  };

  useState(() => {
    fetchArrears();
  }, []);
  
  const table = useReactTable({
    data: arrearsData,
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
    // Flatten data for CSV
    const exportData = arrearsData.map(m => {
        const months = m.details ? m.details.map(d => `${d.period} (${d.balance})`).join("; ") : "";
        return {
            "Member ID": m.id,
            "Name": m.name,
            "Phone": m.phone,
            "Total Arrears": m.arrears,
            "Months Count": m.months_due,
            "Unpaid Months Details": months,
            "Status": m.status
        };
    });
    exportToCSV(exportData, "arrears_list_detailed.csv");
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
                    <div className="text-2xl font-bold text-slate-900">Rs. {arrearsData.reduce((sum, m) => sum + m.arrears, 0).toLocaleString()}</div>
                    <p className="text-xs text-rose-600 mt-1">Across {arrearsData.length} members</p>
                </CardContent>
             </Card>
             <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Critical ({">"} 6 Months)</CardTitle>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{arrearsData.filter(m => m.months_due > 6).length} Members</div>
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