"use client";

import { useState } from "react";
import { motion } from "framer-motion"; // Added animations
import { columns } from "@/components/members/columns";
import { DataTable } from "@/components/general/data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  Search,
  Download,
  LoaderIcon,
  Filter,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

// --- Mock Data ---
const mockMembers = [
  {
    id: "mem_1",
    member_id: "M-001",
    name: "Abdul Rahman",
    email: "abdul@example.com",
    contact: "0771234567",
    address: "12 Mosque Road, Kandy",
    payment_frequency: "Monthly",
    amount_per_cycle: 1000,
    status: "active",
    start_date: "2023-01-01",
  },
  {
    id: "mem_2",
    member_id: "M-002",
    name: "Mohamed Fazil",
    email: "fazil@example.com",
    contact: "0719876543",
    address: "45 Main Street, Colombo",
    payment_frequency: "Quarterly",
    amount_per_cycle: 3000,
    status: "active",
    start_date: "2023-03-15",
  },
  {
    id: "mem_3",
    member_id: "M-003",
    name: "Yusuf Khan",
    email: null,
    contact: "0755551234",
    address: "88 Hill Top, Kandy",
    payment_frequency: "Yearly",
    amount_per_cycle: 12000,
    status: "inactive",
    start_date: "2022-11-20",
  },
  {
    id: "mem_4",
    member_id: "M-004",
    name: "Zaid Ahmed",
    email: "zaid@example.com",
    contact: "0761112222",
    address: "Apt 4B, City View",
    payment_frequency: "Monthly",
    amount_per_cycle: 1000,
    status: "deceased",
    start_date: "2020-08-01",
  },
];

const MemberBulkActions = ({ table }) => {
  const numSelected = table.getFilteredSelectedRowModel().rows.length;

  const handleDeactivate = () => {
    console.log("Deactivating selected members...");
    table.resetRowSelection();
  };

  const handleDelete = () => {
    console.log("Deleting selected members...");
    table.resetRowSelection();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          Bulk Actions ({numSelected})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDeactivate}>
          Mark as Inactive
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleDelete}>
          Delete Member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const MemberTableToolbar = ({ table, bulkActionsComponent }) => {
  const numSelected = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
        {/* Filter by Name */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name..."
            value={table.getColumn("name")?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-10 bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Filter by Payment Frequency */}
        <Select
          value={table.getColumn("payment_frequency")?.getFilterValue() ?? ""}
          onValueChange={(value) => {
            table.getColumn("payment_frequency")?.setFilterValue(value === "all" ? undefined : value);
          }}
        >
          <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 focus:ring-emerald-500">
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cycles</SelectItem>
            <SelectItem value="Monthly">Monthly</SelectItem>
            <SelectItem value="Quarterly">Quarterly</SelectItem>
            <SelectItem value="Yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter by Status */}
        <Select
          value={table.getColumn("status")?.getFilterValue() ?? ""}
          onValueChange={(value) => {
            table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value);
          }}
        >
          <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 focus:ring-emerald-500">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="deceased">Deceased</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {numSelected > 0 && bulkActionsComponent}
    </div>
  );
};

export default function MembersPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const data = mockMembers;

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
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 relative">
       {/* Background Pattern Overlay (Consistent with Dashboard) */}
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
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="h-8 w-8 text-emerald-600" />
              Member Registry
            </h1>
            <p className="text-slate-500">
              Manage Sanda subscriptions, contact details, and member status.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors">
              <Download className="h-4 w-4" />
              Export List
            </Button>
            <Link href="/members/new" passHref>
              <Button
                onClick={() => setIsNavigating(true)}
                disabled={isNavigating}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-all"
              >
                {isNavigating ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                Register Member
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Main Table Card */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden">
            <CardContent className="pt-6">
              <MemberTableToolbar
                table={table}
                bulkActionsComponent={<MemberBulkActions table={table} />}
              />
              
              {/* Data Table Component */}
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