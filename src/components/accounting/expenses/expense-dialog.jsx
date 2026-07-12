"use client";

import { useState, useEffect, useRef } from "react";
import {
  Receipt,
  Banknote,
  Calendar as CalendarIcon,
  Tag,
  User,
  Wallet,
  UploadCloud,
  FileText,
  X,
  Loader2,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { accountingService } from "@/services/accountingService";
import useSWR from "swr";
import { apiFetcher } from "@/lib/api";

export const ExpenseDialog = ({ onSuccess, categories, bankAccounts, expenseToEdit, open, setOpen }) => {
  const { data: donors = [] } = useSWR("/donors", apiFetcher);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- Form State ---
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    category: "",
    payee: "",
    description: "",
    bankAccountId: "",
    isSponsored: false,
    donorName: ""
  });
  
  // --- File State ---
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize form when editing
  useEffect(() => {
      if (expenseToEdit) {
          setFormData({
              amount: expenseToEdit.amount,
              date: new Date(expenseToEdit.date).toISOString().split('T')[0],
              category: expenseToEdit.categoryId,
              payee: expenseToEdit.payee || "",
              description: expenseToEdit.description || "",
              bankAccountId: "",
              isSponsored: false, // You don't usually edit the sponsorship status
              donorName: "" 
          });
      } else {
          // Reset for add mode
          setFormData({ amount: "", date: new Date().toISOString().split('T')[0], category: "", payee: "", description: "", bankAccountId: "", isSponsored: false, donorName: "" });
      }
      setSelectedFile(null);
  }, [expenseToEdit, open]);

  // Handle Text Inputs
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // Handle Select Input
  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleToggleSponsor = (checked) => {
    setFormData(prev => ({ ...prev, isSponsored: checked }));
  };

  // --- File Upload Logic ---
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB Limit
        toast.error("File is too large. Max 5MB allowed.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = (e) => {
    e.stopPropagation(); // Prevent opening file dialog
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // --- API SUBMISSION LOGIC ---
  const handleSave = async () => {
    // 1. Basic Validation
    if (!formData.amount || !formData.payee || !formData.category) {
        toast.error("Please fill in Amount, Payee and Category");
        return;
    }

    if (formData.isSponsored && !formData.donorName) {
        toast.error("Please provide the name of the Sponsor.");
        return;
    }

    setIsSubmitting(true);

    try {
        const data = new FormData();
        if (expenseToEdit) {
            data.append('id', expenseToEdit.id);
        }
        data.append('amount', formData.amount);
        data.append('date', formData.date);
        data.append('categoryId', formData.category);
        data.append('payee', formData.payee);
        data.append('description', formData.description);
        data.append('bankAccountId', formData.bankAccountId);
        
        if (formData.isSponsored) {
            data.append('isSponsored', 'true');
            data.append('donorName', formData.donorName);
        }
        
        if (selectedFile) {
            data.append('file', selectedFile);
        }

        if (expenseToEdit) {
            await accountingService.updateExpense(data);
            toast.success("Expense Updated");
        } else {
            await accountingService.createExpense(data);
            toast.success("Expense Saved");
        }

        setOpen(false);
        setIsSubmitting(false);
        // Reset Form
        setFormData({ amount: "", date: new Date().toISOString().split('T')[0], category: "", payee: "", description: "", bankAccountId: "", isSponsored: false, donorName: "" });
        setSelectedFile(null);
        if (onSuccess) onSuccess();

    } catch (error) {
        console.error("Upload Error:", error);
        toast.error("Failed to save expense. Please try again.");
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white">
          <DialogTitle className="flex items-center gap-2 text-xl">
             <div className="p-2 bg-emerald-100 rounded-lg">
                <Receipt className="w-5 h-5 text-emerald-600" />
             </div>
             {expenseToEdit ? "Edit Expense" : "Record New Expense"}
          </DialogTitle>
          <DialogDescription>
            Enter the payment details below.
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh]">
            <div className="grid gap-6">
                
                {/* Row 1: Amount & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-slate-600 flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5" /> Amount (LKR) *
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs.</span>
                            <Input 
                                id="amount"
                                type="number" 
                                value={formData.amount}
                                onChange={handleInputChange}
                                className="pl-10 h-11 font-bold text-lg bg-slate-50 border-slate-200 focus:bg-white transition-colors" 
                                placeholder="0.00" 
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-slate-600 flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5" /> Date
                        </Label>
                        <Input 
                            id="date"
                            type="date" 
                            value={formData.date}
                            onChange={handleInputChange}
                            className="h-11 bg-slate-50 border-slate-200" 
                        />
                    </div>
                </div>

                {/* Row 2: Category & Payee */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-slate-600 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Category
                        </Label>
                        <Select value={formData.category} onValueChange={handleCategoryChange}>
                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200 w-full">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="payee" className="text-slate-600 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Payee / Vendor *
                        </Label>
                        <Input 
                            id="payee"
                            value={formData.payee}
                            onChange={handleInputChange}
                            placeholder="e.g. CEB, Hardware Shop" 
                            className="h-11 bg-slate-50 border-slate-200" 
                        />
                    </div>
                </div>

                {/* Row 3: Paid From (Bank/Cash) */}
                <div className="space-y-2">
                    <Label className="text-slate-600 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5" /> Paid From (Optional)
                    </Label>
                    <Select value={formData.bankAccountId} onValueChange={(val) => setFormData(prev => ({ ...prev, bankAccountId: val }))}>
                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Select Account (e.g. Petty Cash)" />
                        </SelectTrigger>
                        <SelectContent>
                            {bankAccounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>
                                    {acc.bankName} - {acc.accountName} ({acc.type}) - Rs. {acc.balance.toLocaleString()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-400">Select an account to automatically deduct this amount.</p>
                </div>

                {/* Row 3: Description */}
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-600">Description</Label>
                    <Textarea 
                        id="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Additional details about this expense..." 
                        className="min-h-[80px] bg-slate-50 border-slate-200 resize-none" 
                    />
                </div>

                {/* Row 4: Sponsored Bill Options */}
                {!expenseToEdit && (
                    <div className="space-y-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-emerald-900 flex items-center gap-1.5 text-base">
                                    <Heart className="w-4 h-4 text-emerald-600" />
                                    Sponsored Bill
                                </Label>
                                <p className="text-xs text-emerald-700/80">Turn this on if a donor is directly paying this bill.</p>
                            </div>
                            <Switch checked={formData.isSponsored} onCheckedChange={handleToggleSponsor} />
                        </div>
                        
                        {formData.isSponsored && (
                            <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <Label htmlFor="donorName" className="text-emerald-800 text-sm mb-1.5 block">Sponsor Name</Label>
                                <Input 
                                    id="donorName"
                                    list="donors-list"
                                    value={formData.donorName}
                                    onChange={handleInputChange}
                                    placeholder="Select existing or type new name..."
                                    className="bg-white border-emerald-200 focus-visible:ring-emerald-500"
                                />
                                <datalist id="donors-list">
                                    {donors.map(donor => (
                                        <option key={donor.id} value={donor.name} />
                                    ))}
                                </datalist>
                                <p className="text-[10px] text-emerald-600 mt-1.5">
                                    A donation record will automatically be created to balance this expense. 
                                    If the name isn't found, a new donor profile will be auto-created.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Row 5: File Upload (WORKABLE) */}
                <div className="space-y-2">
                    <Label className="text-slate-600">Attach Receipt / Invoice</Label>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                        className="hidden" 
                    />

                    {!selectedFile && !expenseToEdit?.receiptUrl ? (
                        <div 
                            onClick={triggerFileInput}
                            className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-emerald-200 hover:text-emerald-500 transition-all cursor-pointer group"
                        >
                            <div className="p-3 bg-slate-50 rounded-full mb-2 group-hover:bg-emerald-50 transition-colors">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium">Click to upload or drag and drop</span>
                            <span className="text-[10px] opacity-70 mt-1">PDF, JPG, PNG (Max 5MB)</span>
                        </div>
                    ) : (
                        <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-emerald-100 text-emerald-600">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-emerald-900 truncate max-w-[200px]">
                                        {selectedFile ? selectedFile.name : "Current Receipt"}
                                    </span>
                                    <span className="text-[10px] text-emerald-600">
                                        {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : (
                                            <a href={expenseToEdit.receiptUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-800">
                                                View Existing File
                                            </a>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!selectedFile && (
                                     <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={triggerFileInput}
                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 h-8 text-xs"
                                    >
                                        Replace
                                    </Button>
                                )}
                                {selectedFile && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={removeFile}
                                        className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50 sm:justify-between items-center">
            <div className="text-xs text-slate-400 hidden sm:block">
                Fields marked with * are required
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 sm:flex-none">Cancel</Button>
                <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none min-w-[120px]" 
                    onClick={handleSave}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                        </>
                    ) : (
                        expenseToEdit ? "Update Expense" : "Save Expense"
                    )}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
