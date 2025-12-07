"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Search,
  FileText,
  Printer,
  History,
  AlertCircle,
  CreditCard,
  Check,
  ChevronsUpDown,
  Download,
  Phone,
  MapPin
} from "lucide-react";
import { format } from "date-fns";

// UI Imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Import PDF Generator
import { generateFinancialPDF } from "@/lib/report-generator";

// --- 1. MOCK DATA ---
const mockMembers = [
  { id: "M-001", name: "Abdul Rahman", phone: "0771234567", address: "12 Mosque Rd, Kandy", status: "Active", joined: "2022-01-01" },
  { id: "M-002", name: "Mohamed Fazil", phone: "0719876543", address: "45 Main St, Colombo", status: "Active", joined: "2023-05-15" },
  { id: "M-003", name: "Yusuf Khan", phone: "0755551234", address: "88 Hill Top, Kandy", status: "Arrears", joined: "2021-11-20" },
];

const memberFinancials = {
    "M-001": {
        balance: 2000,
        monthlyRate: 1000,
        totalPaid: 45000,
        lastPayment: "2025-12-05",
        transactions: [
            { date: "2025-12-05", type: "Payment", ref: "REC-88502", desc: "Sanda: Oct, Nov", debit: 0, credit: 2000 },
            { date: "2025-12-01", type: "Bill", ref: "INV-DEC-01", desc: "Monthly Sanda (Dec)", debit: 1000, credit: 0 },
            { date: "2025-11-01", type: "Bill", ref: "INV-NOV-01", desc: "Monthly Sanda (Nov)", debit: 1000, credit: 0 },
            { date: "2025-10-01", type: "Bill", ref: "INV-OCT-01", desc: "Monthly Sanda (Oct)", debit: 1000, credit: 0 },
            { date: "2025-09-15", type: "Payment", ref: "REC-88400", desc: "Sanda: Sep", debit: 0, credit: 1000 },
        ],
        outstanding: [
            { month: "December 2025", amount: 1000 },
            { month: "January 2026", amount: 1000 }, // Advance bill example or error
        ]
    }
};

