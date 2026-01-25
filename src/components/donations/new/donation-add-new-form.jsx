"use client";

import { useState, useRef, useEffect } from "react";
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
  UserPlus,
  PenTool,
  Loader2,
  X,
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
import { donationService } from "@/services/donationService";
import { memberService } from "@/services/memberService";
import { donorService } from "@/services/donorService";
import { DonorForm } from "@/components/donations/donor-form";

// --- CONFIGURATION ---
const DEFAULT_MOSQUE_DETAILS = {
  name: "Masjid Name",
  address: "Address Line 1",
  contact: "Contact Number",
};

const fundTypes = [
  { id: "General", name: "General Fund", icon: HandCoins, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "Zakat", name: "Zakat Fund", icon: Users, color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "Building", name: "Building Fund", icon: HandCoins, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "Jummah", name: "Friday Collection", icon: Users, color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "Custom", name: "Custom", icon: PenTool, color: "bg-slate-100 text-slate-700 border-slate-200" },
];

// ... (keep other imports)

// --- THERMAL RECEIPT COMPONENT ---
const ThermalReceipt = ({ data, settings }) => {
  if (!data) return null;

  const mosqueName = settings?.mosqueName || DEFAULT_MOSQUE_DETAILS.name;
  const address = settings?.address || DEFAULT_MOSQUE_DETAILS.address;
  const contact = settings?.phone || DEFAULT_MOSQUE_DETAILS.contact;

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
        <h1 className="font-bold text-lg uppercase">{mosqueName}</h1>
        <p className="text-xs">{address}</p>
        <p className="text-xs">{contact}</p>
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
        <div className="mt-4 pt-2 border-t border-dashed border-black/50 opacity-70">
            <p className="font-semibold">Product of Inzeedo</p>
            <p>Contact number 0785706441</p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN FORM ---
const formSchema = z.object({
  donorType: z.enum(["member", "guest"]),
  memberId: z.string().optional(),
  donorId: z.string().optional(),
  donorName: z.string().optional(),
  amount: z.coerce.number().min(1, "Enter amount"),
  date: z.date(),
  purpose: z.string(),
  customPurpose: z.string().optional(),
  paymentMethod: z.enum(["Cash", "Bank Transfer", "Cheque"]),
  isAnonymous: z.boolean().default(false),
  autoPrint: z.boolean().default(false),
  remarks: z.string().optional(),
  bankAccountId: z.string().optional(),
}).refine(data => data.purpose !== "Custom" || (data.purpose === "Custom" && data.customPurpose && data.customPurpose.trim() !== ""), {
    message: "Please enter a purpose for custom donation",
    path: ["customPurpose"],
});

export default function DonationEntryWithPrint({ initialData }) {
  const [recentEntries, setRecentEntries] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [openMemberSearch, setOpenMemberSearch] = useState(false);
  const [members, setMembers] = useState([]); // Real members state
  const [appSettings, setAppSettings] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  
  // Donor Selection State
  const [donors, setDonors] = useState([]);
  const [openDonorSearch, setOpenDonorSearch] = useState(false);
  const [isDonorFormOpen, setIsDonorFormOpen] = useState(false);
  
  const guestInputRef = useRef(null); 
  const isEditMode = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDonors, setSelectedDonors] = useState([]);

  // Initialize selectedDonors if in edit mode (though edit usually implies single entry, we can support converting to multi or just show one)
  useEffect(() => {
      if (initialData) {
          setSelectedDonors([{
              id: initialData.memberId || initialData.donorId || 'guest',
              name: initialData.donorName || (initialData.member ? initialData.member.name : 'Guest'),
              type: initialData.donorType,
              memberId: initialData.memberId,
              donorId: initialData.donorId
          }]);
      }
  }, [initialData]);

  const addDonor = (donor) => {
      if (selectedDonors.some(d => d.id === donor.id && d.type === donor.type)) {
          toast.error("Donor already added");
          return;
      }
      setSelectedDonors([...selectedDonors, donor]);
  };

  const removeDonor = (index) => {
      const newDonors = [...selectedDonors];
      newDonors.splice(index, 1);
      setSelectedDonors(newDonors);
  };

  // Fetch data on mount
  useEffect(() => {
      const fetchData = async () => {
          try {
              const [membersData, settingsData, donorsData, accountsData] = await Promise.all([
                  memberService.getAll(),
                  fetch('/api/settings/app').then(res => res.json()),
                  donorService.getAll(),
                  fetch('/api/accounting/bank-accounts').then(res => res.json())
              ]);
              setMembers(membersData);
              setAppSettings(settingsData);
              setDonors(donorsData);
              setBankAccounts(accountsData);
          } catch (error) {
              console.error("Failed to fetch data", error);
          }
      };
      fetchData();
  }, []);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      donorType: initialData?.donorType || "guest",
      memberId: initialData?.memberId || "",
      donorName: initialData?.donorName || "",
      amount: initialData?.amount || "",
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      purpose: initialData?.purpose || "General",
      customPurpose: "",
      paymentMethod: initialData?.paymentMethod || "Cash",
      isAnonymous: initialData?.isAnonymous || false,
      autoPrint: false, 
      remarks: initialData?.remarks || "",
      bankAccountId: initialData?.bankAccountId || "",
    },
  });

  const donorType = form.watch("donorType");
  const currentPurpose = form.watch("purpose");
  const autoPrint = form.watch("autoPrint");

  const handleDonorSelect = (donor) => {
    addDonor({
        id: donor.id,
        name: donor.name,
        type: 'guest', // or 'donor' if we want to distinguish
        donorId: donor.id,
        contact: donor.contact
    });
    setOpenDonorSearch(false);
    form.setValue("donorName", ""); // Clear input
  };

  const triggerPrint = (entry) => {
    setPrintData(entry);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  async function onSubmit(data) {
    if (selectedDonors.length === 0) {
        toast.error("Please select at least one donor");
        return;
    }

    setIsSubmitting(true);
    const finalPurpose = data.purpose === "Custom" ? data.customPurpose : data.purpose;

    try {
        let lastEntry;
        let successCount = 0;

        for (const donor of selectedDonors) {
            let newEntry;
            const entryData = {
                amount: data.amount,
                date: data.date,
                purpose: finalPurpose,
                paymentMethod: data.paymentMethod,
                isAnonymous: data.isAnonymous,
                donorType: donor.type,
                donorName: donor.name,
                memberId: donor.memberId,
                donorId: donor.donorId,
                remarks: data.remarks,
                bankAccountId: data.bankAccountId,
            };

            if (isEditMode && selectedDonors.length === 1) {
                // Single update if editing
                 newEntry = await donationService.update(initialData.id, entryData);
            } else {
                // Create new for each
                newEntry = await donationService.create(entryData);
            }
            
            lastEntry = newEntry;
            successCount++;
            
            // Add to recent entries for UI
             const entryForUI = {
                ...newEntry,
                name: donor.name,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: donor.type
            };
            setRecentEntries(prev => [entryForUI, ...prev]);
        }

        toast.success(`Successfully saved ${successCount} donation(s)`);

        if (data.autoPrint && lastEntry) {
            // Print the last one, or maybe we should print all? 
            // For now, let's print the last one as a confirmation or maybe loop print?
            // Looping print might be too fast for browser. 
            triggerPrint({
                ...lastEntry,
                name: lastEntry.donorName || (lastEntry.member ? lastEntry.member.name : "Guest"), // Ensure name is present
                 type: lastEntry.donorType
            });
        }

        if (!isEditMode) {
            form.reset({
                ...data,
                amount: "",
                memberId: "",
                donorName: "",
                isAnonymous: false,
                customPurpose: "",
                remarks: "",
            });
            setSelectedDonors([]);
        }

        if (data.donorType === "guest") {
            setTimeout(() => guestInputRef.current?.focus(), 100);
        }
    } catch (error) {
        console.error("Error saving donation:", error);
        toast.error("Failed to save donation");
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative">
      <ThermalReceipt data={printData} settings={appSettings} />

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
                    {isEditMode ? "Edit Donation" : "Donation Entry"}
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
                <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-2">
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
                    {/* Custom Purpose Input */}
                    {currentPurpose === "Custom" && (
                        <FormField
                            control={form.control}
                            name="customPurpose"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-semibold">Custom Purpose</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter donation purpose..." 
                                            className="bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:bg-white transition-all" 
                                            {...field} 
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

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
                                        <SelectTrigger className="bg-white border-slate-200 h-10 w-full">
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
                        <div className="grid grid-cols-1 gap-4">
                             <FormField
                                control={form.control}
                                name="bankAccountId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-slate-600">Deposit To</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger className="bg-white border-slate-200 h-10 w-full">
                                            <SelectValue placeholder="Select Account" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {bankAccounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountName} ({acc.type})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="remarks"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 font-semibold">Remarks / Notes</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Add any additional notes here..." 
                                        className="bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:bg-white transition-all" 
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="h-px bg-slate-100" />

                    {/* Selected Donors List (Chips) */}
                    <div className="space-y-2">
                        <FormLabel className="text-slate-700 font-semibold">Donors ({selectedDonors.length})</FormLabel>
                        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 rounded-lg border border-slate-100">
                            {selectedDonors.length === 0 && (
                                <span className="text-sm text-slate-400 italic p-1">No donors selected</span>
                            )}
                            {selectedDonors.map((donor, index) => (
                                <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 bg-white border border-slate-200 text-slate-700 shadow-sm">
                                    <span className="text-xs font-bold uppercase text-slate-400 mr-1">{donor.type === 'member' ? 'M' : 'G'}</span>
                                    {donor.name}
                                    <button 
                                        type="button"
                                        onClick={() => removeDonor(index)}
                                        className="ml-1 p-0.5 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

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
                                            <Button variant="outline" role="combobox" className={cn("w-full justify-between h-12 text-base bg-white", "text-muted-foreground")}>
                                                Select member to add...
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
                                                {members.map((member) => (
                                                    <CommandItem 
                                                        value={`${member.name} ${member.contact || member.phone || ''}`} 
                                                        key={member.id} 
                                                        onSelect={() => { 
                                                            addDonor({
                                                                id: member.id,
                                                                name: member.name,
                                                                type: 'member',
                                                                memberId: member.id,
                                                                contact: member.contact
                                                            });
                                                            setOpenMemberSearch(false); 
                                                        }}
                                                    >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedDonors.some(d => d.id === member.id) ? "opacity-100" : "opacity-0")} />
                                                    <div className="flex flex-col">
                                                        <span>{member.name}</span>
                                                        <span className="text-xs text-muted-foreground">{member.contact || member.phone}</span>
                                                    </div>
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
                                        <FormItem className="flex flex-col">
                                        <FormLabel>Guest Name</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input 
                                                    placeholder="Guest Name (Press Enter to Add)" 
                                                    className="bg-white h-11" 
                                                    {...field} 
                                                    ref={guestInputRef} 
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            if (field.value?.trim()) {
                                                                addDonor({
                                                                    id: `guest-${Date.now()}`,
                                                                    name: field.value.trim(),
                                                                    type: 'guest'
                                                                });
                                                                field.onChange(""); // Clear input
                                                            }
                                                        }
                                                    }}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        setOpenDonorSearch(true);
                                                    }}
                                                    onFocus={() => setOpenDonorSearch(true)}
                                                    onBlur={() => setTimeout(() => setOpenDonorSearch(false), 200)}
                                                />
                                            </FormControl>
                                            
                                            {/* Donor Search Dropdown */}
                                            {openDonorSearch && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                                    <div 
                                                        className="p-2 hover:bg-emerald-50 cursor-pointer text-emerald-600 font-medium flex items-center gap-2 border-b"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault(); // Prevent blur
                                                            setIsDonorFormOpen(true);
                                                            setOpenDonorSearch(false);
                                                        }}
                                                    >
                                                        <UserPlus className="w-4 h-4" /> Add New Donor
                                                    </div>
                                                    {donors
                                                    .filter(d => d.name.toLowerCase().includes((field.value || "").toLowerCase()))
                                                    .map(donor => (
                                                        <div
                                                        key={donor.id}
                                                        className="p-2 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault(); // Prevent blur
                                                            handleDonorSelect(donor);
                                                        }}
                                                        >
                                                        <div className="font-medium text-sm">{donor.name}</div>
                                                        {donor.contact && <div className="text-xs text-slate-500">{donor.contact}</div>}
                                                        </div>
                                                    ))}
                                                    {donors.filter(d => d.name.toLowerCase().includes((field.value || "").toLowerCase())).length === 0 && (
                                                        <div className="p-2 text-xs text-slate-400 text-center">No existing donors found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
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

                    <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-md shadow-emerald-100 h-14">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" /> 
                                {isEditMode ? 'Update Donation' : (autoPrint ? 'Save & Print' : 'Save & Next')}
                            </>
                        )}
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