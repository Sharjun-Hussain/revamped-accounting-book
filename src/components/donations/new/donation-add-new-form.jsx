"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  HandCoins,
  Save,
  Printer,
  History,
  Check,
  ChevronsUpDown,
  Search,
  Users,
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JoinedDatePicker } from "./JoinedDatePicker";
import { Badge } from "@/components/ui/badge";

// --- CONFIGURATION ---
const MOSQUE_DETAILS = {
  name: "Al-Manar Grand Mosque",
  address: "123 Main Street, Kandy",
  contact: "+94 77 123 4567",
  regNo: "Reg No: MQ/2023/885"
};

const fundTypes = [
  { id: "General", name: "General Fund", icon: HandCoins, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "Zakat", name: "Zakat Fund", icon: Users, color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "Building", name: "Building Fund", icon: HandCoins, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "Jummah", name: "Friday Collection", icon: Users, color: "bg-purple-100 text-purple-700 border-purple-200" },
];

const mockMembers = [
  { id: "M-001", name: "Abdul Rahman", phone: "0771234567" },
  { id: "M-002", name: "Mohamed Fazil", phone: "0719876543" },
];

// --- THERMAL RECEIPT COMPONENT ---
const ThermalReceipt = ({ data }) => {
  if (!data) return null;

  return (
    <div id="thermal-receipt" className="hidden print:block p-2 bg-white text-black font-mono text-sm leading-tight">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #thermal-receipt, #thermal-receipt * { visibility: visible; }
          #thermal-receipt { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 80mm;
            margin: 0;
            padding: 10px; 
          }
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
        <span>{new Date().toLocaleDateString()}</span>
        <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
      <div className="text-xs mb-2">
        <span>Ref: #{data.id.toString().slice(-6)}</span>
      </div>

      <div className="border-b border-dashed border-black my-2" />

      <div className="my-4">
        <div className="flex justify-between mb-1">
          <span className="font-bold">Donor:</span>
          <span className="text-right">{data.name}</span>
        </div>
        {data.type === 'member' && (
           <div className="flex justify-between mb-1 text-xs">
             <span>ID:</span>
             <span>{data.memberId}</span>
           </div>
        )}
        <div className="flex justify-between mb-1">
          <span>Fund:</span>
          <span>{fundTypes.find(f => f.id === data.purpose)?.name}</span>
        </div>
      </div>

      <div className="border-b-2 border-dashed border-black my-2" />

      <div className="flex justify-between items-center my-4">
        <span className="font-bold text-lg">TOTAL</span>
        <span className="font-bold text-xl">Rs. {Number(data.amount).toLocaleString()}</span>
      </div>

      <div className="border-b border-dashed border-black my-4" />

      <div className="text-center text-xs space-y-4 mt-6">
        <p>"May Allah accept your deeds."</p>
        <div className="pt-8 border-t border-black w-3/4 mx-auto">Authorized Signature</div>
      </div>
    </div>
  );
};

// --- MAIN FORM ---
const formSchema = z.object({
  donorType: z.enum(["member", "guest"]),
  memberId: z.string().optional(),
  donorName: z.string().optional(),
  amount: z.coerce.number().min(1, "Enter amount"),
  date: z.date(),
  purpose: z.string(),
  paymentMethod: z.enum(["Cash", "Bank Transfer", "Cheque"]),
  isAnonymous: z.boolean().default(false),
  autoPrint: z.boolean().default(false),
});

