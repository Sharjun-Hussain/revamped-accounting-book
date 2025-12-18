"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Landmark,
  PlusCircle,
  Search,
  MoreHorizontal,
  ArrowUpDown,
  CreditCard,
  Building2,
  Wallet,
  History,
  Pencil,
  Trash2,
  Copy
} from "lucide-react";

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
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table"; 
import { toast } from "sonner"; 
import { accountingService } from "@/services/accountingService";
import { useEffect } from "react";
import { AccountingSkeleton } from "@/components/accounting/AccountingSkeleton";

// --- 1. MOCK DATA REMOVED ---

// --- 2. COLUMNS ---
const columns = [
  {
    accessorKey: "bankName",
    header: "Bank / Institution",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${row.original.color}`}>
            {row.original.bankName?.substring(0, 2).toUpperCase()}
        </div>
        <div>
            <div className="font-medium text-slate-900">{row.original.bankName}</div>
            <div className="text-xs text-slate-500">{row.original.branch}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "accountNumber",
    header: "Account Number",
    cell: ({ row }) => {
        const copyToClipboard = () => {
            navigator.clipboard.writeText(row.getValue("accountNumber"));
            toast.success("Account number copied");
        };
        return (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={copyToClipboard}>
                <span className="font-mono text-slate-600">{row.getValue("accountNumber")}</span>
                <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        )
    },
  },
  {
    accessorKey: "accountName",
    header: "Account Name",
    cell: ({ row }) => <span className="text-sm text-slate-600">{row.getValue("accountName")}</span>,
  },
  {
    accessorKey: "balance",
    header: ({ column }) => <div className="text-right">Current Balance</div>,
    cell: ({ row }) => (
        <div className="text-right font-bold text-slate-900">
            Rs. {row.getValue("balance").toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
    ),
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
          <DropdownMenuLabel>Manage Account</DropdownMenuLabel>
          <DropdownMenuItem>
             <History className="w-4 h-4 mr-2" /> View Transactions
          </DropdownMenuItem>
          <DropdownMenuItem>
             <Pencil className="w-4 h-4 mr-2" /> Edit Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-rose-600">
             <Trash2 className="w-4 h-4 mr-2" /> Archive Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

// --- 3. ADD BANK DIALOG ---
const AddBankDialog = ({ onAccountAdded }) => {
  const [open, setOpen] = useState(false);
  const [accountType, setAccountType] = useState("Savings");

  const handleSubmit = async () => {
    // Collect form data logic here - for brevity assuming simple state or refs
    // In real implementation, use a form library or state for inputs
    // This is a simplified example to show connection
    const bankNameInput = document.getElementById('bankName');
    const branchInput = document.getElementById('branch');
    const accountNumberInput = document.getElementById('accountNumber');
    
    const accountData = {
        bankName: accountType === 'Cash' ? 'Cash Asset' : bankNameInput?.value,
        type: accountType, 
        branch: accountType === 'Cash' ? '-' : branchInput?.value,
        accountName: document.getElementById('accountName').value,
        accountNumber: accountType === 'Cash' ? 'N/A' : accountNumberInput?.value,
        balance: document.getElementById('openingBalance').value,
        color: accountType === 'Cash' ? "bg-amber-600" : "bg-emerald-600" 
    };

    try {
        await accountingService.createBankAccount(accountData);
        toast.success("Account created successfully");
        setOpen(false);
        if (onAccountAdded) onAccountAdded();
    } catch (error) {
        console.error("Error creating account:", error);
        toast.error("Failed to create account");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 gap-2">
            <PlusCircle className="w-4 h-4" /> Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
          <DialogDescription>Register a new bank account or cash asset.</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
            
            <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Savings">Savings Account</SelectItem>
                        <SelectItem value="Current">Current Account</SelectItem>
                        <SelectItem value="Cash">Cash / Petty Cash</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {accountType !== 'Cash' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input id="bankName" placeholder="e.g. Amana Bank" />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="branch">Branch</Label>
                        <Input id="branch" placeholder="e.g. Kandy" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input id="accountNumber" placeholder="000-000-0000" className="font-mono" />
                    </div>
                </>
            )}

            <div className="space-y-2">
                <Label htmlFor="accountName">Account Name / Title</Label>
                <Input id="accountName" placeholder={accountType === 'Cash' ? "e.g. Office Petty Cash" : "e.g. Building Fund A/C"} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="openingBalance">Opening Balance (LKR)</Label>
                <Input id="openingBalance" type="number" placeholder="0.00" />
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>Save Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- 4. MAIN PAGE ---
export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
        setLoading(true);
        const data = await accountingService.getBankAccounts();
        setAccounts(data);
    } catch (error) {
        console.error("Error fetching accounts:", error);
        toast.error("Failed to load accounts");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);
  
  const table = useReactTable({
    data: accounts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  });

  const totalLiquidity = accounts.reduce((sum, acc) => sum + acc.balance, 0);

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
                    <Landmark className="h-8 w-8 text-emerald-600" />
                    Bank Accounts
                </h1>
                <p className="text-slate-500">Manage mosque liquidity and bank balances.</p>
            </div>
            
            <AddBankDialog onAccountAdded={fetchAccounts} />
        </div>

        {/* BANK CARDS (Visual Overview) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((acc) => (
                <motion.div 
                    key={acc.id}
                    whileHover={{ y: -5 }}
                    className={`relative overflow-hidden rounded-xl p-6 text-white shadow-lg ${acc.color}`}
                >
                    {/* Background Pattern */}
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                        <Building2 className="w-32 h-32" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium opacity-90">{acc.bankName}</p>
                                <p className="text-xs opacity-70">{acc.branch}</p>
                            </div>
                            {acc.type === 'Cash' ? <Wallet className="w-6 h-6 opacity-80" /> : <CreditCard className="w-6 h-6 opacity-80" />}
                        </div>

                        <div className="space-y-1 mt-4">
                            <p className="text-2xl font-bold tracking-tight">
                                Rs. {acc.balance.toLocaleString()}
                            </p>
                            <p className="text-xs font-mono opacity-80 tracking-wider">
                                {acc.accountNumber}
                            </p>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center">
                            <span className="text-[10px] uppercase font-semibold opacity-75">{acc.type} Account</span>
                            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none text-[10px] h-5">
                                {acc.status}
                            </Badge>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>

        {/* TOTAL SUMMARY BAR */}
        <Card className="rounded-xl border-emerald-100 bg-emerald-50/50 shadow-sm">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-emerald-900">Total Liquidity</p>
                        <p className="text-xs text-emerald-600">Sum of all accounts</p>
                    </div>
                </div>
                <div className="text-2xl font-bold text-emerald-700">
                    Rs. {totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>
        </Card>

        {/* DATA TABLE */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
             <div className="p-4 border-b border-slate-100">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search accounts..."
                        value={(table.getColumn("bankName")?.getFilterValue()) ?? ""}
                        onChange={(event) => table.getColumn("bankName")?.setFilterValue(event.target.value)}
                        className="pl-10 bg-slate-50 border-slate-200"
                    />
                </div>
             </div>
             <DataTable table={table} columns={columns} />
        </Card>

      </motion.div>
    </div>
  );
}