export default function MemberStatementPage() {
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [financialData, setFinancialData] = useState(null);

  // --- HANDLER: SELECT MEMBER ---
  const handleSelect = (member) => {
    setSelectedMember(member);
    setFinancialData(memberFinancials["M-001"]); // Simulating fetch. In real app, fetch by member.id
    setOpen(false);
  };

  // --- HANDLER: PRINT STATEMENT ---
  const handlePrintStatement = () => {
    if (!selectedMember || !financialData) return;

    // 1. Prepare Table Data (Debit/Credit/Balance)
    let runningBalance = 0;
    const tableRows = financialData.transactions.map((tx) => {
        runningBalance += (tx.debit - tx.credit);
        return [
            tx.date,
            tx.ref,
            tx.desc,
            tx.debit > 0 ? tx.debit.toLocaleString() : "-",
            tx.credit > 0 ? tx.credit.toLocaleString() : "-",
            runningBalance.toLocaleString()
        ];
    });

    // 2. Generate PDF
    generateFinancialPDF({
        title: "Statement of Account",
        period: `As of ${format(new Date(), "MMM dd, yyyy")}`,
        tables: [
            {
                title: `Member: ${selectedMember.name} (${selectedMember.id})`,
                headers: ["Date", "Ref", "Description", "Debit", "Credit", "Balance"],
                data: tableRows,
                color: "#0f172a" // Slate Header
            }
        ],
        summary: [
            { label: "Total Billed", value: "Rs. 3,000", isBold: false }, // Mock logic
            { label: "Total Paid", value: "(Rs. 3,000)", isBold: false },
            { label: "CLOSING BALANCE", value: `Rs. ${financialData.balance.toLocaleString()}`, isBold: true }
        ]
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto">
        
        {/* HEADER & SEARCH */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <FileText className="h-8 w-8 text-emerald-600" />
                    Member Statement
                </h1>
                <p className="text-slate-500">View individual financial history and generate reports.</p>
            </div>
            
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-[300px] justify-between bg-white border-slate-300 h-11">
                        {selectedMember ? selectedMember.name : "Search member..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Search name or ID..." />
                        <CommandList>
                            <CommandEmpty>No member found.</CommandEmpty>
                            <CommandGroup>
                                {mockMembers.map((member) => (
                                    <CommandItem key={member.id} value={member.name} onSelect={() => handleSelect(member)}>
                                        <Check className={cn("mr-2 h-4 w-4", selectedMember?.id === member.id ? "opacity-100" : "opacity-0")} />
                                        <div className="flex flex-col">
                                            <span>{member.name}</span>
                                            <span className="text-xs text-slate-400">{member.id}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>

        {/* --- CONTENT AREA --- */}
        <AnimatePresence mode="wait">
            {!selectedMember ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Search className="h-12 w-12 text-slate-300 mb-2" />
                    <p className="text-slate-500 font-medium">Select a member to view their statement</p>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    
                    {/* 1. MEMBER PROFILE CARD */}
                    <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                            {/* Profile Info */}
                            <div className="p-6 flex-1 flex items-start gap-4 border-b md:border-b-0 md:border-r border-slate-100">
                                <Avatar className="h-16 w-16 border-2 border-emerald-100">
                                    <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xl font-bold">
                                        {selectedMember.name.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-slate-900">{selectedMember.name}</h2>
                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{selectedMember.status}</Badge>
                                    </div>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono text-xs">{selectedMember.id}</Badge>
                                        <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {selectedMember.phone}</span>
                                    </p>
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {selectedMember.address}
                                    </p>
                                </div>
                            </div>

                            {/* Financial Summary Stats */}
                            <div className="p-6 w-full md:w-auto min-w-[300px] bg-slate-50/50 flex flex-col justify-center space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500 font-medium">Outstanding Due</span>
                                    <span className={`text-lg font-bold ${financialData.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                        Rs. {financialData.balance.toLocaleString()}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Monthly Sanda</span>
                                    <span className="font-medium">Rs. {financialData.monthlyRate}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Last Payment</span>
                                    <span className="font-medium">{financialData.lastPayment}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 2. TABS & DATA */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* LEFT: Transaction History */}
                        <div className="lg:col-span-2 space-y-4">
                            <Tabs defaultValue="history" className="w-full">
                                <div className="flex items-center justify-between mb-4">
                                    <TabsList className="bg-white border border-slate-200">
                                        <TabsTrigger value="history"><History className="w-4 h-4 mr-2" /> Ledger History</TabsTrigger>
                                        <TabsTrigger value="arrears"><AlertCircle className="w-4 h-4 mr-2" /> Arrears</TabsTrigger>
                                    </TabsList>
                                    
                                    <Button onClick={handlePrintStatement} variant="outline" className="bg-white text-slate-700 shadow-sm">
                                        <Printer className="w-4 h-4 mr-2" /> Print Statement
                                    </Button>
                                </div>

                                <TabsContent value="history">
                                    <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead className="w-[100px]">Date</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead>Ref</TableHead>
                                                    <TableHead className="text-right text-emerald-700">Paid (Cr)</TableHead>
                                                    <TableHead className="text-right text-rose-700">Billed (Dr)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {financialData.transactions.map((tx, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="text-xs text-slate-500">{tx.date}</TableCell>
                                                        <TableCell className="font-medium text-slate-700">{tx.desc}</TableCell>
                                                        <TableCell className="text-xs font-mono text-slate-400">{tx.ref}</TableCell>
                                                        <TableCell className="text-right font-medium text-emerald-600">
                                                            {tx.credit > 0 ? `+${tx.credit.toLocaleString()}` : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-rose-600">
                                                            {tx.debit > 0 ? tx.debit.toLocaleString() : "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="arrears">
                                    <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
                                        <CardHeader className="pb-3 border-b border-slate-100">
                                            <CardTitle className="text-base text-rose-600 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" /> Unpaid Months
                                            </CardTitle>
                                        </CardHeader>
                                        <Table>
                                            <TableHeader className="bg-rose-50/50">
                                                <TableRow>
                                                    <TableHead>Month</TableHead>
                                                    <TableHead className="text-right">Amount Due</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {financialData.outstanding.map((item, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-medium text-slate-700">{item.month}</TableCell>
                                                        <TableCell className="text-right text-rose-600 font-bold">{item.amount.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* RIGHT: Actions */}
                        <div className="space-y-4">
                            <Card className="rounded-xl border-emerald-200 bg-emerald-50 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-emerald-800 uppercase">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 justify-start">
                                        <CreditCard className="w-4 h-4 mr-2" /> Collect Sanda
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                                        <Download className="w-4 h-4 mr-2" /> Download History (CSV)
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-slate-700 uppercase">Contact Info</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-slate-600 space-y-2">
                                    <p><strong>Phone:</strong> {selectedMember.phone}</p>
                                    <p><strong>Address:</strong> {selectedMember.address}</p>
                                    <Separator className="my-2" />
                                    <p className="text-xs text-slate-400">Joined: {format(new Date(selectedMember.joined), "MMM dd, yyyy")}</p>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}