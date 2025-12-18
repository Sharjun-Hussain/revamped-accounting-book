import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function BillingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Main Card Skeleton */}
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="pt-6">
            {/* Toolbar Skeleton */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                <div className="h-10 w-full max-w-sm bg-slate-200 rounded animate-pulse" />
                <div className="h-10 w-[160px] bg-slate-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Table Skeleton */}
            <div className="rounded-md border border-slate-100">
              <div className="h-12 bg-slate-50 border-b border-slate-100" />
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center p-4 border-b border-slate-50 last:border-0">
                  <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mr-4" />
                  <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mr-4" />
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mr-4" />
                  <div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
