"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, HandCoins, UserPlus, Receipt, FileText, Wallet, Loader2 } from "lucide-react";

export function QuickActions({ className }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSandhaLoading, setIsSandhaLoading] = useState(false);

  const isSandhaPage = pathname === "/billing/bulk-collection";

  const handleSandhaClick = () => {
    if (isSandhaPage) return;
    setIsSandhaLoading(true);
    router.push("/billing/bulk-collection");
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button 
        variant="default" 
        size="sm" 
        className="h-7 font-bold bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
        onClick={handleSandhaClick}
        disabled={isSandhaLoading || isSandhaPage}
      >
        {isSandhaLoading ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Loading...
          </>
        ) : (
          "Sandha Entry"
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Quick Create
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-2">
          <div className="grid grid-cols-1 gap-1">
            <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
              <Link href="/billing/create" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-left group w-full transition-colors">
                <div className="bg-blue-100 p-2 rounded-md text-blue-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-800">New Invoice</span>
                  <span className="block text-xs text-slate-500">Create a new billing invoice</span>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
              <Link href="/donations/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-left group w-full transition-colors">
                <div className="bg-emerald-100 p-2 rounded-md text-emerald-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-800">New Donation</span>
                  <span className="block text-xs text-slate-500">Record a new donation entry</span>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
              <Link href="/members/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-left group w-full transition-colors">
                <div className="bg-indigo-100 p-2 rounded-md text-indigo-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-800">New Member</span>
                  <span className="block text-xs text-slate-500">Register a new masjid member</span>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
              <Link href="/accounting/expenses" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-left group w-full transition-colors">
                <div className="bg-rose-100 p-2 rounded-md text-rose-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-800">New Expense</span>
                  <span className="block text-xs text-slate-500">Track a new expense record</span>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
              <Link href="/accounting/income" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-left group w-full transition-colors">
                <div className="bg-amber-100 p-2 rounded-md text-amber-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-800">New Income</span>
                  <span className="block text-xs text-slate-500">Record other types of income</span>
                </div>
              </Link>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
