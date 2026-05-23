"use client";

import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { apiFetcher } from "@/lib/api";
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
  Pencil,
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
  CompactStatCard,
  CompactStatsGrid,
} from "@/components/general/compact-stat-card";
import { CompactTableCard } from "@/components/general/compact-table-card";
import { CompactFilterToolbar } from "@/components/general/compact-filter-toolbar";
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
import { exportToCSV } from "@/lib/export-utils";
import { donationService } from "@/services/donationService";
import { toast } from "sonner";
import { DonationSkeleton } from "./DonationSkeleton";
import { cn } from "@/lib/utils";

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

// --- 3. DataTableColumnHeader ---
const DataTableColumnHeader = ({ column, title, className }) => {
  if (!column.getCanSort()) {
    return (
      <div className={cn("text-xs font-semibold text-slate-500", className)}>
        {title}
      </div>
    );
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "-ml-3 h-8 data-[state=open]:bg-accent text-xs font-semibold text-slate-500 hover:text-slate-900",
        className,
      )}
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
  );
};

// --- 4. Columns Definition ---
const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    meta: {
      headerClassName: "w-[40px] text-center",
      className: "text-center",
    },
  },
  {
    accessorKey: "donor_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Donor Name" />
    ),
    cell: ({ row }) => {
      const name = row.original.donor_name;
      const isAnonymous = name === "Anonymous" || name === "Friday Collection";
      return (
        <div className="flex items-center gap-3">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${isAnonymous ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
          >
            {isAnonymous ? "?" : name.charAt(0)}
          </div>
          <span className="font-medium text-slate-900">{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "purpose",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fund / Purpose" />
    ),
    cell: ({ row }) => {
      const purpose = row.original.purpose;
      let badgeColor = "bg-slate-100 text-slate-600 hover:bg-slate-200"; // Default

      if (purpose === "Zakat")
        badgeColor =
          "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200";
      if (purpose === "Building Fund")
        badgeColor =
          "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
      if (purpose === "Jummah")
        badgeColor =
          "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100";

      return (
        <Badge variant="outline" className={`${badgeColor} border`}>
          {purpose}
        </Badge>
      );
    },
  },
  {
    accessorKey: "amount",
    meta: {
      headerClassName: "justify-end w-full text-right",
      className: "text-right",
    },
    cell: ({ row }) => {
      return (
        <span className="font-bold text-slate-900">
          {formatCurrency(row.getValue("amount"))}
        </span>
      );
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => (
      <div className="text-sm text-slate-500">
        {format(new Date(row.getValue("date")), "MMM dd, yyyy")}
      </div>
    ),
  },
  {
    id: "actions",
    meta: {
      headerClassName: "text-right",
      className: "text-right",
    },
    cell: ({ row, table }) => {
      return (
        <div className="flex justify-end">
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
                onClick={() =>
                  table.options.meta?.handleDelete(row.original.id)
                }
              >
                Void Transaction
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export default function DonationsPage() {
  // Data Fetching with SWR
  const { data: rawDonations = [], isLoading } = useSWR(
    "/donations",
    apiFetcher,
  );

  // Formatting data for the table
  const donations = useMemo(() => {
    return rawDonations.map((d) => ({
      ...d,
      donor_name: d.isAnonymous
        ? "Anonymous"
        : d.member
          ? d.member.name
          : d.donorName,
    }));
  }, [rawDonations]);

  const [isNavigating, setIsNavigating] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const refreshDonations = () => mutate("/donations");

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this donation?")) {
      try {
        await donationService.delete(id);
        toast.success("Donation deleted");
        refreshDonations();
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
      handleDelete, // Pass delete handler to columns
    },
  });

  if (isLoading) {
    return <DonationSkeleton />;
  }

  const handleExport = () => {
    if (donations.length === 0) {
      toast.error("No data to export");
      return;
    }

    const dataToExport = table.getFilteredRowModel().rows.map((row) => {
      const d = row.original;
      return {
        "Donor Name": d.donor_name,
        "Fund / Purpose": d.purpose,
        Amount: d.amount,
        Date: format(new Date(d.date), "yyyy-MM-dd"),
        "Payment Method": d.paymentMethod || "N/A",
        Anonymous: d.isAnonymous ? "Yes" : "No",
        Remarks: d.remarks || "",
      };
    });

    exportToCSV(
      dataToExport,
      `donations-export-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    toast.success("Exporting CSV...");
  };

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
        className="relative z-10 flex flex-col space-y-4 px-6 pb-6 pt-8 max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <HandCoins className="h-8 w-8 text-emerald-600" />
              Donations & Collections
            </h1>
            <p className="text-slate-500">
              Track incoming funds, Zakat, and other contributions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Link href="/donations/new">
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                onClick={() => setIsNavigating(true)}
                disabled={isNavigating}
              >
                {isNavigating ? (
                  <LoaderIcon className="animate-spin h-4 w-4" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                Add Donation
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <CompactStatsGrid cols={4}>
            <CompactStatCard
              label="Total Collected"
              value={formatCurrency(
                donations.reduce(
                  (acc, curr) => acc + (Number(curr.amount) || 0),
                  0,
                ),
              )}
              sublabel="Lifetime collections"
              icon={Wallet}
              iconClassName="text-emerald-600"
              iconBgClassName="bg-emerald-50"
            />
            <CompactStatCard
              label="This Month"
              value={formatCurrency(
                donations
                  .filter(
                    (d) =>
                      new Date(d.date).getMonth() === new Date().getMonth() &&
                      new Date(d.date).getFullYear() ===
                        new Date().getFullYear(),
                  )
                  .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
              )}
              sublabel="Current month"
              icon={Calendar}
              iconClassName="text-blue-600"
              iconBgClassName="bg-blue-50"
            />
            <CompactStatCard
              label="Zakat Fund"
              value={formatCurrency(
                donations
                  .filter((d) => d.purpose === "Zakat")
                  .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
              )}
              sublabel="Restricted funds"
              icon={Heart}
              iconClassName="text-amber-600"
              iconBgClassName="bg-amber-50"
            />
            <CompactStatCard
              label="Recent Donors"
              value={
                donations.filter((d) => {
                  const diffDays = Math.ceil(
                    Math.abs(new Date() - new Date(d.date)) /
                      (1000 * 60 * 60 * 24),
                  );
                  return diffDays <= 7;
                }).length
              }
              sublabel="This week"
              icon={HandCoins}
              iconClassName="text-emerald-600"
              iconBgClassName="bg-emerald-50"
            />
          </CompactStatsGrid>
        </motion.div>

        <motion.div variants={itemVariants}>
          <CompactTableCard
            toolbar={
              <CompactFilterToolbar>
                <div className="relative w-full sm:max-w-[220px] sm:flex-1 sm:min-w-[180px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search donors..."
                    value={
                      table.getColumn("donor_name")?.getFilterValue() ?? ""
                    }
                    onChange={(event) =>
                      table
                        .getColumn("donor_name")
                        ?.setFilterValue(event.target.value)
                    }
                    className="h-9 pl-8 text-sm bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <Select
                  value={table.getColumn("purpose")?.getFilterValue() ?? ""}
                  onValueChange={(value) =>
                    table
                      .getColumn("purpose")
                      ?.setFilterValue(value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger className="h-9 w-full sm:w-[150px] text-sm bg-slate-50 border-slate-200 focus:ring-emerald-500">
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
              </CompactFilterToolbar>
            }
          >
            <DataTable table={table} columns={columns} />
          </CompactTableCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
