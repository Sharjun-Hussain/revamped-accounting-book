"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  MoreHorizontal,
  Search,
  Download,
  UserPlus,
  LoaderIcon,
  Users,
  Trophy,
  CalendarClock,
  HeartHandshake,
  Pencil,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table";
import { donorService } from "@/services/donorService";
import { DonorForm } from "@/components/donations/donor-form";

// --- 1. Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

// --- 2. Helper: Currency Formatter ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// --- 3. Skeleton Loader ---
const DonorSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between gap-4 mb-6">
      <Skeleton className="h-10 w-64" />
    </div>
    <div className="rounded-md border border-slate-100 overflow-hidden">
      <div className="bg-slate-50/50 h-10 border-b border-slate-100 px-4 flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="p-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

export default function DonorsPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  
  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);

  const fetchDonors = async () => {
    setIsLoading(true);
    try {
      const donors = await donorService.getAll();
      setData(donors);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this donor?")) {
      try {
        await donorService.delete(id);
        toast.success("Donor deleted");
        fetchDonors();
      } catch (error) {
        toast.error("Failed to delete donor");
      }
    }
  };

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
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Donor Profile <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const donor = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 bg-emerald-50 text-emerald-700 border border-emerald-100">
              <AvatarImage src="" />
              <AvatarFallback>{donor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-slate-900">{donor.name}</div>
              <div className="text-xs text-slate-500">
                {donor.contact || donor.email || "No contact info"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "total_contributed",
      header: ({ column }) => (
          <div className="text-right">Total Given</div>
      ),
      cell: ({ row }) => {
        return (
          <div className="text-right font-bold text-slate-900">
            {formatCurrency(row.getValue("total_contributed"))}
          </div>
        );
      },
    },
    {
      accessorKey: "donation_count",
      header: "Frequency",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-slate-600">
          <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />
          {row.getValue("donation_count")} times
        </div>
      ),
    },
    {
      accessorKey: "last_donation",
      header: "Last Active",
      cell: ({ row }) => (
        <div className="text-sm text-slate-500">
          {row.getValue("last_donation") 
            ? format(new Date(row.getValue("last_donation")), "MMM dd, yyyy")
            : "Never"}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const donor = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { setEditingDonor(donor); setIsFormOpen(true); }}>
                <Pencil className="w-4 h-4 mr-2" /> Edit Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(donor.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
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

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <DonorForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        donorToEdit={editingDonor} 
        onSuccess={fetchDonors} 
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="h-8 w-8 text-emerald-600" />
              Donor Management
            </h1>
            <p className="text-slate-500">Track profiles of guest contributors.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button 
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                onClick={() => { setEditingDonor(null); setIsFormOpen(true); }}
            >
            <UserPlus className="h-4 w-4" />
            New Guest Profile
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl border-slate-100 shadow-sm bg-white overflow-hidden relative group transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="h-12 w-12 text-emerald-600" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Donors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{data.length}</div>
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
                All Guest Profiles
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-100 shadow-sm bg-white overflow-hidden relative group transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="h-12 w-12 text-amber-600" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Top Contributor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-900 truncate pr-8">
                {data.length > 0 
                  ? [...data].sort((a,b) => b.total_contributed - a.total_contributed)[0].name 
                  : "N/A"}
              </div>
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1 font-medium bg-amber-50 w-fit px-2 py-0.5 rounded-full">
                Most Generous Donor
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-100 shadow-sm bg-white overflow-hidden relative group transition-all hover:shadow-md border-l-4 border-l-emerald-500">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <HeartHandshake className="h-12 w-12 text-emerald-600" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">
                {formatCurrency(data.reduce((sum, d) => sum + (d.total_contributed || 0), 0))}
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Lifetime Donor Giving
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Table */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-xl border-slate-100 shadow-sm overflow-hidden bg-white">
            <CardContent className="pt-6">
              {isLoading ? (
                <DonorSkeleton />
              ) : (
                <>
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name..."
                            value={table.getColumn("name")?.getFilterValue() ?? ""}
                            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                            className="pl-10 bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="rounded-md border border-slate-100">
                    <DataTable table={table} columns={columns} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
