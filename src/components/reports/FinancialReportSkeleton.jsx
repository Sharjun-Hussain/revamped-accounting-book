import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function FinancialReportSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 relative font-sans">
      <div className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-64 bg-slate-200 rounded-xl animate-pulse" />
        </div>

        {/* Tabs Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="rounded-xl border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 rounded-xl border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="h-[350px] flex items-end justify-between p-6 gap-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-full bg-slate-100 rounded-t animate-pulse" style={{ height: `${Math.random() * 80 + 20}%` }} />
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="h-[350px] flex items-center justify-center">
              <div className="h-48 w-48 rounded-full border-8 border-slate-100 animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
