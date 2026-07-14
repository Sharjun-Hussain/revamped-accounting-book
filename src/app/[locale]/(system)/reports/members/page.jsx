"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/api";
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
  MapPin,
  Loader2
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

// Import PDF Generator and Services
import { memberService } from "@/services/memberService";
import { generateFinancialPDF } from "@/lib/report-generator";

// --- REMOVED MOCK DATA - NOW USING REAL API ---

export default function MemberStatementPage() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [open, setOpen] = useState(false);

  // Data Fetching with SWR
  const { data: members = [], isLoading: loading } = useSWR('/members', apiFetcher);
  const { data: appSettings } = useSWR('/settings/app', apiFetcher);

  
  // Conditional Fetching for individual statement
  const statementKey = selectedMember ? `/members/${selectedMember.id}/statement` : null;
  const { data: statementResponse, isLoading: loadingStatement, error: statementError } = useSWR(statementKey, apiFetcher);

  // Derived Financial Data
  const financialData = statementResponse?.financial || null;
  const error = statementError ? 'Failed to load member statement. Please try again.' : null;

  // --- HANDLER: SELECT MEMBER ---
  const handleSelect = (member) => {
    setSelectedMember(member);
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
            { label: "Total Billed", value: `Rs. ${financialData.totalBilled.toLocaleString()}`, isBold: false },
            { label: "Total Paid", value: `(Rs. ${financialData.totalPaid.toLocaleString()})`, isBold: false },
            { label: "CLOSING BALANCE", value: `Rs. ${financialData.balance.toLocaleString()}`, isBold: true }
        ],
        settings: appSettings
    });
  };

  // --- HANDLER: COLLECT SANDA ---
  const handleCollectSanda = () => {
    if (!selectedMember) return;
    // Open billing create page in new tab with member pre-selected
    window.open(`/billing/create?memberId=${selectedMember.id}`, '_blank');
  };

  // --- HANDLER: DOWNLOAD CSV ---
  const handleDownloadCSV = () => {
    if (!selectedMember || !financialData) return;

    // Prepare CSV data
    const csvHeaders = ['Date', 'Type', 'Reference', 'Description', 'Debit', 'Credit'];
    const csvRows = financialData.transactions.map(tx => [
      tx.date,
      tx.type,
      tx.ref,
      tx.desc,
      tx.debit || 0,
      tx.credit || 0
    ]);

    // Add summary rows
    csvRows.push([]);
    csvRows.push(['Summary', '', '', '', '', '']);
    csvRows.push(['Total Billed', '', '', '', financialData.totalBilled, '']);
    csvRows.push(['Total Paid', '', '', '', '', financialData.totalPaid]);
    csvRows.push(['Outstanding Balance', '', '', '', financialData.balance, '']);

    // Convert to CSV string
    const csvContent = [
      [`Member Statement - ${selectedMember.name} (${selectedMember.id})`],
      [`Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`],
      [],
      csvHeaders,
      ...csvRows
    ].map(row => row.join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `statement_${selectedMember.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-4 max-w-7xl mx-auto">
        
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
                                {loading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                    </div>
                                ) : (
                                    members.map((member) => (
                                        <CommandItem key={member.id} value={member.name} onSelect={() => handleSelect(member)}>
                                            <Check className={cn("mr-2 h-4 w-4", selectedMember?.id === member.id ? "opacity-100" : "opacity-0")} />
                                            <div className="flex flex-col">
                                                <span>{member.name}</span>
                                                <span className="text-xs text-slate-400">{member.id.substring(0, 8)}</span>
                                            </div>
                                        </CommandItem>
                                    ))
                                )}
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
            ) : loadingStatement ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-96 flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mb-2" />
                    <p className="text-slate-500 font-medium">Loading statement...</p>
                </motion.div>
            ) : financialData ? (
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
                                        <Badge variant="outline" className="font-mono text-xs">{selectedMember.id.substring(0, 12)}</Badge>
                                        <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {selectedMember.contact}</span>
                                    </p>
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {selectedMember.address || 'N/A'}
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
                                    <span className="font-medium">Rs. {financialData.monthlyRate.toLocaleString()}</span>
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
                                                {financialData.transactions && financialData.transactions.length > 0 ? (
                                                    financialData.transactions.map((tx, i) => (
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
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                                                            No transactions found
                                                        </TableCell>
                                                    </TableRow>
                                                )}
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
                                                {financialData.outstanding && financialData.outstanding.length > 0 ? (
                                                    financialData.outstanding.map((item, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell className="font-medium text-slate-700">{item.month}</TableCell>
                                                            <TableCell className="text-right text-rose-600 font-bold">Rs. {item.amount.toLocaleString()}</TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={2} className="text-center text-slate-400 py-8">
                                                            No outstanding arrears
                                                        </TableCell>
                                                    </TableRow>
                                                )}
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
                                    <Button onClick={handleCollectSanda} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 justify-start">
                                        <CreditCard className="w-4 h-4 mr-2" /> Collect Sanda
                                    </Button>
                                    <Button onClick={handleDownloadCSV} variant="outline" className="w-full justify-start bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                                        <Download className="w-4 h-4 mr-2" /> Download History (CSV)
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-slate-700 uppercase">Contact Info</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-slate-600 space-y-2">
                                    <p><strong>Phone:</strong> {selectedMember.contact}</p>
                                    <p><strong>Address:</strong> {selectedMember.address || 'N/A'}</p>
                                    <Separator className="my-2" />
                                    <p className="text-xs text-slate-400">Joined: {format(new Date(selectedMember.startDate), "MMM dd, yyyy")}</p>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-rose-200 rounded-xl bg-rose-50/50">
                    <AlertCircle className="h-12 w-12 text-rose-300 mb-2" />
                    <p className="text-rose-500 font-medium">Failed to load statement</p>
                    {error && <p className="text-sm text-rose-400 mt-1">{error}</p>}
                </motion.div>
            )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}