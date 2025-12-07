"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Tags,
  PlusCircle,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Archive
} from "lucide-react";

// UI Imports
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table"; 
import { Progress } from "@/components/ui/progress";

// --- 1. MOCK DATA ---
const mockCategories = [
  { id: "CAT-001", name: "Utilities", description: "Electricity, Water, and Internet bills", color: "amber", budget_limit: 50000, current_spend: 12500, status: "Active" },
  { id: "CAT-002", name: "Staff Salaries", description: "Monthly payroll for Imam, Muezzin, and cleaning staff", color: "blue", budget_limit: 150000, current_spend: 85000, status: "Active" },
  { id: "CAT-003", name: "Maintenance", description: "Repairs, plumbing, and building upkeep", color: "slate", budget_limit: 25000, current_spend: 4500, status: "Active" },
  { id: "CAT-004", name: "Events & Programs", description: "Community gatherings, Friday lunch, Iftar", color: "purple", budget_limit: 100000, current_spend: 15000, status: "Active" },
  { id: "CAT-005", name: "Charity Outflow", description: "Funds distributed to needy families", color: "emerald", budget_limit: 200000, current_spend: 195000, status: "Active" },
];

const colorOptions = [
  { value: "emerald", label: "Emerald Green", bg: "bg-emerald-100", text: "text-emerald-700" },
  { value: "blue", label: "Royal Blue", bg: "bg-blue-100", text: "text-blue-700" },
  { value: "amber", label: "Amber / Warning", bg: "bg-amber-100", text: "text-amber-700" },
  { value: "purple", label: "Purple", bg: "bg-purple-100", text: "text-purple-700" },
  { value: "rose", label: "Rose Red", bg: "bg-rose-100", text: "text-rose-700" },
  { value: "slate", label: "Slate Grey", bg: "bg-slate-100", text: "text-slate-700" },
];

// --- 2. HEADER COMPONENT ---
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

// --- 3. DIALOG COMPONENT ---
const CategoryDialog = ({ open, onOpenChange, initialData }) => {
  const isEditMode = !!initialData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white">
          <DialogTitle className="flex items-center gap-2 text-xl">
             <div className="p-2 bg-emerald-100 rounded-lg">
                <Tags className="w-5 h-5 text-emerald-600" />
             </div>
             {isEditMode ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? "Modify account details and limits." : "Define a new bucket for tracking expenses."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto max-h-[65vh]">
            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label>Category Name</Label>
                    <Input defaultValue={initialData?.name || ""} placeholder="e.g. Transport" />
                </div>

                <div className="space-y-2">
                    <Label>Color Code</Label>
                    <Select defaultValue={initialData?.color || "emerald"}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {colorOptions.map(c => (
                                <SelectItem key={c.value} value={c.value}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${c.bg.replace("100", "500")}`} />
                                        {c.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Monthly Budget Limit (LKR)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-bold">Rs.</span>
                        <Input 
                            type="number" 
                            className="pl-10 font-bold" 
                            defaultValue={initialData?.budget_limit || ""} 
                            placeholder="0.00" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                        defaultValue={initialData?.description || ""} 
                        placeholder="What kind of expenses go here?" 
                        className="resize-none h-20" 
                    />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                    <div className="space-y-0.5">
                        <Label className="text-base">Active Status</Label>
                        <p className="text-xs text-slate-500">Enable this category in forms</p>
                    </div>
                    <Switch defaultChecked={initialData?.status !== "Inactive"} />
                </div>
            </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50 sm:justify-between items-center">
            <div className="hidden sm:block"></div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>
                    {isEditMode ? "Update Category" : "Save Category"}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- 4. MAIN PAGE ---
export default function ExpenseCategoriesPage() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({}); // New State for Selection
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleEdit = (category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleDeleteSelected = () => {
     // Logic to delete selected rows
     console.log("Deleting rows:", Object.keys(rowSelection));
     setRowSelection({});
  };

  // -- COLUMNS --
  const columns = useMemo(() => [
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
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category Name" />,
        cell: ({ row }) => {
        const color = colorOptions.find(c => c.value === row.original.color) || colorOptions[0];
        return (
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${color.bg.replace("bg-", "bg-").replace("100", "500")}`} />
                <div>
                    <div className="font-medium text-slate-900">{row.getValue("name")}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[250px]">{row.original.description}</div>
                </div>
            </div>
        );
        },
    },
    {
        accessorKey: "budget_limit",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Budget Usage" />,
        cell: ({ row }) => {
            const limit = row.original.budget_limit;
            const spent = row.original.current_spend;
            const percentage = Math.min(100, (spent / limit) * 100);
            
            let progressColor = "bg-emerald-500";
            if(percentage > 75) progressColor = "bg-amber-500";
            if(percentage > 90) progressColor = "bg-rose-500";

            return (
                <div className="w-[180px] space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">Rs. {spent.toLocaleString()}</span>
                        <span className="text-slate-400"> / {limit.toLocaleString()}</span>
                    </div>
                    <Progress value={percentage} className="h-1.5 bg-slate-100" indicatorClassName={progressColor} />
                </div>
            )
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
        const s = row.getValue("status");
        return (
            <Badge variant="outline" className={s === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500"}>
            {s}
            </Badge>
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
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                <Pencil className="w-4 h-4 mr-2" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-rose-600">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Category
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        ),
    },
  ], []);

  const table = useReactTable({
    data: mockCategories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection, // Bind Selection State
    state: { sorting, columnFilters, rowSelection },
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
      
      <CategoryDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        initialData={editingCategory} 
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Tags className="h-8 w-8 text-emerald-600" />
                    Expense Categories
                </h1>
                <p className="text-slate-500">Configure accounts and budget limits for expenditures.</p>
            </div>
            
            <div className="flex gap-2">
                <Button 
                    onClick={handleCreate} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 gap-2"
                >
                    <PlusCircle className="w-4 h-4" /> New Category
                </Button>
            </div>
        </div>

        {/* TOOLBAR & BULK ACTIONS */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    
                    {/* Left: Filters */}
                    <div className="flex flex-1 items-center gap-3 w-full">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search categories..."
                                value={(table.getColumn("name")?.getFilterValue()) ?? ""}
                                onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                                className="pl-10 bg-slate-50 border-slate-200"
                            />
                        </div>
                        
                        <Select
                            value={(table.getColumn("status")?.getFilterValue()) ?? ""}
                            onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)}
                        >
                            <SelectTrigger className="w-[150px] bg-slate-50 border-slate-200">
                                <Filter className="w-3 h-3 mr-2 text-slate-500" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Right: Bulk Actions */}
                    {selectedCount > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-200">
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                {selectedCount} Selected
                            </Badge>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="border-slate-200 text-slate-700">
                                        Bulk Actions
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <CheckSquare className="w-4 h-4 mr-2" /> Mark as Active
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Archive className="w-4 h-4 mr-2" /> Archive Selected
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleDeleteSelected} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                                        <Trash2 className="w-4 h-4 mr-2" /> Delete Selected
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
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