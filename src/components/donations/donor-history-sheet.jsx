"use client";

import useSWR from "swr";
import { format } from "date-fns";
import { apiFetcher } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    History, 
    CalendarDays, 
    CreditCard,
    Wallet,
    Trophy,
    TrendingUp
} from "lucide-react";

// --- Helper: Currency Formatter ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function DonorHistorySheet({ donorId, open, onOpenChange }) {
  // Only fetch if donorId is provided and the sheet is open
  const shouldFetch = donorId && open;
  
  const { data: donor, isLoading, error } = useSWR(
    shouldFetch ? `/donors/${donorId}` : null,
    apiFetcher
  );

  const donations = donor?.donations || [];
  
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const donationCount = donations.length;
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] w-full p-0 flex flex-col gap-0 border-l border-emerald-100/50 shadow-2xl">
        
        {/* HEADER SECTION */}
        <SheetHeader className="p-6 bg-gradient-to-b from-emerald-50/80 to-white border-b border-emerald-100">
          <SheetTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <History className="w-6 h-6 text-emerald-600" />
            Donation History
          </SheetTitle>
          <SheetDescription className="text-slate-500">
            A complete record of all contributions made by this donor.
          </SheetDescription>
          
          {isLoading ? (
              <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                          <Skeleton className="h-5 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-20 w-full rounded-lg" />
                      <Skeleton className="h-20 w-full rounded-lg" />
                  </div>
              </div>
          ) : error ? (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-lg text-sm border border-rose-100 mt-6">
                  Failed to load donor data. Please try again.
              </div>
          ) : donor ? (
              <div className="mt-6">
                  <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <Avatar className="h-12 w-12 bg-emerald-100 text-emerald-700 border-2 border-emerald-200">
                          <AvatarFallback className="text-lg font-bold">
                              {donor.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 truncate">{donor.name}</h3>
                          <p className="text-sm text-slate-500 truncate">{donor.contact || donor.email || "No contact info"}</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col">
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Lifetime Total
                          </span>
                          <span className="text-lg font-bold text-slate-900">{formatCurrency(totalAmount)}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col">
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Contributions
                          </span>
                          <span className="text-lg font-bold text-slate-900">{donationCount} Times</span>
                      </div>
                  </div>
              </div>
          ) : null}
        </SheetHeader>

        {/* TIMELINE SECTION */}
        <ScrollArea className="flex-1 w-full bg-white">
            <div className="p-6">
                {isLoading && (
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="relative flex items-start">
                                <div className="absolute left-0 ml-5 -translate-x-1/2 mt-1.5 h-3 w-3 rounded-full border-2 border-slate-200 bg-white ring-4 ring-white z-10" />
                                <div className="pl-12 w-full">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex justify-between mb-3">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-5 w-24" />
                                        </div>
                                        <Skeleton className="h-4 w-3/4 mb-3" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && donor && donations.length === 0 && (
                    <div className="text-center py-12 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                            <Wallet className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-slate-700 font-semibold">No Donations Yet</h3>
                        <p className="text-sm text-slate-500 mt-1">This donor hasn't made any recorded contributions.</p>
                    </div>
                )}

                {!isLoading && donor && donations.length > 0 && (
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        {donations.map((donation, idx) => (
                            <div key={donation.id} className="relative flex items-start group">
                                {/* Timeline Dot */}
                                <div className="absolute left-0 ml-5 -translate-x-1/2 mt-1.5 h-3 w-3 rounded-full border-2 border-emerald-500 bg-white ring-4 ring-white group-hover:bg-emerald-500 transition-colors z-10" />
                                
                                {/* Content */}
                                <div className="pl-12 w-full">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm group-hover:shadow-md group-hover:border-emerald-200 transition-all">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-semibold text-slate-900">
                                                    {format(new Date(donation.date), "MMMM dd, yyyy")}
                                                </span>
                                            </div>
                                            <div className="text-base font-bold text-emerald-600">
                                                {formatCurrency(donation.amount)}
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm text-slate-600 font-medium">
                                                {donation.purpose}
                                            </p>
                                            
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1">
                                                    <CreditCard className="w-3 h-3" />
                                                    {donation.paymentMethod}
                                                </Badge>
                                                {donation.isAnonymous && (
                                                    <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                                        Anonymous
                                                    </Badge>
                                                )}
                                                {donation.remarks && (
                                                    <span className="text-xs text-slate-400 italic flex-1 min-w-full sm:min-w-0">
                                                        &ldquo;{donation.remarks}&rdquo;
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
