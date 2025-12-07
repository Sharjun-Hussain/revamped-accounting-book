"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Printer,
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  CalendarDays,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
} from "@/components/ui/dropdown-menu";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table"; 

// --- 1. CONFIGURATION ---
const MOSQUE_DETAILS = {
  name: "Al-Manar Grand Mosque",
  address: "123 Main Street, Kandy",
  contact: "+94 77 123 4567"
};

// --- 2. UPDATED MOCK DATA (New Naming Convention) ---
const mockInvoices = [
  { 
    id: "BILL-ABDUL-001", // New Format
    member_id: "M-001", 
    name: "Abdul Rahman", 
    amount: 1000, 
    arrears: 2000, 
    status: "Unpaid", 
    due_date: "2025-12-10" 
  },
  { 
    id: "BILL-FAZIL-002", 
    member_id: "M-002", 
    name: "Mohamed Fazil", 
    amount: 2000, 
    arrears: 0, 
    status: "Unpaid", 
    due_date: "2025-12-10" 
  },
  { 
    id: "BILL-YUSUF-003", 
    member_id: "M-003", 
    name: "Yusuf Khan", 
    amount: 1500, 
    arrears: 0, 
    status: "Paid", 
    due_date: "2025-12-10" 
  },
  { 
    id: "BILL-ZAID-004", 
    member_id: "M-004", 
    name: "Zaid Ahmed", 
    amount: 1000, 
    arrears: 500, 
    status: "Overdue", 
    due_date: "2025-11-10" 
  },
  { 
    id: "BILL-FATHIMA-005", 
    member_id: "M-005", 
    name: "Fathima R.", 
    amount: 1000, 
    arrears: 0, 
    status: "Unpaid", 
    due_date: "2025-12-10" 
  },
];

// --- 3. REUSABLE HEADER COMPONENT ---
const DataTableColumnHeader = ({ column, title, className }) => {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`-ml-3 h-8 data-[state=open]:bg-accent ${className}`}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span>{title}</span>
      {column.getIsSorted() === "desc" ? (
        <ArrowUpDown className="ml-2 h-3 w-3 rotate-180" />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUpDown className="ml-2 h-3 w-3" />
      ) : (
        <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
      )}
    </Button>
  )
}

