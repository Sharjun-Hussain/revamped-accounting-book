"use client";

import { useState } from "react";
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
// Make sure to install axios: npm install axios
import axios from "axios"; 

import { 


  




    Loader2 
} from "lucide-react";
import { toast } from "sonner"; // Assuming you use sonner for toasts

// Import Shared PDF Utility
import { exportToCSV } from "@/lib/export-utils"; 

import { accountingService } from "@/services/accountingService";
import { categoryService } from "@/services/categoryService";
import { AccountingSkeleton } from "@/components/accounting/AccountingSkeleton";

// --- 1. MOCK DATA REMOVED ---

// --- 2. COLUMNS ---
const columns = [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Date <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm text-slate-600">{format(new Date(row.getValue("date")), "MMM dd, yyyy")}</span>,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const catName = row.original.category?.name || "Uncategorized";
      const catColor = row.original.category?.color || "slate";
      // Simple mapping for demo, ideally color comes from DB
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
        <div className="font-medium text-slate-900">{row.original.description.split(' - ')[0]}</div>
        <div className="text-xs text-slate-500 truncate max-w-[200px]">{row.original.description.split(' - ')[1] || row.original.description}</div>
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
    accessorKey: "receipt",
    header: "Receipt",
    cell: ({ row }) => (
        row.getValue("receipt") ? (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600">
                <FileText className="w-3 h-3" />
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
          <DropdownMenuItem>Edit Expense</DropdownMenuItem>
          <DropdownMenuItem>View Receipt</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-rose-600">Delete Record</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];





const AddExpenseDialog = ({ onSuccess, categories, bankAccounts }) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- Form State ---
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    category: "",
    payee: "",
    description: "",
    bankAccountId: ""
  });
  
  // --- File State ---
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Handle Text Inputs
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // Handle Select Input
  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  // --- File Upload Logic ---
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB Limit
        toast.error("File is too large. Max 5MB allowed.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = (e) => {
    e.stopPropagation(); // Prevent opening file dialog
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // --- API SUBMISSION LOGIC ---
  const handleSave = async () => {
    // 1. Basic Validation
    if (!formData.amount || !formData.payee || !formData.category) {
        toast.error("Please fill in Amount, Payee and Category");
        return;
    }

    setIsSubmitting(true);

    try {
        await accountingService.createExpense({
            amount: formData.amount,
            date: formData.date,
            categoryId: formData.category,
            payee: formData.payee,
            description: formData.description,
            bankAccountId: formData.bankAccountId
        });

        toast.success("Expense Saved");
        setOpen(false);
        setIsSubmitting(false);
        // Reset Form
        setFormData({ amount: "", date: new Date().toISOString().split('T')[0], category: "", payee: "", description: "", bankAccountId: "" });
        setSelectedFile(null);
        if (onSuccess) onSuccess();

    } catch (error) {
        console.error("Upload Error:", error);
        toast.error("Failed to save expense. Please try again.");
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 gap-2">
            <PlusCircle className="w-4 h-4" /> Add Expense
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white">
          <DialogTitle className="flex items-center gap-2 text-xl">
             <div className="p-2 bg-emerald-100 rounded-lg">
                <Receipt className="w-5 h-5 text-emerald-600" />
             </div>
             Record New Expense
          </DialogTitle>
          <DialogDescription>
            Enter the payment details below.
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh]">
            <div className="grid gap-6">
                
                {/* Row 1: Amount & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-slate-600 flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5" /> Amount (LKR) *
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs.</span>
                            <Input 
                                id="amount"
                                type="number" 
                                value={formData.amount}
                                onChange={handleInputChange}
                                className="pl-10 h-11 font-bold text-lg bg-slate-50 border-slate-200 focus:bg-white transition-colors" 
                                placeholder="0.00" 
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-slate-600 flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5" /> Date
                        </Label>
                        <Input 
                            id="date"
                            type="date" 
                            value={formData.date}
                            onChange={handleInputChange}
                            className="h-11 bg-slate-50 border-slate-200" 
                        />
                    </div>
                </div>

                {/* Row 2: Category & Payee */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-slate-600 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Category
                        </Label>
                        <Select value={formData.category} onValueChange={handleCategoryChange}>
                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>

                                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="payee" className="text-slate-600 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Payee / Vendor *
                        </Label>
                        <Input 
                            id="payee"
                            value={formData.payee}
                            onChange={handleInputChange}
                            placeholder="e.g. CEB, Hardware Shop" 
                            className="h-11 bg-slate-50 border-slate-200" 
                        />
                    </div>
                </div>

                {/* Row 3: Paid From (Bank/Cash) */}
                <div className="space-y-2">
                    <Label className="text-slate-600 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5" /> Paid From (Optional)
                    </Label>
                    <Select value={formData.bankAccountId} onValueChange={(val) => setFormData(prev => ({ ...prev, bankAccountId: val }))}>
                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Select Account (e.g. Petty Cash)" />
                        </SelectTrigger>
                        <SelectContent>
                            {bankAccounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>
                                    {acc.bankName} - {acc.accountName} ({acc.type}) - Rs. {acc.balance.toLocaleString()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-400">Select an account to automatically deduct this amount.</p>
                </div>

                {/* Row 3: Description */}
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-600">Description</Label>
                    <Textarea 
                        id="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Additional details about this expense..." 
                        className="min-h-[80px] bg-slate-50 border-slate-200 resize-none" 
                    />
                </div>

                {/* Row 4: File Upload (WORKABLE) */}
                <div className="space-y-2">
                    <Label className="text-slate-600">Attach Receipt / Invoice</Label>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                        className="hidden" 
                    />

                    {!selectedFile ? (
                        <div 
                            onClick={triggerFileInput}
                            className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-emerald-200 hover:text-emerald-500 transition-all cursor-pointer group"
                        >
                            <div className="p-3 bg-slate-50 rounded-full mb-2 group-hover:bg-emerald-50 transition-colors">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium">Click to upload or drag and drop</span>
                            <span className="text-[10px] opacity-70 mt-1">PDF, JPG, PNG (Max 5MB)</span>
                        </div>
                    ) : (
                        <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-emerald-100 text-emerald-600">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-emerald-900 truncate max-w-[200px]">
                                        {selectedFile.name}
                                    </span>
                                    <span className="text-[10px] text-emerald-600">
                                        {(selectedFile.size / 1024).toFixed(2)} KB
                                    </span>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={removeFile}
                                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50 sm:justify-between items-center">
            <div className="text-xs text-slate-400 hidden sm:block">
                Fields marked with * are required
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 sm:flex-none">Cancel</Button>
                <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none min-w-[120px]" 
                    onClick={handleSave}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                        </>
                    ) : (
                        "Save Expense"
                    )}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- 4. MAIN PAGE ---
export default function ExpensesPage() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
        setLoading(true);
        const [expensesData, categoriesData, accountsData] = await Promise.all([
            accountingService.getExpenses(),
            categoryService.getAll(),
            accountingService.getBankAccounts()
        ]);
        setExpenses(expensesData);
        setCategories(categoriesData);
        setBankAccounts(accountsData);
    } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load expenses");
    } finally {
        setLoading(false);
    }
  };

  useState(() => {
    fetchData();
  }, []);
  
  const table = useReactTable({
    data: expenses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
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

  if (loading) {
    return <AccountingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
      
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
                 <AddExpenseDialog onSuccess={fetchData} categories={categories} bankAccounts={bankAccounts} />
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

                    <div className="text-2xl font-bold text-slate-900">-</div>
                    <p className="text-xs text-slate-500 mt-1">Analytics coming soon</p>
                </CardContent>
             </Card>
             <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Pending Bills</CardTitle>
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
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search payee or description..."
                            value={(table.getColumn("description")?.getFilterValue()) ?? ""}
                            onChange={(event) => table.getColumn("description")?.setFilterValue(event.target.value)}
                            className="pl-10 bg-slate-50 border-slate-200"
                        />
                    </div>
                    
                    <Select
                        onValueChange={(value) => table.getColumn("category")?.setFilterValue(value === "all" ? undefined : value)}
                    >
                        <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>

                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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