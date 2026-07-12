"use client";

import { useState, useEffect, useRef } from "react";
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
  Activity,
  Server,
  Clock,
  CheckCircle2,
  ChevronRight,
  Inbox
} from "lucide-react";
import { toast } from "sonner";
import { apiFetcher } from "@/lib/api";
import { mutate } from "swr";
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
import { cn } from "@/lib/utils"; 

// --- MOCK DATA ---
const teamMembers = [
  { id: 1, name: "Admin User", role: "Super Admin", email: "admin@masjid.com", status: "Active" },
  { id: 2, name: "Treasurer", role: "Accountant", email: "finance@masjid.com", status: "Active" },
  { id: 3, name: "Board Member", role: "Viewer", email: "board@masjid.com", status: "Inactive" },
];

// Configuration for Tabs
const TAB_ITEMS = [
  { value: "general", label: "General Profile", icon: Building2, description: "Mosque details and branding" },
  { value: "finance", label: "Financial Config", icon: Wallet, description: "Billing cycles and currency" },
  { value: "notifications", label: "Notifications", icon: Bell, description: "Email and SMS alerts" },
  { value: "team", label: "Team & Roles", icon: Users, description: "Manage access levels", role: "superadmin" },
  { value: "footer", label: "Footer Settings", icon: PanelBottom, description: "App-wide footer content", role: "superadmin" },
  { value: "system-status", label: "System Status", icon: Activity, description: "Health & Performance", role: "superadmin" },
  { value: "admin-alerts", label: "Admin Alerts", icon: Inbox, description: "Contact & Reset requests", role: "superadmin" },
  { value: "backup", label: "System & Backup", icon: Database, description: "Data management", variant: "danger" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [footerSettings, setFooterSettings] = useState(null);
  const hasInitialized = useRef(false);
  const fileInputRef = useRef(null);
  
  // Logo Upload Handler
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Size validation (200KB)
    if (file.size > 200 * 1024) {
      toast.error("Logo must be less than 200KB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings(prev => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };
  
  // Factory Reset State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmPhrase, setResetConfirmPhrase] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  // Contact Admin State
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isContactSending, setIsContactSending] = useState(false);

  const { data: appSettings, isLoading: isLoadingFooter } = useSWR('/settings/app', apiFetcher);
  const { data: systemStatus, isLoading: isLoadingSystem } = useSWR(activeTab === 'system-status' ? '/system/status' : null, apiFetcher, { refreshInterval: 30000 });
  const { data: adminAlerts } = useSWR(activeTab === 'admin-alerts' ? '/admin/notifications' : null, apiFetcher, { refreshInterval: 60000 });
  const { data: resetRequests } = useSWR(activeTab === 'admin-alerts' ? '/admin/reset-requests' : null, apiFetcher, { refreshInterval: 60000 });

  useEffect(() => {
    if (appSettings && !hasInitialized.current) {
      setFooterSettings(appSettings);
      setSettings(appSettings);
      hasInitialized.current = true;
    }
  }, [appSettings]);

  const refreshAppSettings = () => mutate('/settings/app');
  const refreshAlerts = () => mutate(activeTab === 'admin-alerts' ? '/admin/notifications' : null);
  const refreshResets = () => mutate(activeTab === 'admin-alerts' ? '/admin/reset-requests' : null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // FIXED: Swapped order to {...footerSettings, ...settings}
      // This ensures 'settings' (which contains your edits) overwrites the old data in 'footerSettings'
      const response = await fetch('/api/settings/app', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...footerSettings, ...settings }), 
      });

      if (response.ok) {
        toast.success("Settings Updated Successfully");
        refreshAppSettings();
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
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
        refreshAppSettings();
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

  const handleFactoryReset = async () => {
    setIsResetting(true);
    try {
      const response = await fetch('/api/system/factory-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationPhrase: resetConfirmPhrase,
          expectedPhrase: settings.mosqueName || 'DELETE ALL DATA',
          reason: resetReason,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Factory reset completed. Data will be held for 7 days before permanent deletion.');
        setShowResetConfirm(false);
        setResetConfirmPhrase('');
        setResetReason('');
      } else {
        toast.error(data.error || 'Factory reset failed');
      }
    } catch (error) {
      toast.error('Factory reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  const handleContactAdmin = async () => {
    setIsContactSending(true);
    try {
      const response = await fetch('/api/contact-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: contactSubject,
          message: contactMessage,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Message sent to administrator');
        setContactSubject('');
        setContactMessage('');
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsContactSending(false);
    }
  };

  const handleMarkRead = async (notificationId, markAllRead = false) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, markAllRead }),
      });

      if (response.ok) {
        refreshAlerts();
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const handleResetAction = async (resetRequestId, action) => {
    try {
      const response = await fetch('/api/admin/reset-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetRequestId, action }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        refreshResets();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch (error) {
      toast.error('Action failed');
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
                                            <div 
                                                className="h-32 w-32 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 transition-colors group-hover:border-emerald-500 group-hover:text-emerald-500 overflow-hidden cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {settings.logo ? (
                                                    <img src={settings.logo} alt="Mosque Logo" className="h-full w-full object-contain" />
                                                ) : (
                                                    <Building2 className="w-10 h-10" />
                                                )}
                                            </div>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                            />
                                            <div className="absolute -bottom-2 -right-2">
                                                <Button size="icon" className="h-8 w-8 rounded-full shadow-md bg-white text-slate-700 hover:bg-slate-50 border border-slate-200" onClick={() => fileInputRef.current?.click()}>
                                                    <Settings className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                            <div className="space-y-2">
                                                <Label htmlFor="mosqueName">Mosque Name</Label>
                                                <Input id="mosqueName" value={settings.mosqueName || ''} onChange={handleChange} className="h-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="regNo">Registration No.</Label>
                                                <Input id="regNo" value={settings.regNo || ''} onChange={handleChange} className="h-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Official Email</Label>
                                                <Input id="email" value={settings.email || ''} onChange={handleChange} className="h-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Contact Phone</Label>
                                                <Input id="phone" value={settings.phone || ''} onChange={handleChange} className="h-10" />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="address">Address</Label>
                                                <Textarea id="address" value={settings.address || ''} onChange={handleChange} className="min-h-[100px] resize-none" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Member ID Configuration */}
                            <Card className="border-slate-200 shadow-sm bg-white">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Users className="w-4 h-4 text-emerald-600" />
                                        Member ID Configuration
                                    </CardTitle>
                                    <CardDescription>Configure how Member IDs are generated.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>Generation Mode</Label>
                                        <Select 
                                            value={settings.memberIdFormat || "Auto"} 
                                            onValueChange={(v) => handleSelectChange('memberIdFormat', v)}
                                        >
                                            <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Auto">Auto-Generate (Prefix + Sequence)</SelectItem>
                                                <SelectItem value="Manual">Manual Entry</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {settings.memberIdFormat !== 'Manual' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="memberIdPrefix">ID Prefix</Label>
                                                <Input 
                                                    id="memberIdPrefix" 
                                                    value={settings.memberIdPrefix || 'MEM'} 
                                                    onChange={handleChange} 
                                                    placeholder="e.g. MEM"
                                                    className="h-10" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="nextMemberId">Next Sequence No.</Label>
                                                <Input 
                                                    id="nextMemberId" 
                                                    type="number"
                                                    value={settings.nextMemberId || 1} 
                                                    onChange={handleChange} 
                                                    className="h-10" 
                                                />
                                                <p className="text-xs text-slate-500">
                                                    Next ID: <strong>{settings.memberIdPrefix || 'MEM'}-{String(settings.nextMemberId || 1).padStart(3, '0')}</strong>
                                                </p>
                                            </div>
                                        </>
                                    )}
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
                                                <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="January">January</SelectItem>
                                                    <SelectItem value="April">April</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Base Currency</Label>
                                            <div className="relative">
                                                <Input disabled value={settings.currency || 'LKR'} className="h-10 pl-9 bg-slate-50" />
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
                                                    <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">1st of Month</SelectItem>
                                                        <SelectItem value="5">5th of Month</SelectItem>
                                                        <SelectItem value="10">10th of Month</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="space-y-0.5">
                                                <Label className="text-base font-medium">Auto-Print After Bulk Collection</Label>
                                                <p className="text-sm text-slate-500">Automatically trigger receipt printing after confirming a bulk Sanda payment, without asking for confirmation.</p>
                                            </div>
                                            <Switch
                                                checked={settings.autoPrintBulkReceipt || false}
                                                onCheckedChange={() => handleToggle('autoPrintBulkReceipt')}
                                                className="data-[state=checked]:bg-emerald-600"
                                            />
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
                                            <Input id="receiptFooter" value={settings.receiptFooter || ''} onChange={handleChange} className="h-10" />
                                            <p className="text-xs text-slate-500">Appears at the bottom of printed receipts.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* TAB 3: NOTIFICATIONS */}
                        <TabsContent value="notifications" className="mt-0 space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                                <div>
                                    <h2 className="text-lg font-medium text-slate-900">Notifications</h2>
                                    <p className="text-sm text-slate-500">Choose how you want to be notified.</p>
                                </div>
                                <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Changes
                                </Button>
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
                                        <Switch checked={settings.emailEnabled || false} onCheckedChange={() => handleToggle('emailEnabled')} className="data-[state=checked]:bg-emerald-600" />
                                    </div>
                                    <div className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-green-50 text-green-600 rounded-lg mt-1"><Smartphone className="w-5 h-5" /></div>
                                            <div>
                                                <p className="font-medium text-slate-900">SMS / WhatsApp</p>
                                                <p className="text-sm text-slate-500">Send payment reminders via WhatsApp integration.</p>
                                            </div>
                                        </div>
                                        <Switch checked={settings.smsEnabled || false} onCheckedChange={() => handleToggle('smsEnabled')} className="data-[state=checked]:bg-emerald-600" />
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
                        {/* TAB: ADMIN ALERTS (SUPER ADMIN) */}
                        {session?.user?.role === 'superadmin' && (
                          <TabsContent value="admin-alerts" className="mt-0 space-y-6">
                              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                                  <div>
                                      <h2 className="text-lg font-medium text-slate-900">Admin Alerts</h2>
                                      <p className="text-sm text-slate-500">Manage reset requests and user messages.</p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleMarkRead(null, true)}
                                    disabled={!adminAlerts?.unreadCount}
                                  >
                                    Mark all as read
                                  </Button>
                              </div>

                              <div className="grid lg:grid-cols-2 gap-6">
                                  {/* Contact Messages */}
                                  <div className="space-y-4">
                                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                          <Mail className="w-4 h-4" /> Contact Messages
                                      </h3>
                                      {adminAlerts?.notifications?.filter(n => n.type === 'CONTACT_FORM').length === 0 ? (
                                          <Card className="border-dashed border-slate-200 shadow-none">
                                              <CardContent className="p-8 text-center text-slate-400 text-sm">
                                                  No contact messages found.
                                              </CardContent>
                                          </Card>
                                      ) : (
                                          adminAlerts?.notifications?.filter(n => n.type === 'CONTACT_FORM').map((notif) => (
                                              <Card key={notif.id} className={cn("border-slate-200 shadow-sm transition-all", !notif.isRead && "border-emerald-200 bg-emerald-50/30")}>
                                                  <CardContent className="p-4 space-y-3">
                                                      <div className="flex justify-between items-start">
                                                          <div>
                                                              <p className="font-medium text-slate-900">{notif.title}</p>
                                                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                  <Clock className="w-3 h-3" /> {new Date(notif.createdAt).toLocaleString()}
                                                              </p>
                                                          </div>
                                                          {!notif.isRead && (
                                                              <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600" onClick={() => handleMarkRead(notif.id)}>
                                                                  <CheckCircle2 className="w-4 h-4" />
                                                              </Button>
                                                          )}
                                                      </div>
                                                      <p className="text-sm text-slate-600 bg-white p-3 rounded border border-slate-100 italic">
                                                          "{notif.message}"
                                                      </p>
                                                      <div className="flex items-center justify-between text-xs">
                                                          <span className="text-slate-500">From: {notif.data?.userName} ({notif.data?.userEmail})</span>
                                                          <a href={`mailto:${notif.data?.contactEmail}`} className="text-emerald-600 font-medium hover:underline">Reply</a>
                                                      </div>
                                                  </CardContent>
                                              </Card>
                                          ))
                                      )}
                                  </div>

                                  {/* Reset Requests */}
                                  <div className="space-y-4">
                                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                          <ShieldAlert className="w-4 h-4" /> Reset Requests
                                      </h3>
                                      {resetRequests?.length === 0 ? (
                                          <Card className="border-dashed border-slate-200 shadow-none">
                                              <CardContent className="p-8 text-center text-slate-400 text-sm">
                                                  No reset requests found.
                                              </CardContent>
                                          </Card>
                                      ) : (
                                          resetRequests?.map((request) => (
                                              <Card key={request.id} className={cn("border-slate-200 shadow-sm", request.status === 'pending' ? "border-rose-200 bg-rose-50/30" : "opacity-70")}>
                                                  <CardContent className="p-4 space-y-3">
                                                      <div className="flex justify-between items-start">
                                                          <div>
                                                              <div className="flex items-center gap-2">
                                                                  <p className="font-medium text-slate-900">Reset by {request.userName}</p>
                                                                  <span className={cn(
                                                                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                                      request.status === 'pending' ? "bg-rose-100 text-rose-700" : 
                                                                      request.status === 'restored' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                                                                  )}>
                                                                      {request.status}
                                                                  </span>
                                                              </div>
                                                              <p className="text-xs text-slate-500">Requested: {new Date(request.createdAt).toLocaleDateString()}</p>
                                                          </div>
                                                      </div>
                                                      <p className="text-xs text-slate-600">Reason: {request.reason || 'None provided'}</p>
                                                      
                                                      {request.status === 'pending' && (
                                                          <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                                                              <p className="text-[10px] text-rose-600 font-medium">Auto-delete: {new Date(request.autoDeleteAt).toLocaleDateString()}</p>
                                                              <div className="flex gap-2">
                                                                  <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => handleResetAction(request.id, 'restore')}>
                                                                      Restore
                                                                  </Button>
                                                                  <Button size="sm" variant="destructive" className="h-7 text-xs bg-rose-600" onClick={() => handleResetAction(request.id, 'delete')}>
                                                                      Purge
                                                                  </Button>
                                                              </div>
                                                          </div>
                                                      )}
                                                  </CardContent>
                                              </Card>
                                          ))
                                      )}
                                  </div>
                              </div>
                          </TabsContent>
                        )}

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
                                            <p className="text-sm text-slate-500">Download a full JSON backup of all mosque data.</p>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            className="gap-2"
                                            onClick={() => {
                                                window.open('/api/system/backup', '_blank');
                                                toast.success('Backup download started');
                                            }}
                                        >
                                            <Download className="w-4 h-4" /> Download
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="border-rose-200 bg-rose-50/50 shadow-none">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="space-y-1">
                                            <p className="font-bold text-rose-800">Factory Reset</p>
                                            <p className="text-sm text-rose-600">
                                                This will mark all members, payments, expenses, and other data for deletion. 
                                                An admin can restore your data within 7 days. After that, data is permanently deleted.
                                            </p>
                                        </div>
                                        
                                        {!showResetConfirm ? (
                                            <Button 
                                                variant="destructive" 
                                                className="bg-rose-600 hover:bg-rose-700"
                                                onClick={() => setShowResetConfirm(true)}
                                            >
                                                Reset All Data
                                            </Button>
                                        ) : (
                                            <div className="space-y-4 p-4 bg-rose-100 rounded-lg border border-rose-200">
                                                <div className="flex items-start gap-3">
                                                    <ShieldAlert className="w-5 h-5 text-rose-700 mt-0.5" />
                                                    <div>
                                                        <p className="font-semibold text-rose-800">Are you absolutely sure?</p>
                                                        <p className="text-sm text-rose-700">
                                                            This action cannot be easily undone. Please type <strong>{settings.mosqueName || 'DELETE ALL DATA'}</strong> to confirm.
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <Input
                                                    placeholder="Type the phrase to confirm..."
                                                    value={resetConfirmPhrase}
                                                    onChange={(e) => setResetConfirmPhrase(e.target.value)}
                                                    className="border-rose-300 focus:border-rose-500"
                                                />
                                                
                                                <Textarea
                                                    placeholder="Reason for reset (optional)..."
                                                    value={resetReason}
                                                    onChange={(e) => setResetReason(e.target.value)}
                                                    rows={2}
                                                    className="border-rose-300"
                                                />
                                                
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowResetConfirm(false);
                                                            setResetConfirmPhrase('');
                                                            setResetReason('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        className="bg-rose-600 hover:bg-rose-700"
                                                        disabled={resetConfirmPhrase !== (settings.mosqueName || 'DELETE ALL DATA') || isResetting}
                                                        onClick={handleFactoryReset}
                                                    >
                                                        {isResetting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                        I understand, reset all data
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-6 space-y-4">
                                        <div>
                                            <p className="font-medium text-slate-900">Contact Administrator</p>
                                            <p className="text-sm text-slate-500">Need help or want to restore deleted data? Send a message to the platform admin.</p>
                                        </div>
                                        <div className="space-y-3">
                                            <Input
                                                placeholder="Subject..."
                                                value={contactSubject}
                                                onChange={(e) => setContactSubject(e.target.value)}
                                            />
                                            <Textarea
                                                placeholder="Your message..."
                                                value={contactMessage}
                                                onChange={(e) => setContactMessage(e.target.value)}
                                                rows={3}
                                            />
                                            <Button
                                                variant="outline"
                                                disabled={!contactSubject || !contactMessage || isContactSending}
                                                onClick={handleContactAdmin}
                                            >
                                                {isContactSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                                                Send Message
                                            </Button>
                                        </div>
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
                        {session?.user?.role === 'superadmin' && (
                            <TabsContent value="system-status" className="mt-0 space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                                    <div>
                                        <h2 className="text-lg font-medium text-slate-900">System Status</h2>
                                        <p className="text-sm text-slate-500">Real-time health and performance metrics.</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
                                        <Activity className="w-4 h-4" /> Refresh
                                    </Button>
                                </div>

                                {isLoadingSystem ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                                    </div>
                                ) : (
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* Database Status */}
                                        <Card className="border-slate-200 shadow-sm">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Database className="w-4 h-4 text-emerald-600" /> Database Health
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <span className="text-sm text-slate-600">Connection Status</span>
                                                    <Badge variant={systemStatus?.database?.status === 'connected' ? 'default' : 'destructive'} className={systemStatus?.database?.status === 'connected' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                                        {systemStatus?.database?.status === 'connected' ? 'Connected' : 'Disconnected'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <span className="text-sm text-slate-600">Response Latency</span>
                                                    <span className="text-sm font-mono font-medium">{systemStatus?.database?.latency || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <span className="text-sm text-slate-600">Database Size</span>
                                                    <span className="text-sm font-mono font-medium">{systemStatus?.database?.size || 'Unknown'}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <span className="text-sm text-slate-600">Provider</span>
                                                    <span className="text-sm font-medium">{systemStatus?.database?.provider || 'PostgreSQL'}</span>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* System Info */}
                                        <Card className="border-slate-200 shadow-sm">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Server className="w-4 h-4 text-blue-600" /> Application Info
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <span className="text-sm text-slate-600">System Status</span>
                                                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                                                        {systemStatus?.system?.status || 'Online'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <span className="text-sm text-slate-600">Environment</span>
                                                    <span className="text-sm font-medium capitalize">{systemStatus?.system?.environment || 'Production'}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <span className="text-sm text-slate-600">Version</span>
                                                    <span className="text-sm font-mono font-medium">v{systemStatus?.system?.version || '1.0.0'}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <span className="text-sm text-slate-600">Last Checked</span>
                                                    <span className="text-xs text-slate-500 font-mono">
                                                        {systemStatus?.system?.timestamp ? new Date(systemStatus.system.timestamp).toLocaleTimeString() : 'Just now'}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
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