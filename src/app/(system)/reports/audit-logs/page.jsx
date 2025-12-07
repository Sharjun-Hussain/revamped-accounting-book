"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Download,
  Calendar as CalendarIcon,
  User,
  Activity,
  Trash2,
  Edit3,
  PlusCircle,
  FileJson
} from "lucide-react";
import { format } from "date-fns";

// UI Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table"; 
import { ScrollArea } from "@/components/ui/scroll-area";

// Import Shared Export Utility
import { exportToCSV } from "@/lib/export-utils";

// --- 1. MOCK DATA ---
const mockLogs = [
  { 
    id: "LOG-1001", 
    timestamp: "2025-12-07T10:30:00", 
    user: "Admin (Super)", 
    action: "CREATE", 
    resource: "Member", 
    details: "Registered new member: Abdul Rahman", 
    ip: "192.168.1.10",
    changes: {
        new: { name: "Abdul Rahman", id: "M-001", status: "Active" }
    }
  },
  { 
    id: "LOG-1002", 
    timestamp: "2025-12-07T11:15:00", 
    user: "Treasurer", 
    action: "UPDATE", 
    resource: "Payment", 
    details: "Corrected amount for Receipt #88502", 
    ip: "192.168.1.12",
    changes: {
        old: { amount: 2000 },
        new: { amount: 3000 }
    }
  },
  { 
    id: "LOG-1003", 
    timestamp: "2025-12-06T14:20:00", 
    user: "Admin (Super)", 
    action: "DELETE", 
    resource: "Expense", 
    details: "Removed duplicate utility bill entry", 
    ip: "192.168.1.10",
    changes: {
        old: { id: "EXP-999", amount: 12500, payee: "CEB" }
    }
  },
  { 
    id: "LOG-1004", 
    timestamp: "2025-12-06T09:00:00", 
    user: "System", 
    action: "SYSTEM", 
    resource: "Cron Job", 
    details: "Auto-generated monthly bills for Dec 2025", 
    ip: "localhost",
    changes: null
  },
];

// --- 2. COLUMNS ---
const columns = [
  {
    accessorKey: "timestamp",
    header: "Date & Time",
    cell: ({ row }) => (
        <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">{format(new Date(row.getValue("timestamp")), "MMM dd, yyyy")}</span>
            <span className="text-xs text-slate-400 font-mono">{format(new Date(row.getValue("timestamp")), "HH:mm:ss")}</span>
        </div>
    ),
  },
  {
    accessorKey: "user",
    header: "User / Actor",
    cell: ({ row }) => (
        <div className="flex items-center gap-2">
            <div className="p-1 bg-slate-100 rounded-full">
                <User className="w-3 h-3 text-slate-500" />
            </div>
            <span className="text-sm text-slate-700">{row.getValue("user")}</span>
        </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.getValue("action");
      let badgeStyle = "bg-slate-100 text-slate-600 border-slate-200";
      let Icon = Activity;

      if (action === "CREATE") { badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200"; Icon = PlusCircle; }
      if (action === "UPDATE") { badgeStyle = "bg-blue-50 text-blue-700 border-blue-200"; Icon = Edit3; }
      if (action === "DELETE") { badgeStyle = "bg-rose-50 text-rose-700 border-rose-200"; Icon = Trash2; }

      return (
        <Badge variant="outline" className={`${badgeStyle} gap-1 pr-2`}>
          <Icon className="w-3 h-3" /> {action}
        </Badge>
      );
    },
  },
  {
    accessorKey: "details",
    header: "Description",
    cell: ({ row }) => (
        <div>
            <div className="font-medium text-slate-900">{row.original.resource}</div>
            <div className="text-xs text-slate-500 truncate max-w-[300px]">{row.getValue("details")}</div>
        </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
        // Custom Hook trigger or direct prop passing
        return (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => document.dispatchEvent(new CustomEvent('view-log', { detail: row.original }))}
                className="h-8 w-8 p-0"
            >
                <Eye className="h-4 w-4 text-slate-400" />
            </Button>
        )
    },
  },
];

// --- 3. DETAIL DIALOG COMPONENT ---
const LogDetailDialog = ({ log, open, setOpen }) => {
    if (!log) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        Audit Log Details
                    </DialogTitle>
                    <DialogDescription>
                        Transaction ID: <span className="font-mono text-xs bg-slate-100 px-1 rounded">{log.id}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <span className="text-slate-500 text-xs uppercase font-bold">Actor</span>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                {log.user}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-slate-500 text-xs uppercase font-bold">IP Address</span>
                            <div className="font-mono">{log.ip}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-slate-500 text-xs uppercase font-bold">Resource</span>
                            <div>{log.resource}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-slate-500 text-xs uppercase font-bold">Timestamp</span>
                            <div>{format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}</div>
                        </div>
                    </div>

                    {log.changes && (
                        <div className="space-y-2">
                            <span className="text-slate-500 text-xs uppercase font-bold flex items-center gap-2">
                                <FileJson className="w-4 h-4" /> Change Data
                            </span>
                            <ScrollArea className="h-[200px] w-full rounded-md border border-slate-200 bg-slate-50 p-4">
                                <pre className="text-xs font-mono text-slate-700">
                                    {JSON.stringify(log.changes, null, 2)}
                                </pre>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- 4. MAIN PAGE ---
export default function AuditLogsPage() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  
  // Detail Dialog State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Event Listener for "View Details"
  if (typeof window !== 'undefined') {
    window.addEventListener('view-log', (e) => {
        setSelectedLog(e.detail);
        setIsDialogOpen(true);
    });
  }

  const table = useReactTable({
    data: mockLogs,
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
    const csvData = mockLogs.map(l => ({
        "Time": l.timestamp,
        "User": l.user,
        "Action": l.action,
        "Resource": l.resource,
        "Details": l.details,
        "IP": l.ip
    }));
    exportToCSV(csvData, "System_Audit_Logs.csv");
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
      
      <LogDetailDialog log={selectedLog} open={isDialogOpen} setOpen={setIsDialogOpen} />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-8 w-8 text-emerald-600" />
                    Audit Logs
                </h1>
                <p className="text-slate-500">Track system activity, security events, and data changes.</p>
            </div>
            
            <Button variant="outline" onClick={handleExport} className="bg-white border-slate-200 text-slate-700">
                <Download className="w-4 h-4 mr-2" /> Export Logs
            </Button>
        </div>

        {/* TOOLBAR */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-1 items-center gap-3 w-full">
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search details..."
                                value={(table.getColumn("details")?.getFilterValue()) ?? ""}
                                onChange={(event) => table.getColumn("details")?.setFilterValue(event.target.value)}
                                className="pl-10 bg-slate-50 border-slate-200"
                            />
                        </div>
                        
                        <Select
                            onValueChange={(value) => table.getColumn("action")?.setFilterValue(value === "all" ? undefined : value)}
                        >
                            <SelectTrigger className="w-[150px] bg-slate-50 border-slate-200">
                                <Filter className="w-3 h-3 mr-2 text-slate-500" />
                                <SelectValue placeholder="Action Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="CREATE">Created</SelectItem>
                                <SelectItem value="UPDATE">Updated</SelectItem>
                                <SelectItem value="DELETE">Deleted</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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