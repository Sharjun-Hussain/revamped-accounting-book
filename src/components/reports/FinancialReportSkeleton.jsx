import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function FinancialReportSkeleton() {
  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative z-10 flex items-center justify-between mb-6">
              <div className="h-14 w-14 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse" />
            </div>
            <div className="relative z-10">
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mb-2" />
              <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div>
              <div className="h-5 w-48 bg-slate-100 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="p-6 h-[350px] flex items-end justify-between gap-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-full bg-slate-50 rounded-t animate-pulse" style={{ height: `${Math.random() * 80 + 20}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div>
              <div className="h-5 w-40 bg-slate-100 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="p-6 h-[350px] flex items-center justify-center">
            <div className="h-48 w-48 rounded-full border-8 border-slate-50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
