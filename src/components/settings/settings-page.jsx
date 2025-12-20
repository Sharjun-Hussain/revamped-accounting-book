"use client";

import { useState, useEffect } from "react";
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Building2,
  Wallet,
  Users,
  Bell,
  Database,
  Save,
  Mail,
  Smartphone,
  ShieldAlert,
  Loader2,
  Download,
  PanelBottom,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
// UI Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // Ensure you have this utility or remove usage

// --- MOCK DATA ---
const initialSettings = {
  mosqueName: "Al-Manar Grand Mosque",
  regNo: "MQ/2023/885",
  email: "admin@almanar.lk",
  phone: "+94 77 123 4567",
  address: "123 Mosque Road, Kandy, Sri Lanka",
  currency: "LKR",
  fiscalYearStart: "January",
  autoBillDate: "1", 
  receiptFooter: "Jazakallahu Khairan. May Allah accept your deeds.",
  smsEnabled: true,
  emailEnabled: false
};

const teamMembers = [
  { id: 1, name: "Admin User", role: "Super Admin", email: "admin@masjid.com", status: "Active" },
  { id: 2, name: "Treasurer", role: "Accountant", email: "finance@masjid.com", status: "Active" },
  { id: 3, name: "Board Member", role: "Viewer", email: "board@masjid.com", status: "Inactive" },
];

