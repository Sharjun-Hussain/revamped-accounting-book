"use client";

import { useState, useEffect } from "react";
import { memberService } from "@/services/memberService";
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
  Upload,
  Phone,
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
import { exportToCSV } from "@/lib/export-utils";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { 
    Mail, 
    MapPin, 
    Calendar as CalendarIcon, 
    CreditCard, 
    TrendingUp, 
    AlertCircle,
    ArrowUpRight,
    ArrowDownLeft
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

// --- Mock Data Removed ---

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
          value={table.getColumn("paymentFrequency")?.getFilterValue() ?? ""}
          onValueChange={(value) => {
            table.getColumn("paymentFrequency")?.setFilterValue(value === "all" ? undefined : value);
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

import { BulkUploadModal } from "@/components/members/bulk-upload-modal";
import { MemberSkeleton } from "./MemberSkeleton";
import { Badge } from "../ui/badge";

export default function MembersPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sheet State
  const [selectedMember, setSelectedMember] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [isStatementLoading, setIsStatementLoading] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await memberService.getAll();
        setMembers(data);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedMember && isSheetOpen) {
        const fetchStatement = async () => {
            setIsStatementLoading(true);
            try {
                const data = await memberService.getMemberStatement(selectedMember.id);
                setStatementData(data);
            } catch (error) {
                console.error("Failed to fetch member statement:", error);
                toast.error("Failed to load member history");
            } finally {
                setIsStatementLoading(false);
            }
        };
        fetchStatement();
    } else {
        setStatementData(null);
    }
  }, [selectedMember, isSheetOpen]);

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setIsSheetOpen(true);
  };

  const data = members;

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
    meta: {
        onMemberClick: handleMemberClick
    }
  });

  const handleExport = () => {
    if (members.length === 0) {
      toast.error("No data to export");
      return;
    }

    const dataToExport = table.getFilteredRowModel().rows.map(row => {
      const m = row.original;
      return {
        "Member No": m.memberNo || "N/A",
        "Name": m.name,
        "Contact": m.contact,
        "Email": m.email || "N/A",
        "Frequency": m.paymentFrequency,
        "Amount": m.amountPerCycle,
        "Status": m.status,
        "Start Date": format(new Date(m.startDate), "yyyy-MM-dd"),
        "Address": m.address || ""
      };
    });

    exportToCSV(dataToExport, `members-export-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast.success("Exporting CSV...");
  };

  if (isLoading) {
    return <MemberSkeleton />;
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
            <Button 
              variant="outline" 
              className="gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              Export List
            </Button>
            <Button 
                variant="outline" 
                className="gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                onClick={() => setIsUploadModalOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Import Members
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

        <BulkUploadModal 
            open={isUploadModalOpen} 
            onOpenChange={setIsUploadModalOpen} 
            onSuccess={() => {
                // Refresh members list
                const fetchMembers = async () => {
                    try {
                        const data = await memberService.getAll();
                        setMembers(data);
                    } catch (error) {
                        console.error("Failed to fetch members:", error);
                    }
                };
                fetchMembers();
            }}
        />

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

      {/* Member Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col gap-0 border-l-emerald-100">
          {selectedMember && (
            <>
              <SheetHeader className="p-6 bg-emerald-50/50 border-b border-emerald-100">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold border-2 border-white shadow-sm">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <SheetTitle className="text-2xl font-bold text-slate-900">
                      {selectedMember.name}
                    </SheetTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-emerald-100 text-emerald-700">
                        {selectedMember.memberNo || selectedMember.id.slice(-6).toUpperCase()}
                      </span>
                      <Badge variant={selectedMember.status === 'active' ? 'default' : 'secondary'} className="capitalize text-[10px] h-5">
                        {selectedMember.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 h-full min-h-0">
                <div className="p-6 space-y-8 pb-10">
                  {/* Contact Info Section */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Contact Number</p>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Phone className="h-4 w-4 text-emerald-500" />
                        {selectedMember.contact}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Email Address</p>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Mail className="h-4 w-4 text-emerald-500" />
                        {selectedMember.email || "N/A"}
                      </div>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Residential Address</p>
                      <div className="flex items-start gap-2 text-slate-700 font-medium">
                        <MapPin className="h-4 w-4 text-emerald-500 mt-0.5" />
                        {selectedMember.address || "No address provided"}
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-100" />

                  {/* Financial Summary */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Financial Overview
                    </h3>
                    
                    {isStatementLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <LoaderIcon className="h-8 w-8 animate-spin text-emerald-600" />
                        </div>
                    ) : statementData ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="bg-slate-50 border-none shadow-none p-4 rounded-xl">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Current Balance</p>
                                    <p className={`text-xl font-bold ${statementData.financial.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(statementData.financial.balance)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {statementData.financial.balance > 0 ? 'Outstanding arrears' : 'No pending dues'}
                                    </p>
                                </Card>
                                <Card className="bg-slate-50 border-none shadow-none p-4 rounded-xl">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Monthly Rate</p>
                                    <p className="text-xl font-bold text-slate-900">
                                        {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(statementData.financial.monthlyRate)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">{selectedMember.paymentFrequency} cycle</p>
                                </Card>
                            </div>

                            {/* Payment Summary Grid */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment History (Last 12 Months)</h4>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-1">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                            <span className="text-[10px] text-slate-400">Paid</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                            <span className="text-[10px] text-slate-400">Partial</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                            <span className="text-[10px] text-slate-400">Unpaid</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                                    {statementData.financial.monthlyStatus.map((m, idx) => {
                                        let bgColor = "bg-slate-100";
                                        let textColor = "text-slate-400";
                                        let borderColor = "border-slate-200";
                                        
                                        if (m.status === 'paid') {
                                            bgColor = "bg-emerald-50";
                                            textColor = "text-emerald-700";
                                            borderColor = "border-emerald-200";
                                        } else if (m.status === 'partial') {
                                            bgColor = "bg-amber-50";
                                            textColor = "text-amber-700";
                                            borderColor = "border-amber-200";
                                        } else if (m.status === 'unpaid') {
                                            bgColor = "bg-red-50";
                                            textColor = "text-red-700";
                                            borderColor = "border-red-200";
                                        }
                                        
                                        return (
                                            <div 
                                                key={idx} 
                                                className={`flex flex-col items-center justify-center p-2 rounded-lg border ${bgColor} ${borderColor} transition-all hover:scale-105`}
                                                title={`${m.month} ${m.year}: ${m.status.replace('-', ' ')}`}
                                            >
                                                <span className={`text-[10px] font-bold uppercase ${textColor}`}>{m.month}</span>
                                                <span className={`text-[8px] opacity-70 ${textColor}`}>{m.year}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Transaction History */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Transactions</h4>
                                <div className="space-y-2">
                                    {statementData.financial.transactions.length > 0 ? (
                                        statementData.financial.transactions.slice().reverse().map((tx, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tx.type === 'Payment' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {tx.type === 'Payment' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{tx.desc}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">{format(new Date(tx.date), "MMM dd, yyyy")} • Ref: {tx.ref}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-bold ${tx.credit > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                        {tx.credit > 0 ? `+${tx.credit}` : `-${tx.debit}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-sm text-slate-400">No transaction history found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-slate-400">Failed to load financial data</p>
                        </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}