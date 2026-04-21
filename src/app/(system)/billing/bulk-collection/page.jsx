"use client";

import React, { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { apiFetcher } from "@/lib/api";
import { format, addMonths, subMonths, eachMonthOfInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Search, Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, User, Phone, Mail, MapPin, Calendar, CreditCard, Printer, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

// --- BULK RECEIPT COMPONENT ---
const BulkPrintReceipts = ({ receipts, settings }) => {
    if (!receipts || receipts.length === 0) return null;

    // Grouping logic: Consolidate by memberId
    const consolidatedReceipts = useMemo(() => {
        const groups = {};
        receipts.forEach(r => {
            if (!groups[r.memberId]) {
                groups[r.memberId] = {
                    memberName: r.memberName,
                    memberId: r.memberId,
                    periods: [],
                    totalAmount: 0,
                    receiptNo: r.receiptNo // Use first receipt ID as reference
                };
            }
            groups[r.memberId].periods.push(r.period);
            groups[r.memberId].totalAmount += Number(r.amount);
        });
        return Object.values(groups);
    }, [receipts]);

    const mosqueName = settings?.mosqueName || "Masjid Name";
    const address = settings?.address || "Address Line 1";
    const contact = settings?.phone || "Contact Number";

    return (
        <div id="bulk-print-container" className="hidden print:block">
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #bulk-print-container, #bulk-print-container * { visibility: visible; }
                    #bulk-print-container { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                    }
                    .receipt-page {
                        width: 80mm;
                        padding: 10px;
                        margin-bottom: 20px;
                        page-break-after: always;
                        break-after: always;
                        background: white;
                        color: black;
                    }
                    @page { margin: 0; size: auto; }
                }
            `}</style>

            {consolidatedReceipts.map((data, index) => (
                <div key={index} className="receipt-page font-mono text-sm leading-tight text-black">
                    <div className="text-center mb-4">
                        <h1 className="font-bold text-lg uppercase">{mosqueName}</h1>
                        <p className="text-[10px] uppercase">{address}</p>
                        <p className="text-[10px]">{contact}</p>
                    </div>

                    <div className="border-b-2 border-dashed border-black my-2" />

                    <div className="flex justify-between text-[10px] mb-2">
                        <span>Date: {new Date().toLocaleDateString()}</span>
                        <span>Ref: {data.receiptNo.toString().slice(-8).toUpperCase()}</span>
                    </div>

                    <div className="border-b border-dashed border-black my-2" />

                    <div className="my-4">
                        <div className="flex justify-between font-bold mb-1">
                            <span className="text-xs uppercase">Member:</span>
                            <span className="text-base">{data.memberName}</span>
                        </div>
                        <div className="flex justify-between text-[10px] mb-4">
                            <span>ID:</span>
                            <span>{data.memberId}</span>
                        </div>
                        
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Periods Covered:</span>
                            <div className="flex flex-wrap gap-x-2 text-xs font-bold bg-slate-50 p-2 rounded border border-slate-200">
                                {data.periods.sort().map((p, i) => (
                                    <span key={p}>{p}{i < data.periods.length - 1 ? ',' : ''}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t-2 border-b-2 border-black py-4 my-4">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-base uppercase">Total Received</span>
                            <span className="font-black text-xl">Rs. {data.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="text-center text-[10px] mt-6">
                        <p className="font-bold tracking-widest uppercase mb-2">--- jazakallahu khairan ---</p>
                        <div className="mt-4 pt-4 border-t border-dashed border-black/20 opacity-60">
                            <p className="font-bold">Official Receipt - IVTC Campus</p>
                            <p>Software by Inzeedo | 0785706441</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function BulkCollectionPage() {
    // Default range: Current month - 5 to Current month + 6
    const [startMonth, setStartMonth] = useState(format(subMonths(new Date(), 5), 'yyyy-MM'));
    const [endMonth, setEndMonth] = useState(format(addMonths(new Date(), 6), 'yyyy-MM'));
    
    // Data Fetching with SWR
    const { data: members = [], isLoading: loading } = useSWR(`/sanda/bulk-status?startMonth=${startMonth}&endMonth=${endMonth}`, apiFetcher);
    const { data: appSettings } = useSWR('/settings/app', apiFetcher);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPayments, setSelectedPayments] = useState({}); // { memberId_month: true }
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    // Print State
    const [printReceipts, setPrintReceipts] = useState([]);
    const [isPrintConfirmOpen, setIsPrintConfirmOpen] = useState(false);
    
    // Maximise View State
    const [isMaximised, setIsMaximised] = useState(false);

    const refreshData = () => {
        mutate(`/sanda/bulk-status?startMonth=${startMonth}&endMonth=${endMonth}`);
    };

    // Member Details Modal State
    const [selectedMember, setSelectedMember] = useState(null);
    const [isMemberDetailsOpen, setIsMemberDetailsOpen] = useState(false);



    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.contact.includes(searchTerm)
    );

    // Generate months for columns
    const months = eachMonthOfInterval({
        start: parseISO(startMonth + '-01'),
        end: parseISO(endMonth + '-01')
    }).map(d => format(d, 'yyyy-MM'));

    const toggleSelection = (memberId, month, currentStatus) => {
        if (currentStatus === 'paid') return;

        const key = `${memberId}_${month}`;
        setSelectedPayments(prev => {
            const newSelected = { ...prev };
            if (newSelected[key]) {
                delete newSelected[key];
            } else {
                newSelected[key] = true;
            }
            return newSelected;
        });
    };

    const handleMemberClick = (member) => {
        setSelectedMember(member);
        setIsMemberDetailsOpen(true);
    };

    const handleSelectColumn = (month) => {
        const newSelected = { ...selectedPayments };
        let allSelected = true;

        filteredMembers.forEach(member => {
            const status = member.payments[month]?.status || 'pending';
            if (status !== 'paid') {
                if (!newSelected[`${member.memberId}_${month}`]) {
                    allSelected = false;
                }
            }
        });

        filteredMembers.forEach(member => {
            const status = member.payments[month]?.status || 'pending';
            if (status !== 'paid') {
                if (allSelected) {
                    delete newSelected[`${member.memberId}_${month}`];
                } else {
                    newSelected[`${member.memberId}_${month}`] = true;
                }
            }
        });

        setSelectedPayments(newSelected);
    };

    const getSelectedCount = () => Object.keys(selectedPayments).length;
    
    const getTotalAmount = () => {
        return Object.keys(selectedPayments).reduce((total, key) => {
            const [memberId, month] = key.split('_');
            const member = members.find(m => m.memberId === memberId);
            return total + (member ? member.amount : 0);
        }, 0);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const payments = Object.keys(selectedPayments).map(key => {
                const [memberId, month] = key.split('_');
                const member = members.find(m => m.memberId === memberId);
                const paymentInfo = member.payments[month];
                return {
                    memberId,
                    amount: member.amount,
                    invoiceId: paymentInfo?.invoiceId,
                    period: month,
                    method: 'Cash',
                    bankAccountId: null
                };
            });

            console.log("Processing bulk payments:", payments);
            const res = await fetch('/api/sanda/bulk-pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    payments, 
                    period: payments[0]?.period || format(new Date(), 'yyyy-MM') 
                }),
            });

            if (!res.ok) throw new Error('Failed to process payments');

            const result = await res.json();
            
            // Success! Clear selections and prepare for printing
            setSelectedPayments({}); 
            setPrintReceipts(result.results);
            setIsConfirmOpen(false);
            setIsPrintConfirmOpen(true); // Open Print Confirmation
            
            refreshData(); // Refresh data to show 'Paid' checkmarks
        } catch (error) {
            console.error(error);
            toast.error("Failed to process payments");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintConfirm = () => {
        setIsPrintConfirmOpen(false);
        setTimeout(() => {
            window.print();
        }, 500);
    };

    // Helper to generate month options
    const generateMonthOptions = () => {
        const options = [];
        const today = new Date();
        for (let i = -24; i <= 24; i++) {
            const d = addMonths(today, i);
            options.push(format(d, 'yyyy-MM'));
        }
        return options;
    };
    const monthOptions = generateMonthOptions();

    return (
        <div className={`space-y-6 flex flex-col ${isMaximised ? 'h-screen p-4' : 'p-6 h-full'}`}>
            <BulkPrintReceipts receipts={printReceipts} settings={appSettings} />

            {isMaximised && (
                <style dangerouslySetInnerHTML={{ __html: `
                    .no-print { display: none !important; }
                    .flex-1.pt-14 { padding-top: 0 !important; }
                    main[data-slot="sidebar-inset"] { 
                        margin: 0 !important; 
                        border-radius: 0 !important; 
                        box-shadow: none !important; 
                        min-height: 100vh !important;
                        height: 100vh !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    footer { display: none !important; }
                    body { overflow: hidden !important; height: 100vh !important; }
                `}} />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bulk Payment Matrix</h1>
                    <p className="text-muted-foreground">Manage payments across multiple months.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsMaximised(!isMaximised)}
                        className={`gap-2 h-10 ${isMaximised ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' : 'bg-white'}`}
                    >
                        {isMaximised ? (
                            <><Minimize2 className="h-4 w-4" /> Restore View</>
                        ) : (
                            <><Maximize2 className="h-4 w-4" /> Maximize View</>
                        )}
                    </Button>
                    <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block" />
                    <Select value={startMonth} onValueChange={setStartMonth}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Start" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">-</span>
                    <Select value={endMonth} onValueChange={setEndMonth}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="End" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <CardTitle>Members Matrix</CardTitle>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search members..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                    <div className={`overflow-auto relative transition-all duration-300 flex-1 ${!isMaximised && 'h-[calc(100vh-250px)]'}`}>
                        <Table className="border-collapse w-full min-w-max">
                            <TableHeader className="sticky top-0 bg-white z-30 shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-[200px] min-w-[200px] sticky left-0 bg-white z-40 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Member</TableHead>
                                        {months.map(month => (
                                            <TableHead key={month} className="text-center min-w-[80px] cursor-pointer hover:bg-muted/50" onClick={() => handleSelectColumn(month)}>
                                                {format(parseISO(month + '-01'), 'MMM yy')}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 15 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="sticky left-0 bg-white z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                    <div className="flex flex-col gap-2">
                                                        <Skeleton className="h-4 w-24" />
                                                        <Skeleton className="h-3 w-32" />
                                                    </div>
                                                </TableCell>
                                                {months.map(month => (
                                                    <TableCell key={month} className="p-1 border-l text-center">
                                                        <Skeleton className="h-6 w-6 mx-auto rounded-md" />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : filteredMembers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={months.length + 1} className="h-24 text-center">
                                                No members found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredMembers.map((member) => (
                                            <TableRow key={member.memberId} className="hover:bg-slate-50 transition-colors">
                                                <TableCell className="font-medium sticky left-0 bg-white z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleMemberClick(member)}>
                                                    <div className="flex flex-col">
                                                        <span>{member.name}</span>
                                                        <span className="text-xs text-muted-foreground">{member.contact}</span>
                                                    </div>
                                                </TableCell>
                                                {months.map(month => {
                                                    const status = member.payments[month]?.status || 'pending';
                                                    const isSelected = !!selectedPayments[`${member.memberId}_${month}`];
                                                    
                                                    return (
                                                        <TableCell 
                                                            key={month} 
                                                            className={`text-center p-1 border-l cursor-pointer transition-colors
                                                                ${status === 'paid' ? 'bg-green-50 hover:bg-green-100' : 
                                                                  isSelected ? 'bg-primary/20 hover:bg-primary/30' : 'hover:bg-muted'}
                                                            `}
                                                            onClick={() => toggleSelection(member.memberId, month, status)}
                                                        >
                                                            {status === 'paid' ? (
                                                                <div className="flex justify-center">
                                                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                                </div>
                                                            ) : status === 'partial' ? (
                                                                <Badge variant="secondary" className="text-[10px] px-1">Partial</Badge>
                                                            ) : (
                                                                isSelected && <div className="h-3 w-3 bg-primary rounded-full mx-auto" />
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Print Confirmation Dialog */}
            <Dialog open={isPrintConfirmOpen} onOpenChange={setIsPrintConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Payments Recorded Successfully</DialogTitle>
                        <DialogDescription>
                            {printReceipts.length} payments have been processed. Do you want to print the receipts now?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setIsPrintConfirmOpen(false)}>No, Skip</Button>
                        <Button onClick={handlePrintConfirm} className="bg-emerald-600 hover:bg-emerald-700">
                            <Printer className="w-4 h-4 mr-2" /> Yes, Print All
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Payment Confirmation Dialog */}
            <div className="fixed bottom-6 right-6 z-50">
                {getSelectedCount() > 0 && (
                    <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="shadow-lg animate-in fade-in slide-in-from-bottom-4 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700">
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Collect Payment ({getSelectedCount()})
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md border-emerald-100">
                            <DialogHeader>
                                <DialogTitle className="text-emerald-900">Confirm Bulk Payment</DialogTitle>
                                <DialogDescription>
                                    You are about to record payments for <span className="font-semibold text-emerald-700">{getSelectedCount()} items</span>.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <div className="flex justify-between items-center p-4 bg-emerald-50 border border-emerald-100 rounded-lg mb-4">
                                    <span className="font-medium text-emerald-800">Total Amount:</span>
                                    <span className="text-2xl font-bold text-emerald-700">Rs. {getTotalAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="mt-2 max-h-[250px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Summary</p>
                                    {(() => {
                                        const grouped = {};
                                        Object.keys(selectedPayments).forEach(key => {
                                            const [memberId, month] = key.split('_');
                                            if (!grouped[memberId]) grouped[memberId] = [];
                                            grouped[memberId].push(month);
                                        });
                                        
                                        return Object.keys(grouped).map(memberId => {
                                            const m = members.find(mem => mem.memberId === memberId);
                                            const monthsList = grouped[memberId].sort();
                                            const memberTotal = (m?.amount || 0) * monthsList.length;

                                            return (
                                                <div key={memberId} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                                                    <div className="flex justify-between items-start">
                                                        <div className="font-medium text-slate-800">{m?.name}</div>
                                                        <div className="font-bold text-emerald-700">Rs. {memberTotal.toLocaleString()}</div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {monthsList.map(month => (
                                                            <Badge key={month} variant="outline" className="bg-white text-slate-600 font-normal border-slate-200">
                                                                {format(parseISO(month + '-01'), 'MMMM yyyy')}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                            <DialogFooter className="gap-3 sm:gap-3">
                                <Button variant="outline" onClick={() => setIsConfirmOpen(false)} className="border-slate-200 text-slate-600">Cancel</Button>
                                <Button onClick={handleSave} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                    Confirm & Save
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Member Details Modal */}
            <Dialog open={isMemberDetailsOpen} onOpenChange={setIsMemberDetailsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Member Details</DialogTitle>
                    </DialogHeader>
                    {selectedMember && (
                        <div className="grid gap-4 py-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={selectedMember.profilePicture} alt={selectedMember.name} />
                                    <AvatarFallback className="text-lg">{selectedMember.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-lg">{selectedMember.name}</h3>
                                    <Badge variant={selectedMember.status === 'active' ? 'default' : 'secondary'}>
                                        {selectedMember.status}
                                    </Badge>
                                </div>
                            </div>
                            
                            <div className="grid gap-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedMember.contact}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedMember.email || 'No email provided'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedMember.address || 'No address provided'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Joined: {selectedMember.startDate ? format(new Date(selectedMember.startDate), 'PPP') : 'Unknown'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span>Monthly Sanda: <strong>{selectedMember.amount.toFixed(2)}</strong></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setIsMemberDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