// Configuration for Tabs to make mapping easier and cleaner
const TAB_ITEMS = [
  { value: "general", label: "General Profile", icon: Building2, description: "Mosque details and branding" },
  { value: "finance", label: "Financial Config", icon: Wallet, description: "Billing cycles and currency" },
  { value: "notifications", label: "Notifications", icon: Bell, description: "Email and SMS alerts" },
  { value: "team", label: "Team & Roles", icon: Users, description: "Manage access levels" },
  { value: "footer", label: "Footer Settings", icon: PanelBottom, description: "App-wide footer content", role: "superadmin" },
  { value: "backup", label: "System & Backup", icon: Database, description: "Data management", variant: "danger" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState(initialSettings);
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [footerSettings, setFooterSettings] = useState(null);

  const fetcher = (url) => fetch(url).then((res) => res.json());
  const { data: appSettings, isLoading: isLoadingFooter, mutate } = useSWR('/api/settings/app', fetcher);

  useEffect(() => {
    if (appSettings) {
      setFooterSettings(appSettings);
    }
  }, [appSettings]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
        setIsSaving(false);
        toast.success("Settings Updated Successfully");
    }, 1000);
  };

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleFooterChange = (e) => {
    setFooterSettings({ ...footerSettings, [e.target.id]: e.target.value });
  };

  const handleFooterToggle = () => {
    setFooterSettings({ ...footerSettings, showFooter: !footerSettings?.showFooter });
  };

  const handleSaveFooter = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/app', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(footerSettings),
      });

      if (response.ok) {
        toast.success('Footer Settings Updated Successfully');
        mutate();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update footer settings');
      }
    } catch (error) {
      toast.error('Failed to update footer settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]" 
           style={{ backgroundImage: `radial-gradient(#059669 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Page Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
            <p className="mt-2 text-slate-500 text-sm max-w-2xl">
              Manage your organization settings, team members, and system preferences across the application.
            </p>
        </div>

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* SIDEBAR NAVIGATION */}
            <aside className="lg:w-64 flex-shrink-0">
                <div className="sticky top-6">
                    <TabsList className="flex flex-col h-auto bg-transparent p-0 space-y-1">
                        {TAB_ITEMS.map((item) => {
                             if (item.role && session?.user?.role !== item.role) return null;
                             
                             const isActive = activeTab === item.value;
                             const Icon = item.icon;
                             const isDanger = item.variant === 'danger';

                             return (
                                <TabsTrigger 
                                    key={item.value} 
                                    value={item.value}
                                    className={cn(
                                        "relative w-full justify-start px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden group",
                                        !isActive && "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60",
                                        isActive && isDanger && "text-rose-700 bg-rose-50",
                                        isActive && !isDanger && "text-emerald-700 bg-emerald-50",
                                    )}
                                >
                                   
                                   

                                    <div className="flex items-center gap-3 relative z-10">
                                        <Icon className={cn("w-4 h-4", isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
                                        <span>{item.label}</span>
                                    </div>
                                </TabsTrigger>
                             );
                        })}
                    </TabsList>

                    <div className="mt-8 px-4 py-4 rounded-xl bg-gradient-to-br from-emerald-900 to-emerald-800 text-white shadow-lg shadow-emerald-900/10">
                        <p className="text-xs font-medium text-emerald-100 mb-1">Support Status</p>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
                            <span className="text-sm font-semibold">System Online</span>
                        </div>
                        <Button size="sm" variant="secondary" className="w-full text-xs h-8 bg-white/10 hover:bg-white/20 text-white border-0">
                            Contact Support
                        </Button>
                    </div>
                </div>
            </aside>

            {/* CONTENT AREA */}
            <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        
                        {/* TAB 1: GENERAL */}
                        <TabsContent value="general" className="mt-0 space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                                <div>
                                    <h2 className="text-lg font-medium text-slate-900">Organization Profile</h2>
                                    <p className="text-sm text-slate-500">Official details used for receipts and reports.</p>
                                </div>
                                <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Changes
                                </Button>
                            </div>

                            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                                <CardContent className="p-6 md:p-8 space-y-8">
                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        <div className="flex-shrink-0 group relative">
                                            <div className="h-32 w-32 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 transition-colors group-hover:border-emerald-500 group-hover:text-emerald-500">
                                                <Building2 className="w-10 h-10" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2">
                                                <Button size="icon" className="h-8 w-8 rounded-full shadow-md bg-white text-slate-700 hover:bg-slate-50 border border-slate-200">
                                                    <Settings className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                            <div className="space-y-2">
                                                <Label htmlFor="mosqueName">Mosque Name</Label>
                                                <Input id="mosqueName" value={settings.mosqueName} onChange={handleChange} className="h-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="regNo">Registration No.</Label>
                                                <Input id="regNo" value={settings.regNo} onChange={handleChange} className="h-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Official Email</Label>
                                                <Input id="email" value={settings.email} onChange={handleChange} className="h-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Contact Phone</Label>
                                                <Input id="phone" value={settings.phone} onChange={handleChange} className="h-10" />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="address">Address</Label>
                                                <Textarea id="address" value={settings.address} onChange={handleChange} className="min-h-[100px] resize-none" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 2: FINANCIAL */}
                        <TabsContent value="finance" className="mt-0 space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                                <div>
                                    <h2 className="text-lg font-medium text-slate-900">Financial Configuration</h2>
                                    <p className="text-sm text-slate-500">Manage billing cycles and receipt defaults.</p>
                                </div>
                                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Save Changes</Button>
                            </div>

                            <div className="grid gap-6">
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base">General Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Fiscal Year Start</Label>
                                            <Select defaultValue={settings.fiscalYearStart} onValueChange={(v) => handleSelectChange('fiscalYearStart', v)}>
                                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="January">January</SelectItem>
                                                    <SelectItem value="April">April</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Base Currency</Label>
                                            <div className="relative">
                                                <Input disabled value={settings.currency} className="h-10 pl-9 bg-slate-50" />
                                                <span className="absolute left-3 top-3 text-slate-500 text-xs font-bold">LKR</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base">Automation</CardTitle>
                                        <CardDescription>Configure how Sanda bills are generated.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="space-y-0.5">
                                                <Label className="text-base font-medium">Auto-Generate Bills</Label>
                                                <p className="text-sm text-slate-500">Automatically create invoices for active members monthly.</p>
                                            </div>
                                            <Switch defaultChecked className="data-[state=checked]:bg-emerald-600" />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Generation Day</Label>
                                                <Select defaultValue={settings.autoBillDate} onValueChange={(v) => handleSelectChange('autoBillDate', v)}>
                                                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">1st of Month</SelectItem>
                                                        <SelectItem value="5">5th of Month</SelectItem>
                                                        <SelectItem value="10">10th of Month</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base">Receipt Customization</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Label>Footer Message</Label>
                                            <Input id="receiptFooter" value={settings.receiptFooter} onChange={handleChange} className="h-10" />
                                            <p className="text-xs text-slate-500">Appears at the bottom of printed receipts.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* TAB 3: NOTIFICATIONS */}
                        <TabsContent value="notifications" className="mt-0 space-y-6">
                            <div className="pb-4 border-b border-slate-200">
                                <h2 className="text-lg font-medium text-slate-900">Notifications</h2>
                                <p className="text-sm text-slate-500">Choose how you want to be notified.</p>
                            </div>

                            <Card className="border-slate-200 shadow-sm">
                                <CardContent className="p-0 divide-y divide-slate-100">
                                    <div className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-1"><Mail className="w-5 h-5" /></div>
                                            <div>
                                                <p className="font-medium text-slate-900">Email Alerts</p>
                                                <p className="text-sm text-slate-500">Send digital receipts via email automatically.</p>
                                            </div>
                                        </div>
                                        <Switch checked={settings.emailEnabled} onCheckedChange={() => handleToggle('emailEnabled')} className="data-[state=checked]:bg-emerald-600" />
                                    </div>
                                    <div className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-green-50 text-green-600 rounded-lg mt-1"><Smartphone className="w-5 h-5" /></div>
                                            <div>
                                                <p className="font-medium text-slate-900">SMS / WhatsApp</p>
                                                <p className="text-sm text-slate-500">Send payment reminders via WhatsApp integration.</p>
                                            </div>
                                        </div>
                                        <Switch checked={settings.smsEnabled} onCheckedChange={() => handleToggle('smsEnabled')} className="data-[state=checked]:bg-emerald-600" />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 4: TEAM */}
                        <TabsContent value="team" className="mt-0 space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                                <div>
                                    <h2 className="text-lg font-medium text-slate-900">Team Management</h2>
                                    <p className="text-sm text-slate-500">Manage who has access to the system.</p>
                                </div>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white"><Users className="w-4 h-4 mr-2" /> Invite Member</Button>
                            </div>

                            <Card className="border-slate-200 shadow-sm">
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100">
                                        {teamMembers.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between p-4 sm:p-6 hover:bg-slate-50/50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-10 w-10 border border-slate-200">
                                                        <AvatarFallback className="bg-emerald-50 text-emerald-700 font-medium">{member.name.substring(0,2)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                            {member.name}
                                                            {member.id === 1 && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5 bg-emerald-100 text-emerald-700">You</Badge>}
                                                        </p>
                                                        <p className="text-xs text-slate-500">{member.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm text-slate-500 hidden sm:inline-block">{member.role}</span>
                                                    <Button variant="ghost" size="icon" className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Settings className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 5: BACKUP */}
                        <TabsContent value="backup" className="mt-0 space-y-6">
                            <div className="pb-4 border-b border-rose-100">
                                <h2 className="text-lg font-medium text-rose-700 flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5" /> Danger Zone
                                </h2>
                                <p className="text-sm text-rose-600/80">Advanced actions that affect data integrity.</p>
                            </div>

                            <div className="space-y-4">
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">Export Database</p>
                                            <p className="text-sm text-slate-500">Download a full SQL dump of the current system.</p>
                                        </div>
                                        <Button variant="outline" className="gap-2">
                                            <Download className="w-4 h-4" /> Download
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="border-rose-200 bg-rose-50/50 shadow-none">
                                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className="font-bold text-rose-800">Factory Reset</p>
                                            <p className="text-sm text-rose-600">This will wipe all members, payments, and expenses permanently. This action cannot be undone.</p>
                                        </div>
                                        <Button variant="destructive" className="bg-rose-600 hover:bg-rose-700 whitespace-nowrap">Reset All Data</Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* TAB 6: FOOTER (SUPER ADMIN) */}
                         {session?.user?.role === 'superadmin' && (
                          <TabsContent value="footer" className="mt-0 space-y-6">
                              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                                  <div>
                                      <h2 className="text-lg font-medium text-slate-900">Footer Configuration</h2>
                                      <p className="text-sm text-slate-500">Customize the application footer.</p>
                                  </div>
                                  <Button onClick={handleSaveFooter} disabled={isSaving || isLoadingFooter} className="bg-emerald-600 hover:bg-emerald-700">
                                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                      Save
                                  </Button>
                              </div>

                              <Card className="border-slate-200 shadow-sm">
                                  <CardContent className="p-6 md:p-8 space-y-6">
                                      {isLoadingFooter ? (
                                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
                                      ) : (
                                        <>
                                          <div className="grid md:grid-cols-2 gap-6">
                                              <div className="space-y-2">
                                                  <Label>App Name</Label>
                                                  <Input id="appName" value={footerSettings?.appName || ''} onChange={handleFooterChange} placeholder="Masjid System" className="h-10" />
                                              </div>
                                              <div className="space-y-2">
                                                  <Label>Version</Label>
                                                  <Input id="appVersion" value={footerSettings?.appVersion || ''} onChange={handleFooterChange} placeholder="1.0.0" className="h-10" />
                                              </div>
                                              <div className="md:col-span-2 space-y-2">
                                                  <Label>Credits Text</Label>
                                                  <Input id="footerText" value={footerSettings?.footerText || ''} onChange={handleFooterChange} className="h-10" />
                                              </div>
                                              <div className="md:col-span-2 space-y-2">
                                                  <Label>Copyright Notice</Label>
                                                  <Input id="footerCopyright" value={footerSettings?.footerCopyright || ''} onChange={handleFooterChange} className="h-10" />
                                              </div>
                                          </div>
                                          <Separator />
                                          <div className="flex items-center justify-between">
                                              <div className="space-y-0.5">
                                                  <Label className="text-base">Enable Footer</Label>
                                                  <p className="text-sm text-slate-500">Show footer across the application</p>
                                              </div>
                                              <Switch checked={footerSettings?.showFooter || false} onCheckedChange={handleFooterToggle} className="data-[state=checked]:bg-emerald-600" />
                                          </div>
                                        </>
                                      )}
                                  </CardContent>
                              </Card>
                          </TabsContent>
                        )}
                        
                    </motion.div>
                </AnimatePresence>
            </div>
        </Tabs>
      </main>
    </div>
  );
}