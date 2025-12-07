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

// --- 1. MOCK DATA & CONFIG ---
const mockExpenses = [
  { id: "EXP-001", date: "2025-12-05", category: "Utilities", payee: "CEB (Electricity)", description: "Mosque Main Hall - Nov Bill", amount: 12500, status: "Paid", receipt: true },
  { id: "EXP-002", date: "2025-12-01", category: "Salaries", payee: "Imam & Staff", description: "Monthly Staff Payroll", amount: 85000, status: "Paid", receipt: true },
  { id: "EXP-003", date: "2025-12-04", category: "Maintenance", payee: "Hardware Store", description: "Plumbing repairs for Wudu area", amount: 4500, status: "Pending", receipt: false },
  { id: "EXP-004", date: "2025-12-02", category: "Events", payee: "Catering Service", description: "Friday Community Lunch", amount: 15000, status: "Paid", receipt: true },
];

const categories = [
  { id: "Utilities", label: "Utilities", icon: Lightbulb, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "Salaries", label: "Salaries", icon: Users, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "Maintenance", label: "Maintenance", icon: Wrench, color: "text-slate-600 bg-slate-50 border-slate-200" },
  { id: "Events", label: "Events", icon: CalendarIcon, color: "text-purple-600 bg-purple-50 border-purple-200" },
];

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
      const cat = categories.find(c => c.id === row.getValue("category")) || categories[2];
      const Icon = cat.icon;
      return (
        <Badge variant="outline" className={`font-normal ${cat.color} gap-1 pr-2`}>
          <Icon className="w-3 h-3" /> {row.getValue("category")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-slate-900">{row.original.payee}</div>
        <div className="text-xs text-slate-500 truncate max-w-[200px]">{row.getValue("description")}</div>
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
      const s = row.getValue("status");
      return (
        <Badge variant="secondary" className={s === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
          {s}
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





const AddExpenseDialog = () => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- Form State ---
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    category: "Utilities",
    payee: "",
    description: ""
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
    if (!formData.amount || !formData.payee) {
        toast.error("Please fill in Amount and Payee");
        return;
    }

    setIsSubmitting(true);

    try {
        // 2. Prepare FormData (Required for File Uploads)
        const dataToSend = new FormData();
        dataToSend.append("amount", formData.amount);
        dataToSend.append("date", formData.date);
        dataToSend.append("category", formData.category);
        dataToSend.append("payee", formData.payee);
        dataToSend.append("description", formData.description);
        
        // Only append file if one exists
        if (selectedFile) {
            dataToSend.append("receipt_file", selectedFile);
        }

        // 3. --- AXIOS REQUEST SECTION (COMMENTED OUT) ---
        /*
        const response = await axios.post('http://your-backend-api.com/api/expenses', dataToSend, {
            headers: {
                'Content-Type': 'multipart/form-data', // Important for files
                'Authorization': `Bearer ${userToken}`, // If using auth
            },
        });

        if (response.status === 200 || response.status === 201) {
            toast.success("Expense recorded successfully!");
            setOpen(false);
            // Optionally trigger a refresh of the main table here
            // refreshData(); 
        }
        */

        // --- SIMULATED SUCCESS FOR UI DEMO ---
        console.log("FormData Contents:");
        for (let pair of dataToSend.entries()) {
            console.log(pair[0] + ', ' + pair[1]); 
        }
        
        setTimeout(() => {
            toast.success("Expense Saved (Simulated)");
            setOpen(false);
            setIsSubmitting(false);
            // Reset Form
            setFormData({ amount: "", date: new Date().toISOString().split('T')[0], category: "Utilities", payee: "", description: "" });
            setSelectedFile(null);
        }, 1500);

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
                                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
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
  
  const table = useReactTable({
    data: mockExpenses,
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
    const csvData = mockExpenses.map(e => ({
        "Date": e.date,
        "Category": e.category,
        "Payee": e.payee,
        "Amount": e.amount,
        "Status": e.status
    }));
    exportToCSV(csvData, "Expenses_Report.csv");
  };

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
                 <AddExpenseDialog />
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
                    <div className="text-2xl font-bold text-slate-900">Rs. 117,000</div>
                    <p className="text-xs text-rose-600 mt-1">+2.5% from last month</p>
                </CardContent>
             </Card>
             <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Highest Category</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">Salaries</div>
                    <p className="text-xs text-slate-500 mt-1">Rs. 85,000 (72% of total)</p>
                </CardContent>
             </Card>
             <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Pending Bills</CardTitle>
                    <Receipt className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">1 Bill</div>
                    <p className="text-xs text-slate-500 mt-1">Rs. 4,500 due soon</p>
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
                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
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