// --- 4. DATA TABLE COLUMNS (Redesigned Headers) ---
const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bill Reference" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
        {row.getValue("id")}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Member Details" />,
    cell: ({ row }) => (
        <div>
            <div className="font-medium text-slate-900">{row.original.name}</div>
            <div className="text-xs text-emerald-600 font-mono">{row.original.member_id}</div>
        </div>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Current Fee" className="justify-end w-full" />,
    cell: ({ row }) => <div className="text-right font-medium">Rs. {row.getValue("amount")}</div>,
  },
  {
    accessorKey: "arrears",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Arrears" className="justify-end w-full" />,
    cell: ({ row }) => {
        const amt = parseFloat(row.getValue("arrears"));
        return <div className={`text-right font-medium ${amt > 0 ? "text-rose-600" : "text-slate-400"}`}>
            {amt > 0 ? `Rs. ${amt}` : "-"}
        </div>
    },
  },
  {
    id: "total",
    header: () => <div className="text-right font-semibold text-slate-900">Total Due</div>,
    cell: ({ row }) => {
        const total = row.original.amount + row.original.arrears;
        return <div className="text-right font-bold text-slate-900">Rs. {total}</div>
    }
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" className="justify-center w-full" />,
    cell: ({ row }) => {
      const status = row.getValue("status");
      return (
        <div className="flex justify-center">
            <Badge variant="outline" className={
                status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                status === "Overdue" ? "bg-rose-50 text-rose-700 border-rose-200" :
                "bg-slate-50 text-slate-700 border-slate-200"
            }>
            {status}
            </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View Invoice</DropdownMenuItem>
          <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

// --- 5. THERMAL PRINT TEMPLATE (Using Bill-Name Format) ---
const BatchPrintTemplate = ({ invoices, month }) => {
  if (!invoices || invoices.length === 0) return null;

  return (
    <div id="batch-print-container" className="hidden print:block text-black font-mono text-sm leading-tight">
      <style jsx global>{`
        @media print {
          @page { margin: 0mm; size: auto; }
          body { margin: 0mm; }
          body * { visibility: hidden; }
          #batch-print-container, #batch-print-container * { visibility: visible; }
          #batch-print-container { 
            position: absolute; left: 0; top: 0; width: 80mm;
          }
          .invoice-page { 
            page-break-after: always; padding: 15px; min-height: 100px; border-bottom: 1px dashed #ccc;
          }
        }
      `}</style>

      {invoices.map((inv) => (
        <div key={inv.id} className="invoice-page">
            <div className="text-center mb-4">
                <h1 className="font-bold text-lg uppercase">{MOSQUE_DETAILS.name}</h1>
                <p className="text-[10px] uppercase">Monthly Subscription</p>
                <div className="font-bold text-md mt-1">{month}</div>
            </div>

            <div className="my-4 border-b border-dashed border-black pb-2">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-md">{inv.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>Ref:</span>
                    <span className="font-bold">{inv.id}</span>
                </div>
            </div>

            <div className="my-2">
                <div className="flex justify-between mb-1">
                    <span>Fee:</span>
                    <span>{inv.amount.toLocaleString()}</span>
                </div>
                {inv.arrears > 0 && (
                     <div className="flex justify-between mb-1 font-bold">
                        <span>Arrears:</span>
                        <span>{inv.arrears.toLocaleString()}</span>
                    </div>
                )}
            </div>

            <div className="border-t-2 border-black border-b-2 py-2 my-4">
                <div className="flex justify-between items-center font-bold text-lg">
                    <span>TOTAL:</span>
                    <span>Rs. {(inv.amount + inv.arrears).toLocaleString()}</span>
                </div>
            </div>

            <div className="text-center text-[10px] mt-6">
                <p>Please pay using Ref: <span className="font-bold">{inv.id}</span></p>
            </div>
            
             <div className="text-center text-[8px] mt-4 opacity-50">
                - - - - - cut here - - - - -
            </div>
        </div>
      ))}
    </div>
  );
};

export default function MonthlyInvoicesPage() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [currentMonth, setCurrentMonth] = useState("December 2025");
  const [printingInvoices, setPrintingInvoices] = useState([]);

  const table = useReactTable({
    data: mockInvoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, rowSelection },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const totalSelectedAmount = selectedRows.reduce((sum, row) => sum + (row.original.amount + row.original.arrears), 0);

  const handlePrint = () => {
    const dataToPrint = selectedRows.map(r => r.original);
    setPrintingInvoices(dataToPrint);
    setTimeout(() => window.print(), 200);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>

      <BatchPrintTemplate invoices={printingInvoices} month={currentMonth} />

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto"
      >
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <FileText className="h-8 w-8 text-emerald-600" />
                    Monthly Invoicing
                </h1>
                <p className="text-slate-500">Generate and print bill requests for Sanda collection.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                 <Select value={currentMonth} onValueChange={setCurrentMonth}>
                    <SelectTrigger className="w-[180px] border-none shadow-none focus:ring-0">
                        <CalendarDays className="w-4 h-4 mr-2 text-emerald-600" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="December 2025">December 2025</SelectItem>
                        <SelectItem value="November 2025">November 2025</SelectItem>
                        <SelectItem value="October 2025">October 2025</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* TOOLBAR */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex flex-1 items-center gap-3 w-full">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name..."
                                value={table.getColumn("name")?.getFilterValue() ?? ""}
                                onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                                className="pl-10 bg-slate-50 border-slate-200"
                            />
                        </div>
                        <Select
                            value={table.getColumn("status")?.getFilterValue() ?? ""}
                            onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)}
                        >
                            <SelectTrigger className="w-[150px] bg-slate-50 border-slate-200">
                                <Filter className="w-3 h-3 mr-2 text-slate-500" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Unpaid">Unpaid</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Overdue">Overdue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        {selectedRows.length > 0 && (
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Expected</span>
                                <span className="font-bold text-slate-900">Rs. {totalSelectedAmount.toLocaleString()}</span>
                            </div>
                        )}
                        
                        <Button 
                            onClick={handlePrint}
                            disabled={selectedRows.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 gap-2 min-w-[140px]"
                        >
                            <Printer className="w-4 h-4" />
                            {selectedRows.length > 0 ? `Print (${selectedRows.length})` : "Print Selected"}
                        </Button>
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