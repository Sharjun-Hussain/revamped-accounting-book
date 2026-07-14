"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Settings,
  ShieldCheck,
  Zap,
  Globe,
  FileText
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TextLkDashboard } from "./tabs/TextLkDashboard";
import { TextLkContacts } from "./tabs/TextLkContacts";
import { TextLkMessages } from "./tabs/TextLkMessages";
import { TextLkSettings } from "./tabs/TextLkSettings";
import { TextLkTemplates } from "./tabs/TextLkTemplates";
import { TextLkCampaigns } from "./tabs/TextLkCampaigns";

export function TextLkManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dashboard");

  // Keep state in sync with URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab("dashboard");
    }
  }, [searchParams]);

  const handleTabChange = useCallback((value) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  }, [searchParams, pathname]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Module Header */}
      <div className="px-6 py-6 border-b border-border bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/5">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Text.lk SMS Manager</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your SMS broadcasting and customer communications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-card border border-border p-1 rounded-xl shadow-xs h-12 flex flex-wrap max-w-fit">
            <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:text-white px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            {/* <TabsTrigger value="contacts" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:text-white px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
              <Users className="h-4 w-4" />
              Contact Groups
            </TabsTrigger> */}
            <TabsTrigger value="templates" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:text-white px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:text-white px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
              <MessageSquare className="h-4 w-4" />
              Direct SMS
            </TabsTrigger>
            {/* <TabsTrigger value="campaigns" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:text-white px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
              <Zap className="h-4 w-4" />
              Campaigns
            </TabsTrigger> */}
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:text-white px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
              <Settings className="h-4 w-4" />
              API Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0 border-none p-0 focus-visible:ring-0">
            <TextLkDashboard handleTabChange={handleTabChange} />
          </TabsContent>

          {/* <TabsContent value="contacts" className="mt-0 border-none p-0 focus-visible:ring-0">
            <TextLkContacts />
          </TabsContent> */}

          <TabsContent value="templates" className="mt-0 border-none p-0 focus-visible:ring-0">
            <TextLkTemplates />
          </TabsContent>

          <TabsContent value="messages" className="mt-0 border-none p-0 focus-visible:ring-0">
            <TextLkMessages />
          </TabsContent>

          {/* <TabsContent value="campaigns" className="mt-0 border-none p-0 focus-visible:ring-0">
            <TextLkCampaigns />
          </TabsContent> */}

          <TabsContent value="settings" className="mt-0 border-none p-0 focus-visible:ring-0">
            <TextLkSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
