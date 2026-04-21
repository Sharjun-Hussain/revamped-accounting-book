"use client";

import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { apiFetcher } from "@/lib/api";
import { motion } from "framer-motion";
import {
  TrendingDown,
  PlusCircle,
  Search,
  ArrowUpDown,
  MoreHorizontal,
  FileText,
  Download,
  Receipt,
  Wallet,
  Lightbulb,
  Wrench,
  Users,
  Calendar as CalendarIcon,
  UploadCloud,
  X,
  Banknote,
  Tag,
  User
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
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table"; 
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {  useRef } from "react";
import {  Loader2 } from "lucide-react";
import { toast } from "sonner"; 
import { exportToCSV } from "@/lib/export-utils"; 
import { accountingService } from "@/services/accountingService";
import { categoryService } from "@/services/categoryService";
import { AccountingSkeleton } from "@/components/accounting/AccountingSkeleton";







import { ExpenseDialog } from "@/components/accounting/expenses/expense-dialog";
import { ExpenseTableToolbar } from "@/components/accounting/expenses/expense-table-toolbar";
import { ExpenseBulkActions } from "@/components/accounting/expenses/expense-bulk-actions";
import { Checkbox } from "@/components/ui/checkbox";

// --- 4. MAIN PAGE ---
export default function ExpensesPage() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  // Data Fetching with SWR
  const { data: expenses = [], isLoading: expensesLoading } = useSWR('/accounting/expenses', apiFetcher);
  const { data: categories = [], isLoading: categoriesLoading } = useSWR('/accounting/categories', apiFetcher);
  const { data: bankAccounts = [], isLoading: bankAccountsLoading } = useSWR('/accounting/bank-accounts', apiFetcher);

  const loading = expensesLoading || categoriesLoading || bankAccountsLoading;
  
  // Edit State
  const [editExpense, setEditExpense] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEdit = (expense) => {
      setEditExpense(expense);
      setIsDialogOpen(true);
  };

  const handleAdd = () => {
      setEditExpense(null);
      setIsDialogOpen(true);
  };

  const refreshData = () => {
    mutate('/accounting/expenses');
    mutate('/accounting/categories');
    mutate('/accounting/bank-accounts');
  };

  const columns = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
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
      accessorKey: "date",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-sm text-slate-600">{format(new Date(row.getValue("date")), "MMM dd, yyyy")}</span>,
      filterFn: (row, id, value) => {
        const rowDate = new Date(row.getValue(id));
        const { from, to } = value;
        if (!from) return true;
        if (!to) return rowDate.getTime() >= from.getTime();
        return rowDate.getTime() >= from.getTime() && rowDate.getTime() <= to.getTime();
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const catName = row.original.category?.name || "Uncategorized";
        const catColor = row.original.category?.color || "slate";
        const colorClass = `text-${catColor}-600 bg-${catColor}-50 border-${catColor}-200`;
        
        return (
          <Badge variant="outline" className={`font-normal ${colorClass} gap-1 pr-2`}>
             {catName}
          </Badge>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-slate-900">{row.original.payee || row.original.description.split(' - ')[0]}</div>
          <div className="text-xs text-slate-500 truncate max-w-[200px]">{row.original.payee ? row.original.description : (row.original.description.split(' - ')[1] || row.original.description)}</div>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <div className="text-right">Amount</div>,
      cell: ({ row }) => <div className="text-right font-bold text-slate-900">Rs. {row.getValue("amount").toLocaleString()}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            Paid
          </Badge>
        );
      },
    },
    {
      accessorKey: "receiptUrl",
      header: "Receipt",
      cell: ({ row }) => (
          row.getValue("receiptUrl") ? (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600" asChild>
                  <a href={row.getValue("receiptUrl")} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-3 h-3" />
                  </a>
              </Button>
          ) : <span className="text-xs text-slate-400 italic">No Doc</span>
      )
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
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>Edit Expense</DropdownMenuItem>
            <DropdownMenuItem>View Receipt</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-rose-600">Delete Record</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [handleEdit]);
  
  const table = useReactTable({
    data: expenses,
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

  const handleExport = () => {

    const csvData = expenses.map(e => ({
        "Date": e.date,
        "Category": e.category?.name,
        "Description": e.description,
        "Amount": e.amount,
    }));
    exportToCSV(csvData, "Expenses_Report.csv");
  };

  // --- HIGHEST CATEGORY LOGIC ---
  const categoryTotals = expenses.reduce((acc, expense) => {
      const catName = expense.category?.name || "Uncategorized";
      acc[catName] = (acc[catName] || 0) + expense.amount;
      return acc;
  }, {});

  let highestCategory = { name: "-", amount: 0 };
  Object.entries(categoryTotals).forEach(([name, amount]) => {
      if (amount > highestCategory.amount) {
          highestCategory = { name, amount };
      }
  });

  if (loading) {
    return <AccountingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
       {/* Background Pattern Overlay (Consistent with Dashboard) */}
       <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <TrendingDown className="h-8 w-8 text-rose-600" />
                    Expenses & Bills
                </h1>
                <p className="text-slate-500">Manage mosque expenditures and operational costs.</p>
            </div>
            
            <div className="flex gap-3">
                 <Button variant="outline" className="bg-white border-slate-200 text-slate-700" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" /> Export Report
                 </Button>
                 <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 gap-2" onClick={handleAdd}>
                    <PlusCircle className="w-4 h-4" /> Add Expense
                 </Button>
                 <ExpenseDialog 
                    open={isDialogOpen} 
                    setOpen={setIsDialogOpen} 
                    onSuccess={refreshData} 
                    categories={categories} 
                    bankAccounts={bankAccounts} 
                    expenseToEdit={editExpense}
                 />
            </div>
        </div>

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Total Expenses (Dec)</CardTitle>
                    <TrendingDown className="h-4 w-4 text-rose-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">Rs. {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</div>
                    <p className="text-xs text-rose-600 mt-1">Total Expenses</p>
                </CardContent>
             </Card>
             <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Highest Category</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{highestCategory.name}</div>
                    <p className="text-xs text-slate-500 mt-1">Rs. {highestCategory.amount.toLocaleString()}</p>
                </CardContent>
             </Card>
             <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Total Transactions</CardTitle>
                    <Receipt className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>

                    <div className="text-2xl font-bold text-slate-900">{expenses.length}</div>
                    <p className="text-xs text-slate-500 mt-1">Total Records</p>
                </CardContent>
             </Card>
        </div>

        {/* TOOLBAR */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4">
                <ExpenseTableToolbar 
                    table={table} 
                    categories={categories} 
                    bulkActionsComponent={<ExpenseBulkActions table={table} onSuccess={refreshData} />}
                />
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