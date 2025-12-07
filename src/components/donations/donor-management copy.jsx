"use client";

import { useState } from "react";
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
  HeartHandshake
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
import { DataTable } from "@/components/general/data-table"; // Assuming existing component

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

// --- 3. Mock Data (Donors Aggregated) ---
const mockDonors = [
  {
    id: "d_1",
    name: "Abdul Rahman",
    type: "Member",
    member_id: "M-001",
    total_contributed: 150000,
    last_donation: "2023-10-25",
    donation_count: 12,
    contact: "0771234567",
    status: "Active",
  },
  {
    id: "d_2",
    name: "Mr. Farook (Dubai)",
    type: "Guest",
    member_id: null,
    total_contributed: 500000,
    last_donation: "2023-09-15",
    donation_count: 3,
    contact: "0719876543",
    status: "Active",
  },
  {
    id: "d_3",
    name: "Mohamed Fazil",
    type: "Member",
    member_id: "M-002",
    total_contributed: 45000,
    last_donation: "2023-10-20",
    donation_count: 8,
    contact: "0755551234",
    status: "Active",
  },
  {
    id: "d_4",
    name: "Anonymous Group A",
    type: "Guest",
    member_id: null,
    total_contributed: 25000,
    last_donation: "2023-10-22",
    donation_count: 5,
    contact: "-",
    status: "Active",
  },
];

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
              {donor.type === "Member" ? `ID: ${donor.member_id}` : "Guest Donor"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type");
      return (
        <Badge variant={type === "Member" ? "default" : "secondary"} 
            className={type === "Member" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}>
          {type}
        </Badge>
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
        {format(new Date(row.getValue("last_donation")), "MMM dd, yyyy")}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>View Donation History</DropdownMenuItem>
            <DropdownMenuItem>Edit Contact Info</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-slate-500">Archive Profile</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function DonorsPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: mockDonors,
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
            <p className="text-slate-500">Track profiles of members and guest contributors.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            {/* Usually donors are added via transactions, but this allows creating a profile manually */}
            <Button 
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                onClick={() => setIsNavigating(true)}
                disabled={isNavigating}
            >
            {isNavigating ? <LoaderIcon className="animate-spin h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            New Guest Profile
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl border-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Donors</CardTitle>
              <Users className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">1,240</div>
              <p className="text-xs text-slate-400 mt-1">850 Members • 390 Guests</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Top Contributor</CardTitle>
              <Trophy className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">Mr. Farook</div>
              <p className="text-xs text-emerald-600 font-medium mt-1">Rs. 500,000 Lifetime</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Recent Activity</CardTitle>
              <CalendarClock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">12</div>
              <p className="text-xs text-slate-400 mt-1">New donors this month</p>
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
                        placeholder="Search by name..."
                        value={table.getColumn("name")?.getFilterValue() ?? ""}
                        onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
                        className="pl-10 bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    </div>
                    <Select
                        value={table.getColumn("type")?.getFilterValue() ?? ""}
                        onValueChange={(value) => table.getColumn("type")?.setFilterValue(value === "all" ? undefined : value)}
                    >
                    <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 focus:ring-emerald-500">
                        <SelectValue placeholder="Donor Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Member">Members</SelectItem>
                        <SelectItem value="Guest">Guests</SelectItem>
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