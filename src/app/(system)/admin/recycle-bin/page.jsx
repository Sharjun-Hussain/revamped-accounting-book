"use client";

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { apiFetcher } from '@/lib/api';
import { toast } from 'sonner';
import { Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const TABS = [
  { id: 'members', label: 'Members', icon: 'users' },
  { id: 'invoices', label: 'Invoices', icon: 'file-text' },
  { id: 'payments', label: 'Payments', icon: 'credit-card' },
  { id: 'expenses', label: 'Expenses', icon: 'trending-down' },
  { id: 'income', label: 'Income', icon: 'trending-up' },
  { id: 'donations', label: 'Donations', icon: 'hand-coins' },
  { id: 'categories', label: 'Categories', icon: 'tags' },
  { id: 'bankAccounts', label: 'Bank Accounts', icon: 'landmark' },
  { id: 'ledgers', label: 'Ledgers', icon: 'book' },
];

export default function RecycleBinPage() {
  const [activeTab, setActiveTab] = useState('members');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data, error, isLoading } = useSWR('/admin/recycle-bin', apiFetcher);

  const handleAction = async (ids, type, action) => {
    setIsProcessing(true);
    try {
      const method = action === 'restore' ? 'PUT' : 'DELETE';
      const endpoint = '/api/admin/recycle-bin';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, type }),
      });

      const result = await res.json();
      
      if (res.ok) {
        toast.success(result.message);
        mutate('/admin/recycle-bin');
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderTable = (items, type) => {
    if (!items || items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <Trash2 className="h-12 w-12 mb-4 opacity-20" />
          <p>No deleted {type} found in the recycle bin.</p>
        </div>
      );
    }

    return (
      <div className="rounded-md border border-slate-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Deleted Info</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 truncate max-w-[200px]">
                      {item.name || item.description || item.invoiceNo || item.id}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-rose-500" />
                      Deleted: {new Date(item.deletedAt).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-slate-600">
                    {item.amount && <Badge variant="secondary" className="mr-2">Rs. {item.amount.toLocaleString()}</Badge>}
                    {item.status && <Badge variant="outline" className="mr-2">{item.status}</Badge>}
                    {item.email || item.contact || item.type || ''}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleAction([item.id], type, 'restore')}
                      disabled={isProcessing}
                      className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Restore
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => {
                        if (confirm('Are you sure you want to permanently delete this? This cannot be undone.')) {
                          handleAction([item.id], type, 'delete');
                        }
                      }}
                      disabled={isProcessing}
                      className="h-8 bg-rose-600 hover:bg-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Purge
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const getModelName = (tabId) => {
      // Map tab ID to prisma model name
      const map = {
          'members': 'member',
          'invoices': 'invoice',
          'payments': 'payment',
          'expenses': 'expense',
          'income': 'income',
          'donations': 'donation',
          'categories': 'category',
          'bankAccounts': 'bankAccount',
          'ledgers': 'ledger'
      };
      return map[tabId];
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]" 
           style={{ backgroundImage: `radial-gradient(#059669 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Trash2 className="h-8 w-8 text-rose-500" />
              Recycle Bin
            </h1>
            <p className="mt-2 text-slate-500 text-sm max-w-2xl">
              View and manage soft-deleted records across the system. You can restore them to active use or permanently purge them from the database.
            </p>
        </div>

        {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg mb-8 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5" />
                <div>
                    <h3 className="font-medium">Failed to load recycle bin data</h3>
                    <p className="text-sm opacity-80">{error.message || "An unknown error occurred."}</p>
                </div>
            </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:flex-row gap-8 lg:gap-12 h-[calc(100vh-180px)]">
            
            <aside className="lg:w-64 flex-shrink-0 h-full overflow-y-auto no-scrollbar pb-10">
                <div>
                    <TabsList className="flex flex-col h-auto bg-transparent p-0 space-y-1 border-none">
                        {TABS.map((item) => (
                            <TabsTrigger 
                                key={item.id} 
                                value={item.id}
                                className={`relative w-full justify-start px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden group border-0 data-[state=active]:border-0 m-0 !mb-0 rounded-md ${
                                    activeTab === item.id 
                                    ? "text-rose-700 bg-rose-50" 
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                                }`}
                            >
                                <div className="flex items-center justify-between w-full relative z-10">
                                    <span>{item.label}</span>
                                    {data && data[item.id] && data[item.id].length > 0 && (
                                        <Badge variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                                            {data[item.id].length}
                                        </Badge>
                                    )}
                                </div>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
            </aside>

            <div className="flex-1 min-w-0 h-full overflow-y-auto pr-2 pb-10">
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ) : (
                    TABS.map((tab) => (
                        <TabsContent key={tab.id} value={tab.id} className="mt-0">
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 bg-white z-10 rounded-t-xl">
                                    <div>
                                        <CardTitle className="text-lg font-medium">{tab.label}</CardTitle>
                                        <CardDescription>
                                            Deleted {tab.label.toLowerCase()} pending permanent deletion.
                                        </CardDescription>
                                    </div>
                                    {data && data[tab.id] && data[tab.id].length > 0 && (
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleAction(data[tab.id].map(i => i.id), getModelName(tab.id), 'restore')}
                                                disabled={isProcessing}
                                            >
                                                Restore All
                                            </Button>
                                            <Button 
                                                variant="destructive" 
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to permanently delete ALL deleted ${tab.label.toLowerCase()}?`)) {
                                                        handleAction(data[tab.id].map(i => i.id), getModelName(tab.id), 'delete');
                                                    }
                                                }}
                                                disabled={isProcessing}
                                            >
                                                Purge All
                                            </Button>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="p-0">
                                    {renderTable(data?.[tab.id], tab.label)}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))
                )}
            </div>
        </Tabs>
      </main>
    </div>
  );
}
