"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CreditCard,
  Search,
  User,
  Check,
  ChevronsUpDown,
  Calendar,
  Wallet,
  Printer,
  Save,
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

import { memberService } from "@/services/memberService";
import { accountingService } from "@/services/accountingService";

// --- 1. MOCK DATA REMOVED ---


// --- 2. CONFIG ---
const MOSQUE_DETAILS = {
  name: "Al-Manar Grand Mosque",
  address: "123 Main Street, Kandy",
  contact: "+94 77 123 4567"
};

// --- 3. THERMAL RECEIPT ---
const SandaReceipt = ({ data }) => {
  if (!data) return null;
  return (
    <div id="sanda-receipt" className="hidden print:block p-2 bg-white text-black font-mono text-sm leading-tight">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #sanda-receipt, #sanda-receipt * { visibility: visible; }
          #sanda-receipt { position: absolute; left: 0; top: 0; width: 80mm; margin: 0; padding: 10px; }
          @page { margin: 0; size: auto; }
        }
      `}</style>
      
      <div className="text-center mb-4">
        <h1 className="font-bold text-lg uppercase">{MOSQUE_DETAILS.name}</h1>
        <p className="text-xs">{MOSQUE_DETAILS.address}</p>
        <p className="text-xs">{MOSQUE_DETAILS.contact}</p>
      </div>

      <div className="border-b-2 border-dashed border-black my-2" />

      <div className="flex justify-between text-xs mb-2">
        <span>Date: {new Date().toLocaleDateString()}</span>
        <span>Rec #: {data.receiptNo}</span>
      </div>

      <div className="border-b border-dashed border-black my-2" />

      <div className="my-4">
        <div className="flex justify-between font-bold mb-1">
          <span>Member:</span>
          <span>{data.memberName}</span>
        </div>
        <div className="flex justify-between text-xs mb-3">
          <span>ID:</span>
          <span>{data.memberId}</span>
        </div>
        
        <div className="mb-2">
          <span className="font-bold underline">Months Covered:</span>
          <ul className="text-xs mt-1 ml-2">
            {data.coveredMonths.map((m, i) => (
              <li key={i} className="flex justify-between">
                <span>{m.month}</span>
                <span>{m.paid.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-b-2 border-dashed border-black my-2" />

      <div className="flex justify-between items-center my-4">
        <span className="font-bold text-lg">TOTAL PAID</span>
        <span className="font-bold text-xl">Rs. {Number(data.totalPaid).toLocaleString()}</span>
      </div>

      <div className="text-center text-xs mt-6">
        <p>Jazakallahu Khairan</p>
        <p className="text-[10px] mt-2 opacity-70">Al-Manar System</p>
      </div>
    </div>
  );
};

// --- 4. FORM SCHEMA ---
const formSchema = z.object({
  memberId: z.string({ required_error: "Select a member" }),
  amount: z.coerce.number().min(1, "Enter amount"),
  paymentMethod: z.enum(["Cash", "Bank Transfer", "Online"]),
  bankAccountId: z.string().min(1, "Select target account"),
  autoPrint: z.boolean().default(true),
});

export default function SandaCollectionPage() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [openSearch, setOpenSearch] = useState(false);
  const [printData, setPrintData] = useState(null);
  
  // Data State
  const [members, setMembers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: "",
      amount: "",
      paymentMethod: "Cash",
      bankAccountId: "",
      autoPrint: true,
    },
  });

  // Load Initial Data
  useState(() => {
    const loadData = async () => {
      try {
        const [membersData, accountsData] = await Promise.all([
          memberService.getAll(),
          accountingService.getBankAccounts()
        ]);
        setMembers(membersData);
        setBankAccounts(accountsData);
      } catch (error) {
        console.error("Failed to load data", error);
        toast.error("Failed to load members or accounts");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const watchAmount = form.watch("amount");

  // --- SMART ALLOCATION LOGIC ---
  // Calculates which months get paid based on the entered amount
  const allocationPreview = useMemo(() => {
    if (!selectedMember || !watchAmount || !pendingInvoices.length) return [];
    
    let remainingPayment = Number(watchAmount);
    return pendingInvoices.map(bill => {
      let paidForThis = 0;
      let status = "unpaid"; // unpaid, partial, full

      if (remainingPayment > 0) {
        if (remainingPayment >= bill.balance) {
          paidForThis = bill.balance;
          remainingPayment -= bill.balance;
          status = "full";
        } else {
          paidForThis = remainingPayment;
          remainingPayment = 0;
          status = "partial";
        }
      }

      return { ...bill, paidForThis, status };
    });
  }, [selectedMember, watchAmount, pendingInvoices]);

  // Handle Member Selection
  const handleSelectMember = async (id) => {
    const member = members.find(m => m.id === id);
    if (!member) return;

    // Fetch Pending Invoices
    try {
        const invoices = await accountingService.getPendingInvoices(id);
        // Transform invoices to match UI expectation
        const formattedInvoices = invoices.map(inv => ({
            id: inv.id,
            month: inv.period || format(new Date(inv.dueDate), "MMMM yyyy"),
            amount: inv.amount,
            balance: inv.amount - inv.paidAmount,
            status: inv.status
        }));
        
        setPendingInvoices(formattedInvoices);
        
        // Calculate Arrears
        const totalArrears = formattedInvoices.reduce((sum, inv) => sum + inv.balance, 0);
        
        setSelectedMember({
            ...member,
            arrears: totalArrears,
            monthly_rate: member.amountPerCycle || 0
        });

        form.setValue("memberId", id);
        form.setValue("amount", ""); 
        setOpenSearch(false);

    } catch (error) {
        console.error("Error fetching invoices", error);
        toast.error("Could not load member invoices");
    }
  };

  // Quick Pay Actions
  const handleQuickPay = (monthsCount) => {
    if (!selectedMember || !pendingInvoices.length) return;
    let total = 0;
    // Sum up the balance of the first N unpaid months
    pendingInvoices.slice(0, monthsCount).forEach(bill => {
      total += bill.balance;
    });
    form.setValue("amount", total);
  };

  const onSubmit = async (data) => {
    // 1. Prepare Print Data
    const covered = allocationPreview.filter(a => a.paidForThis > 0).map(a => ({
        month: a.month,
        paid: a.paidForThis,
        invoiceId: a.id
    }));

    if (covered.length === 0) {
        if (pendingInvoices.length === 0) {
            toast.error("No pending invoices to pay.", { description: "Please generate invoices for this member first." });
        } else {
            toast.error("Amount does not cover any invoices.", { description: "Please enter a valid amount." });
        }
        return;
    }

    // 2. Process Payments
    try {
        for (const item of covered) {
            await accountingService.collectPayment({
                invoiceId: item.invoiceId,
                amount: item.paid,
                method: data.paymentMethod,
                bankAccountId: data.bankAccountId
            });
        }

        const receiptData = {
            receiptNo: Date.now().toString().slice(-6),
            memberName: selectedMember.name,
            memberId: selectedMember.id,
            totalPaid: data.amount,
            coveredMonths: covered
        };

        toast.success("Payment Recorded", { description: `Rs. ${data.amount} collected.` });
        
        // 3. Print
        if (data.autoPrint) {
            setPrintData(receiptData);
            setTimeout(() => window.print(), 100);
        }

        // 4. Reset
        setSelectedMember(null);
        setPendingInvoices([]);
        form.reset({ memberId: "", amount: "", paymentMethod: "Cash", bankAccountId: "", autoPrint: true });

    } catch (error) {
        console.error("Payment failed", error);
        toast.error("Failed to record payment.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
      
      {/* Hidden Receipt */}
      <SandaReceipt data={printData} />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                    Sanda Collection
                </h1>
                <p className="text-slate-500 text-sm">Collect monthly subscription payments from members.</p>
            </div>
            
            {/* Member Search Bar (Top Level) */}
            <Popover open={openSearch} onOpenChange={setOpenSearch}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-[300px] justify-between bg-white h-11 border-slate-300 shadow-sm text-slate-600">
                        {selectedMember ? selectedMember.name : "Find Member (ID or Name)..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                    <CommandInput placeholder="Search member..." />
                    <CommandList>
                        <CommandEmpty>No member found.</CommandEmpty>
                        <CommandGroup heading="Results">
                        {members.map((member) => (
                            <CommandItem key={member.id} value={member.name} onSelect={() => handleSelectMember(member.id)}>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700">{member.name.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span>{member.name}</span>
                                    <span className="text-xs text-slate-400">{member.id.slice(-6).toUpperCase()}</span>
                                </div>
                            </div>
                            {selectedMember?.id === member.id && <Check className="ml-auto h-4 w-4 opacity-100" />}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: Payment Entry */}
            <div className="lg:col-span-2 space-y-6">
                <AnimatePresence mode="wait">
                    {!selectedMember ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-white/50"
                        >
                            <Search className="w-10 h-10 mb-2 opacity-20" />
                            <p>Select a member to begin collection</p>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            
                            {/* Member Card */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <User className="w-24 h-24 text-emerald-600" />
                                </div>
                                <div className="flex items-start gap-4 relative z-10">
                                    <Avatar className="w-16 h-16 border-2 border-white shadow-md">
                                        <AvatarFallback className="bg-emerald-600 text-white text-xl">{selectedMember.name.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{selectedMember.name}</h2>
                                        <p className="text-sm text-slate-500 flex items-center gap-2">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{selectedMember.id.slice(-6).toUpperCase()}</span>
                                            <span>• {selectedMember.contact}</span>
                                        </p>
                                        <div className="mt-3 flex gap-3">
                                            <Badge variant={selectedMember.arrears > 0 ? "destructive" : "default"} className="px-3 py-1 text-sm font-normal">
                                                {selectedMember.arrears > 0 ? `Arrears: Rs. ${selectedMember.arrears}` : "Up to Date"}
                                            </Badge>
                                            <Badge variant="outline" className="text-slate-600 font-normal">
                                                Rate: Rs. {selectedMember.monthly_rate}/mo
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Form */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        
                                        {/* Quick Actions */}
                                        {selectedMember.arrears > 0 && (
                                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                                <Button type="button" size="sm" variant="outline" onClick={() => handleQuickPay(1)} className="text-xs bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100">
                                                    Pay 1 Month ({selectedMember.monthly_rate})
                                                </Button>
                                                <Button type="button" size="sm" variant="outline" onClick={() => handleQuickPay(3)} className="text-xs bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100">
                                                    Pay 3 Months
                                                </Button>
                                                <Button type="button" size="sm" variant="outline" onClick={() => handleQuickPay(100)} className="text-xs bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100">
                                                    Clear All ({selectedMember.arrears})
                                                </Button>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="amount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-slate-700 font-bold">Paying Amount (LKR)</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Rs.</span>
                                                                <Input 
                                                                    type="number" 
                                                                    className="pl-12 h-14 text-2xl font-bold bg-slate-50 border-slate-200 focus:ring-emerald-500" 
                                                                    placeholder="0.00" 
                                                                    {...field} 
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="paymentMethod"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-slate-600">Method</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-14 bg-white border-slate-200">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Cash">Cash Payment</SelectItem>
                                                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                                <SelectItem value="Online">Online</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            
                                            <FormField
                                                control={form.control}
                                                name="bankAccountId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-slate-600">Deposit To</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-14 bg-white border-slate-200">
                                                                    <SelectValue placeholder="Select Account" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {bankAccounts.map(acc => (
                                                                    <SelectItem key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountName} ({acc.type})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between">
                                             <FormField
                                                control={form.control}
                                                name="autoPrint"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                        <FormLabel className="font-normal text-slate-600 flex items-center gap-2">
                                                            <Printer className="w-4 h-4" /> Auto-Print Receipt
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />

                                            <Button type="submit" size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px] shadow-lg shadow-emerald-200">
                                                <Save className="w-5 h-5 mr-2" /> Collect Payment
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* RIGHT: Visual Ledger (Smart Card) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Wallet className="w-5 h-5" />
                    <span>Allocations Preview</span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 min-h-[400px] relative overflow-hidden">
                    {!selectedMember ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                            <Calendar className="w-12 h-12 mb-2" />
                            <p className="text-sm text-center">Select a member to view<br/>outstanding bills</p>
                        </div>
                    ) : pendingInvoices.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                            <CheckCircle2 className="w-12 h-12 mb-2 text-emerald-500" />
                            <p className="text-sm text-center font-medium text-emerald-600">No Pending Invoices</p>
                            <p className="text-xs text-center">This member has no outstanding dues.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                             {/* Header Row */}
                             <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                                <span>Month</span>
                                <span>Balance</span>
                                <span>Paying</span>
                             </div>

                             {/* Unpaid Months List */}
                             <div className="space-y-2">
                                {allocationPreview.length === 0 && (
                                    <div className="text-center py-8 text-emerald-600 bg-emerald-50 rounded-lg">
                                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                                        <p className="font-medium">All Caught Up!</p>
                                        <p className="text-xs">No outstanding dues.</p>
                                    </div>
                                )}

                                {allocationPreview.map((bill) => (
                                    <motion.div 
                                        key={bill.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border transition-all",
                                            bill.status === "full" ? "bg-emerald-50 border-emerald-200" :
                                            bill.status === "partial" ? "bg-amber-50 border-amber-200" :
                                            "bg-white border-slate-100"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {bill.status === "full" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> :
                                             bill.status === "partial" ? <AlertCircle className="w-5 h-5 text-amber-500" /> :
                                             <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
                                            
                                            <div>
                                                <p className={cn("text-sm font-medium", bill.status === "full" ? "text-emerald-900" : "text-slate-700")}>
                                                    {bill.month}
                                                </p>
                                                <p className="text-xs text-slate-400">Due: {bill.balance}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            {bill.paidForThis > 0 && (
                                                <span className={cn("block font-bold", bill.status === "full" ? "text-emerald-600" : "text-amber-600")}>
                                                    + {bill.paidForThis}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                             </div>

                             {/* Advance Payment Logic (If paying more than arrears) */}
                             {Number(watchAmount) > selectedMember.arrears && (
                                 <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center text-blue-700">
                                     <span className="text-sm font-medium">Excess (Advance)</span>
                                     <span className="font-bold">+ {Number(watchAmount) - selectedMember.arrears}</span>
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}