"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  MoreHorizontal,
  HandCoins,
  Search,
  Download,
  PlusCircle,
  LoaderIcon,
  Heart,
  Wallet,
  Calendar,
  Filter,
  Pencil
} from "lucide-react";
import { format } from "date-fns";

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
import { DataTable } from "@/components/general/data-table"; // Assuming you have this generic component
import Link from "next/link";

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

// --- 3. Mock Data ---
// Mock Data Removed

// --- 4. Columns Definition ---
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
    accessorKey: "donor_name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Donor Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
        const name = row.original.donor_name;
        const isAnonymous = name === "Anonymous" || name === "Friday Collection";
        return (
            <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${isAnonymous ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {isAnonymous ? "?" : name.charAt(0)}
                </div>
                <span className="font-medium text-slate-900">{name}</span>
            </div>
        )
    }
  },
  {
    accessorKey: "purpose",
    header: "Fund / Purpose",
    cell: ({ row }) => {
      const purpose = row.original.purpose;
      let badgeColor = "bg-slate-100 text-slate-600 hover:bg-slate-200"; // Default
      
      if (purpose === "Zakat") badgeColor = "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200";
      if (purpose === "Building Fund") badgeColor = "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
      if (purpose === "Jummah") badgeColor = "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100";

      return <Badge variant="outline" className={`${badgeColor} border`}>{purpose}</Badge>;
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
        <div className="text-right">Amount</div>
    ),
    cell: ({ row }) => {
      return <div className="text-right font-bold text-slate-900">{formatCurrency(row.getValue("amount"))}</div>;
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <div className="text-sm text-slate-500">{format(new Date(row.getValue("date")), "MMM dd, yyyy")}</div>,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>View Receipt</DropdownMenuItem>
            <DropdownMenuItem>Print Acknowledgement</DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href={`/donations/${row.original.id}/edit`}>
                <DropdownMenuItem>
                    <Pencil className="w-4 h-4 mr-2" /> Edit Details
                </DropdownMenuItem>
            </Link>
            <DropdownMenuItem 
                className="text-red-600"
                onClick={() => table.options.meta?.handleDelete(row.original.id)}
            >
                Void Transaction
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

import { donationService } from "@/services/donationService";
import { toast } from "sonner";

// ... (keep imports)

export default function DonationsPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [donations, setDonations] = useState([]);

  const fetchDonations = async () => {
      try {
          const data = await donationService.getAll();
          // Map API data to table format if needed, or adjust columns
          const formattedData = data.map(d => ({
              ...d,
              donor_name: d.isAnonymous ? "Anonymous" : (d.member ? d.member.name : d.donorName),
              // Ensure date is string or date object as expected by column formatter
          }));
          setDonations(formattedData);
      } catch (error) {
          console.error("Failed to fetch donations", error);
          toast.error("Failed to load donations");
      }
  };

  useState(() => {
      fetchDonations();
  }, []);

  const handleDelete = async (id) => {
      if(confirm("Are you sure you want to delete this donation?")) {
          try {
              await donationService.delete(id);
              toast.success("Donation deleted");
              fetchDonations();
          } catch (error) {
              console.error("Failed to delete donation", error);
              toast.error("Failed to delete donation");
          }
      }
  };

  const table = useReactTable({
    data: donations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, rowSelection },
    meta: {
        handleDelete // Pass delete handler to columns
    }
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
              <HandCoins className="h-8 w-8 text-emerald-600" />
              Donations & Collections
            </h1>
            <p className="text-slate-500">Track incoming funds, Zakat, and other contributions.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Link href="/donations/new">
                <Button 
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                    onClick={() => setIsNavigating(true)}
                    disabled={isNavigating}
                >
                {isNavigating ? <LoaderIcon className="animate-spin h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                Add Donation
                </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Collected</CardTitle>
              <Wallet className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(donations.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0))}
              </div>
              <p className="text-xs text-slate-400 mt-1">Lifetime collections</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(
                    donations
                        .filter(d => new Date(d.date).getMonth() === new Date().getMonth() && new Date(d.date).getFullYear() === new Date().getFullYear())
                        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
                )}
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">Current month total</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Zakat Fund</CardTitle>
              <Heart className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(
                    donations
                        .filter(d => d.purpose === "Zakat")
                        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Restricted funds</p>
            </CardContent>
          </Card>
           <Card className="rounded-xl shadow-sm bg-emerald-50 border-emerald-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">Recent Donors</CardTitle>
              <HandCoins className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">
                {donations.filter(d => {
                    const date = new Date(d.date);
                    const now = new Date();
                    const diffTime = Math.abs(now - date);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    return diffDays <= 7;
                }).length}
              </div>
              <p className="text-xs text-emerald-600 mt-1">Contributors this week</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Table */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-xl border-slate-100 shadow-sm overflow-hidden bg-white">
            <CardContent className="pt-6">
                
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search donors..."
                        value={table.getColumn("donor_name")?.getFilterValue() ?? ""}
                        onChange={(event) => table.getColumn("donor_name")?.setFilterValue(event.target.value)}
                        className="pl-10 bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    </div>
                    <Select
                        value={table.getColumn("purpose")?.getFilterValue() ?? ""}
                        onValueChange={(value) => table.getColumn("purpose")?.setFilterValue(value === "all" ? undefined : value)}
                    >
                    <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 focus:ring-emerald-500">
                        <SelectValue placeholder="Fund / Purpose" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Funds</SelectItem>
                        <SelectItem value="General">General Fund</SelectItem>
                        <SelectItem value="Zakat">Zakat</SelectItem>
                        <SelectItem value="Building Fund">Building Fund</SelectItem>
                        <SelectItem value="Jummah">Jummah Collection</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-md border border-slate-100">
                <DataTable table={table} columns={columns} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}