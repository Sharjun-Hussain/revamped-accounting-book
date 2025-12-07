"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
  Download
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

export default function SettingsPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Settings className="h-8 w-8 text-emerald-600" />
                System Settings
            </h1>
            <p className="text-slate-500">Manage organization profile, financial rules, and access control.</p>
        </div>

        {/* --- FIXED: SINGLE TABS WRAPPER --- */}
        <Tabs defaultValue="general" className="w-full">
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* SIDEBAR NAVIGATION */}
                <div className="lg:col-span-1">
                    <TabsList className="flex flex-col h-auto bg-transparent space-y-1 p-0">
                        <TabsTrigger value="general" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-emerald-600 rounded-none rounded-r-lg text-slate-600 transition-all">
                            <Building2 className="w-4 h-4 mr-3" /> General Profile
                        </TabsTrigger>
                        <TabsTrigger value="finance" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-emerald-600 rounded-none rounded-r-lg text-slate-600 transition-all">
                            <Wallet className="w-4 h-4 mr-3" /> Financial Config
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-emerald-600 rounded-none rounded-r-lg text-slate-600 transition-all">
                            <Bell className="w-4 h-4 mr-3" /> Notifications
                        </TabsTrigger>
                        <TabsTrigger value="team" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-emerald-600 rounded-none rounded-r-lg text-slate-600 transition-all">
                            <Users className="w-4 h-4 mr-3" /> Team & Roles
                        </TabsTrigger>
                        <TabsTrigger value="backup" className="w-full justify-start px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-l-4 data-[state=active]:border-rose-600 rounded-none rounded-r-lg text-slate-600 transition-all">
                            <Database className="w-4 h-4 mr-3" /> System & Backup
                        </TabsTrigger>
                    </TabsList>

                    <div className="hidden lg:block mt-6">
                        <Card className="bg-emerald-50 border-emerald-100 shadow-none">
                            <CardContent className="p-4">
                                <p className="text-xs text-emerald-800 font-medium mb-1">Need Help?</p>
                                <p className="text-[10px] text-emerald-600">Contact support for advanced database configurations.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* CONTENT PANELS */}
                <div className="lg:col-span-3">
                        
                    {/* TAB 1: GENERAL */}
                    <TabsContent value="general" className="mt-0">
                        <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
                            <CardHeader>
                                <CardTitle>Organization Profile</CardTitle>
                                <CardDescription>These details will appear on receipts and reports.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                        <Building2 className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <Button variant="outline" size="sm">Change Logo</Button>
                                        <p className="text-[10px] text-slate-500">JPG, PNG max 2MB. Used for Letterhead.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mosqueName">Mosque Name</Label>
                                        <Input id="mosqueName" value={settings.mosqueName} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="regNo">Registration No.</Label>
                                        <Input id="regNo" value={settings.regNo} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Official Email</Label>
                                        <Input id="email" value={settings.email} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Contact Phone</Label>
                                        <Input id="phone" value={settings.phone} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Textarea id="address" value={settings.address} onChange={handleChange} className="resize-none" />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-slate-100 px-6 py-4 bg-slate-50 rounded-b-xl flex justify-end">
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: FINANCIAL */}
                    <TabsContent value="finance" className="mt-0">
                        <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
                            <CardHeader>
                                <CardTitle>Financial Configuration</CardTitle>
                                <CardDescription>Manage billing cycles and receipt defaults.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Fiscal Year Start</Label>
                                        <Select defaultValue={settings.fiscalYearStart} onValueChange={(v) => handleSelectChange('fiscalYearStart', v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="January">January</SelectItem>
                                                <SelectItem value="April">April</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Base Currency</Label>
                                        <Input disabled value={settings.currency} />
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-900">Sanda Billing Automation</h3>
                                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Auto-Generate Bills</Label>
                                            <p className="text-xs text-slate-500">Automatically create invoices for active members.</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Generation Day</Label>
                                        <Select defaultValue={settings.autoBillDate} onValueChange={(v) => handleSelectChange('autoBillDate', v)}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1st of Month</SelectItem>
                                                <SelectItem value="5">5th of Month</SelectItem>
                                                <SelectItem value="10">10th of Month</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-slate-500">Bills will be created at 00:00 on this day.</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label>Receipt Footer Text</Label>
                                    <Input id="receiptFooter" value={settings.receiptFooter} onChange={handleChange} />
                                    <p className="text-[10px] text-slate-500">This message appears at the bottom of all printed receipts.</p>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-slate-100 px-6 py-4 bg-slate-50 rounded-b-xl flex justify-end">
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>Save Changes</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: NOTIFICATIONS */}
                    <TabsContent value="notifications" className="mt-0">
                        <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
                            <CardHeader>
                                <CardTitle>Notifications & Alerts</CardTitle>
                                <CardDescription>Configure how the system communicates.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><Mail className="w-5 h-5" /></div>
                                        <div>
                                            <p className="font-medium text-slate-900">Email Alerts</p>
                                            <p className="text-xs text-slate-500">Send receipts via email.</p>
                                        </div>
                                    </div>
                                    <Switch checked={settings.emailEnabled} onCheckedChange={() => handleToggle('emailEnabled')} />
                                </div>
                                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-green-50 text-green-600 rounded-full"><Smartphone className="w-5 h-5" /></div>
                                        <div>
                                            <p className="font-medium text-slate-900">SMS / WhatsApp</p>
                                            <p className="text-xs text-slate-500">Send payment reminders via WhatsApp integration.</p>
                                        </div>
                                    </div>
                                    <Switch checked={settings.smsEnabled} onCheckedChange={() => handleToggle('smsEnabled')} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 4: TEAM */}
                    <TabsContent value="team" className="mt-0">
                        <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Team Management</CardTitle>
                                        <CardDescription>Manage user access and roles.</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm"><Users className="w-4 h-4 mr-2" /> Invite User</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {teamMembers.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">{member.name.substring(0,2)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{member.name}</p>
                                                    <p className="text-xs text-slate-500">{member.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary" className="bg-white border border-slate-200 text-slate-600 font-normal">{member.role}</Badge>
                                                <Button variant="ghost" size="sm" className="text-slate-400">Edit</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 5: BACKUP (DANGER) */}
                    <TabsContent value="backup" className="mt-0">
                        <Card className="rounded-xl border-rose-100 shadow-sm bg-white">
                            <CardHeader>
                                <CardTitle className="text-rose-700 flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5" /> Danger Zone
                                </CardTitle>
                                <CardDescription>Manage system data and backups. Proceed with caution.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
                                    <div>
                                        <p className="font-medium text-slate-900">Database Backup</p>
                                        <p className="text-xs text-slate-500">Download a full SQL dump of the current system.</p>
                                    </div>
                                    <Button variant="outline" className="bg-white border-slate-300">
                                        <Download className="w-4 h-4 mr-2" /> Download SQL
                                    </Button>
                                </div>

                                <div className="p-4 border border-rose-200 rounded-lg bg-rose-50 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-rose-800">Factory Reset</p>
                                        <p className="text-xs text-rose-600">This will wipe all members, payments, and expenses permanently.</p>
                                    </div>
                                    <Button variant="destructive">Reset All Data</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </div>
            </div>
        </Tabs>

      </motion.div>
    </div>
  );
}