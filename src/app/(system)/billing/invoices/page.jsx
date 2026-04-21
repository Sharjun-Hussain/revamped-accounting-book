"use client";

import { useState, useMemo, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { apiFetcher } from "@/lib/api";
import {
  Printer,
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Loader2
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

import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { accountingService } from "@/services/accountingService";

import { BillingSkeleton } from "@/components/billing/BillingSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

// --- 1. CONFIGURATION ---
const MOSQUE_DETAILS = {
  name: "Al-Manar Grand Mosque",
  address: "123 Main Street, Kandy",
  contact: "+94 77 123 4567"
};

// --- 2. MOCK DATA REMOVED ---

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
      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
        {row.getValue("id")}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Member Details" />,
    cell: ({ row }) => (
      <div className="flex flex-col leading-tight py-0.5">
        <div className="font-semibold text-slate-900 text-sm">{row.original.name}</div>
        <div className="text-[10px] text-emerald-600 font-mono font-bold tracking-tighter">{row.original.member_id}</div>
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fee" className="justify-end w-full" />,
    cell: ({ row }) => <div className="text-right font-medium">Rs. {row.getValue("amount")}</div>,
  },
  {
    accessorKey: "paidAmount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Paid" className="justify-end w-full" />,
    cell: ({ row }) => <div className="text-right font-medium text-emerald-600">Rs. {row.getValue("paidAmount")}</div>,
  },
  {
    accessorKey: "balance",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Balance" className="justify-end w-full" />,
    cell: ({ row }) => {
      const bal = parseFloat(row.getValue("balance"));
      return <div className={`text-right font-bold ${bal > 0 ? "text-rose-600" : "text-slate-400"}`}>
        {bal > 0 ? `Rs. ${bal}` : "-"}
      </div>
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" className="justify-center w-full" />,
    cell: ({ row }) => {
      const status = row.getValue("status");
      return (
        <div className="flex justify-center">
          <Badge variant="outline" className={cn(
            "h-5 px-1.5 text-[10px] font-bold uppercase",
            status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              status === "overdue" ? "bg-rose-50 text-rose-700 border-rose-200" :
                status === "partial" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-slate-50 text-slate-700 border-slate-200"
          )}>
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
          <Link href={`/billing/invoices/${row.original.id}`}>
            <DropdownMenuItem>View Invoice</DropdownMenuItem>
          </Link>
          <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

// --- 5. PREMIUM HIGH-FIDELITY PRINT TEMPLATE ---
const BatchPrintTemplate = ({ invoices, month }) => {
  if (!invoices || invoices.length === 0) return null;

  return (
    <div id="batch-print-container" className="hidden print:block font-ubuntu antialiased">
      <style jsx global>{`
        @media print {
          @page { 
            margin: 0mm; 
            size: auto; 
          }
          /* CRITICAL: Un-lock the height of the entire layout chain for printing */
          html, body, #__next, 
          div[class*="min-h-screen"], 
          [data-sidebar-provider], 
          [data-sidebar-inset],
          .flex-1 {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            zoom: 100% !important;
          }
          body { 
            margin: 0mm;
            padding: 0mm;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { 
            display: none !important; 
          }
          #batch-print-container { 
            display: block !important;
            width: 100%;
          }
          .receipt-page { 
            page-break-after: always;
            break-after: page;
            padding: 40px;
            background: white;
            color: #0f172a;
            max-width: 100mm;
            margin: 0 auto;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2px solid #10b981;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .mosque-name {
            font-size: 20px;
            font-weight: 800;
            color: #065f46;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .receipt-title {
            font-size: 11px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 12px;
          }
          .info-label {
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
          }
          .info-value {
            font-weight: 700;
            color: #1e293b;
          }
          .charges-table {
            width: 100%;
            margin: 25px 0;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
          }
          .charge-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 13px;
          }
          .charge-label {
            color: #475569;
          }
          .charge-amount {
            font-weight: 600;
          }
          .paid-amount {
            color: #10b981;
            font-weight: 700;
          }
          .balance-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
          }
          .balance-label {
            display: flex;
            flex-direction: column;
          }
          .total-txt {
            font-size: 10px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
          }
          .due-txt {
            font-size: 14px;
            font-weight: 600;
          }
          .balance-amount {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
          }
          .receipt-footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
          }
          .barcode-stub {
            margin-top: 15px;
            height: 1px;
            border-bottom: 1px dashed #cbd5e1;
            width: 100%;
          }
        }
      `}</style>

      {invoices.map((inv) => (
        <div key={inv.id} className="receipt-page">
          <div className="receipt-header">
            <div className="flex justify-center mb-4">
               <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <FileText className="w-6 h-6" />
               </div>
            </div>
            <div className="mosque-name">{MOSQUE_DETAILS.name}</div>
            <div className="receipt-title">Official Billing Statement</div>
          </div>

          <div className="space-y-4">
            <div className="info-row">
              <span className="info-label">Member Details</span>
              <div className="text-right">
                <div className="info-value text-base">{inv.name}</div>
                <div className="text-[10px] font-bold text-emerald-600">{inv.member_id}</div>
              </div>
            </div>
            
            <div className="flex gap-8">
                <div className="flex-1">
                    <span className="info-label">Billing Period</span>
                    <div className="info-value">{month}</div>
                </div>
                <div className="flex-1 text-right">
                    <span className="info-label">Invoice Ref</span>
                    <div className="info-value">{inv.id}</div>
                </div>
            </div>
          </div>

          <div className="charges-table">
            <div className="charge-item">
              <span className="charge-label">Subscription Fee (Monthly)</span>
              <span className="charge-amount">Rs. {inv.amount.toLocaleString()}</span>
            </div>
            <div className="charge-item">
              <span className="charge-label">Total Amount Paid</span>
              <span className="paid-amount text-emerald-600">- Rs. {inv.paidAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="balance-box">
            <div className="balance-label">
              <span className="total-txt">Balance Remaining</span>
              <span className="due-txt">Sub Total</span>
            </div>
            <div className="balance-amount">
                Rs. {inv.balance.toLocaleString()}
            </div>
          </div>

          <div className="receipt-footer">
            <p className="font-bold text-slate-500 mb-2 underline decoration-emerald-200 decoration-2 underline-offset-4">
                Thank you for your sincere contribution
            </p>
            <p>This is a computer-generated receipt. No signature required.</p>
            <div className="barcode-stub my-4" />
            <p className="tracking-widest uppercase font-bold text-[8px] opacity-60">
                Processed via IVTC Campus Dashboard
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function MonthlyInvoicesPage() {
  // --- STATES ---
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "yyyy-MM")); // Default to current month
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [printingInvoices, setPrintingInvoices] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Memoized month options for the selector
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const date = new Date();
      date.setDate(1); // Set to 1st to avoid month-skipping bugs on 31st
      date.setMonth(date.getMonth() - i);
      return {
        value: format(date, "yyyy-MM"),
        label: format(date, "MMMM yyyy")
      };
    });
  }, []);

  // Data Fetching with SWR
  const { data: invoices = [], isLoading: loading, isValidating } = useSWR(
    `/billing/invoices?period=${currentMonth}`,
    apiFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  const refreshInvoices = useCallback(() => {
    mutate(`/billing/invoices?period=${currentMonth}`);
  }, [currentMonth]);

  // Generate Sanda
  const handleGenerateSanda = async () => {
    setIsGenerating(true);
    try {
      const result = await accountingService.generateSanda(currentMonth);
      toast.success(`Generation Complete: ${result.results.generated} created, ${result.results.skipped} skipped.`);
      refreshInvoices(); // Refresh list
    } catch (error) {
      console.error("Error generating sanda:", error);
      toast.error("Failed to generate invoices");
    } finally {
      setIsGenerating(false);
    }
  };

  // Memoize Table Config to prevent infinite loops
  const table = useReactTable({
    data: invoices,
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
  const totalSelectedAmount = selectedRows.reduce((sum, row) => sum + row.original.balance, 0);

  const handlePrint = () => {
    const dataToPrint = selectedRows.map(r => r.original);
    setPrintingInvoices(dataToPrint);
    // Increase timeout to 300ms for high-precision rendering
    setTimeout(() => window.print(), 300);
  };

  // (No early return for loading to keep selector mounted)

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="no-print fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>

      <BatchPrintTemplate invoices={printingInvoices} month={currentMonth} />

      <div className="no-print flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <div className="bg-emerald-100 p-2 rounded-xl">
                <FileText className="h-7 w-7 text-emerald-700" />
              </div>
              Monthly Invoicing
            </h1>
            <p className="text-slate-500">Manage monthly sanda requests and batch printing.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <Select value={currentMonth} onValueChange={setCurrentMonth}>
              <SelectTrigger className="w-[180px] h-10 border-slate-200 focus:ring-emerald-500 bg-slate-50 shadow-none">
                <CalendarDays className="w-4 h-4 mr-2 text-emerald-600" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <Button
              variant="outline"
              onClick={handleGenerateSanda}
              disabled={isGenerating || (!loading && invoices.length > 0)}
              className="h-10 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 transition-all font-medium disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              {invoices.length > 0 ? "Generated for this Month" : "Generate Invoices"}
            </Button>

            <Button
              onClick={handlePrint}
              disabled={selectedRows.length === 0}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 gap-2 font-medium"
            >
              <Printer className="w-4 h-4" />
              {selectedRows.length > 0 ? `Print (${selectedRows.length})` : "Print Selected"}
            </Button>
          </div>
        </div>

        {/* TOOLBAR & DATA TABLE */}
        <div className={cn("space-y-6 transition-opacity duration-200", isValidating && invoices.length > 0 ? "opacity-70 pointer-events-none" : "opacity-100")}>
          {loading && invoices.length === 0 ? (
            <div className="space-y-6">
              <Card className="rounded-xl border-slate-200 shadow-sm bg-white p-4">
                <div className="flex justify-between items-center gap-4">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </Card>
              <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden p-0">
                <div className="p-4 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            </div>
          ) : (
            <>
              <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex flex-1 items-center gap-3 w-full">
                      <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search by name..."
                          value={table.getColumn("name")?.getFilterValue() ?? ""}
                          onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                          className="pl-10 h-10 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500"
                        />
                      </div>
                      <Select
                        value={table.getColumn("status")?.getFilterValue() ?? ""}
                        onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)}
                      >
                        <SelectTrigger className="w-[140px] h-10 bg-slate-50 border-slate-200 focus:ring-emerald-500">
                          <Filter className="w-3 h-3 mr-2 text-slate-500" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent dropDownAlign="end">
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedRows.length > 0 && (
                      <div className="flex items-center gap-3 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-right-2">
                        <div className="flex flex-col items-start leading-tight">
                          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Total Expected</span>
                          <span className="font-bold text-emerald-900 text-lg">Rs. {totalSelectedAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
                <DataTable table={table} columns={columns} dense={true} />
              </Card>
            </>
          )}
        </div>

      </div>
    </div>
  );
}