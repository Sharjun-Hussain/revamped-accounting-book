import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navbar Skeleton */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="h-10 w-64 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-10 w-24 bg-slate-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Lower Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity Skeleton */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="p-6 space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-4 w-20 bg-slate-200 rounded animate-pulse ml-auto" />
                    <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Events Skeleton */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 h-[300px]">
              <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-6" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-12 w-14 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fund Card Skeleton */}
            <div className="bg-slate-200 rounded-xl shadow-lg p-6 h-[200px] animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