export default function DonationEntryWithPrint() {
  const [recentEntries, setRecentEntries] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [openMemberSearch, setOpenMemberSearch] = useState(false);
  const guestInputRef = useRef(null); 

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      donorType: "guest",
      memberId: "",
      donorName: "",
      amount: "",
      date: new Date(),
      purpose: "General",
      paymentMethod: "Cash",
      isAnonymous: false,
      autoPrint: false, 
    },
  });

  const donorType = form.watch("donorType");
  const currentPurpose = form.watch("purpose");
  const autoPrint = form.watch("autoPrint");

  const triggerPrint = (entry) => {
    setPrintData(entry);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  function onSubmit(data) {
    let displayName = "Anonymous";
    if (!data.isAnonymous) {
        if (data.donorType === "member") {
            const member = mockMembers.find(m => m.id === data.memberId);
            displayName = member ? member.name : "Unknown Member";
        } else {
            displayName = data.donorName || "Guest";
        }
    }

    const newEntry = {
      id: Date.now(),
      name: displayName,
      memberId: data.donorType === 'member' ? data.memberId : null,
      amount: data.amount,
      purpose: data.purpose,
      type: data.donorType,
      paymentMethod: data.paymentMethod,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setRecentEntries([newEntry, ...recentEntries]);
    toast.success("Saved Successfully");

    if (data.autoPrint) {
        triggerPrint(newEntry);
    }

    form.reset({
      ...data,
      amount: "",
      memberId: "",
      donorName: "",
      isAnonymous: false,
    });

    if (data.donorType === "guest") {
        setTimeout(() => guestInputRef.current?.focus(), 100);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative">
      <ThermalReceipt data={printData} />

      <div className=" grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* LEFT COLUMN: Entry Form */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* 1. START FORM CONTEXT HERE - Covers Header AND Card */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Header with Auto-Print Switch */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-2 bg-emerald-600 rounded-lg text-white">
                        <HandCoins className="w-5 h-5" />
                    </div>
                    Donation Entry
                </h2>
                <div className="flex items-center gap-2">
                    <FormField
                        control={form.control}
                        name="autoPrint"
                        render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} id="autoprint" />
                                </FormControl>
                                <FormLabel htmlFor="autoprint" className="text-xs font-medium text-slate-600 cursor-pointer flex items-center gap-1">
                                    <Printer className="w-3 h-3" /> Auto-Print
                                </FormLabel>
                            </FormItem>
                        )}
                    />
                </div>
              </div>

              {/* Main Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Fund Selector */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {fundTypes.map((type) => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => form.setValue("purpose", type.id)}
                            className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium transition-all border-2
                            ${currentPurpose === type.id 
                                ? `${type.color} border-current shadow-sm` 
                                : "bg-white text-slate-500 border-transparent hover:bg-slate-100"}`}
                        >
                            <type.icon className="w-4 h-4" />
                            {type.name}
                        </button>
                    ))}
                </div>

                <div className="p-6 space-y-6">
                    {/* Amount & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-slate-700 font-semibold">Amount (LKR)</FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl group-focus-within:text-emerald-600">Rs.</span>
                                        <Input 
                                            type="number" 
                                            placeholder="0.00" 
                                            className="pl-12 h-16 text-3xl font-bold text-slate-900 bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:bg-white transition-all" 
                                            autoFocus
                                            {...field} 
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 gap-4">
                             <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-slate-600">Method</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger className="bg-white border-slate-200 h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="Cheque">Cheque</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Donor Type Tabs */}
                    <Tabs value={donorType} onValueChange={(v) => form.setValue("donorType", v)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="guest">Guest / Outside</TabsTrigger>
                            <TabsTrigger value="member">Registered Member</TabsTrigger>
                        </TabsList>
                        
                        <div className={`p-4 rounded-xl border border-slate-100 bg-slate-50/50`}>
                            {/* Member Search */}
                            {donorType === "member" && (
                                <FormField
                                    control={form.control}
                                    name="memberId"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <Popover open={openMemberSearch} onOpenChange={setOpenMemberSearch}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                            <Button variant="outline" role="combobox" className={cn("w-full justify-between h-12 text-base bg-white", !field.value && "text-muted-foreground")}>
                                                {field.value ? mockMembers.find((m) => m.id === field.value)?.name : "Select member..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                            <CommandInput placeholder="Search member..." />
                                            <CommandList>
                                                <CommandEmpty>No member found.</CommandEmpty>
                                                <CommandGroup>
                                                {mockMembers.map((member) => (
                                                    <CommandItem value={member.name} key={member.id} onSelect={() => { form.setValue("memberId", member.id); setOpenMemberSearch(false); }}>
                                                    <Check className={cn("mr-2 h-4 w-4", member.id === field.value ? "opacity-100" : "opacity-0")} />
                                                    {member.name}
                                                    </CommandItem>
                                                ))}
                                                </CommandGroup>
                                            </CommandList>
                                            </Command>
                                        </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            )}

                            {/* Guest Inputs */}
                            {donorType === "guest" && (
                                 <FormField
                                    control={form.control}
                                    name="donorName"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormControl>
                                            <Input placeholder="Guest Name" className="bg-white h-11" {...field} ref={guestInputRef} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            
                            <FormField
                                control={form.control}
                                name="isAnonymous"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 mt-4">
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="text-sm text-slate-600 font-normal">Mark as Anonymous Donation</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </Tabs>

                    <Button type="submit" size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-md shadow-emerald-100 h-14">
                        <Save className="w-5 h-5 mr-2" /> 
                        Save & {autoPrint ? 'Print' : 'Next'}
                    </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>

        {/* RIGHT COLUMN: History */}
        <div className="space-y-4">
             <div className="flex items-center justify-between h-9">
                <h3 className="font-semibold text-slate-500 flex items-center gap-2">
                    <History className="w-4 h-4" /> Recent Activity
                </h3>
             </div>

             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 min-h-[400px]">
                {recentEntries.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-60">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                            <HandCoins className="w-6 h-6" />
                        </div>
                        <p className="text-sm">No entries this session</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                         <AnimatePresence>
                            {recentEntries.map((entry) => (
                                <motion.div 
                                    key={entry.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 rounded-lg border border-slate-100 bg-slate-50 relative overflow-hidden group hover:bg-white hover:shadow-md transition-all"
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${entry.type === 'member' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                    
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-slate-800">Rs. {entry.amount}</span>
                                        <span className="text-xs text-slate-400">{entry.time}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 truncate max-w-[120px]">{entry.name}</span>
                                        <Badge variant="outline" className="text-[10px] px-1.5 h-5 border-slate-200 text-slate-500">
                                            {fundTypes.find(f => f.id === entry.purpose)?.name || entry.purpose}
                                        </Badge>
                                    </div>

                                    {/* Actions */}
                                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-7 w-7 bg-white shadow-sm text-slate-500 hover:text-emerald-600"
                                            onClick={() => triggerPrint(entry)}
                                            title="Print Thermal Receipt"
                                        >
                                            <Printer className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                         </AnimatePresence>
                    </div>
                )}
             </div>
        </div>

      </div>
    </div>
  );
}