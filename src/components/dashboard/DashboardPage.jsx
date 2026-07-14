"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  LayoutDashboard,
  Wallet,
  Users,
  User,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Search,
  Trash2,
  TrendingUp,
  Calendar,
  ChevronRight,
  HandCoins,
  UserPlus,
  Receipt,
  Settings,
  LogOut,
  Plus
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// --- MOCK DATA ---
const stats = [
  { title: "Total Donations", value: "Rs. 1,245,000", change: "+12.5%", trend: "up", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-100" },
  { title: "Monthly Expenses", value: "Rs. 82,500", change: "-2.4%", trend: "down", icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-100" },
  { title: "Active Members", value: "854", change: "+5.2%", trend: "up", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
  { title: "Pending Approvals", value: "12", change: "Requires Action", trend: "neutral", icon: FileText, color: "text-amber-600", bg: "bg-amber-100" },
];

const initialActivities = [
  { id: 1, type: "Donation", title: "Friday Collection", amount: "+ Rs. 12,500", date: "Today, 2:30 PM", status: "Completed" },
  { id: 2, type: "Expense", title: "Utility Bill (Electricity)", amount: "- Rs. 4,500", date: "Yesterday, 10:15 AM", status: "Processed" },
  { id: 3, type: "Member", title: "New Member: Ahmed K.", amount: "-", date: "Oct 24, 2023", status: "Approved" },
  { id: 4, type: "Maintenance", title: "Audio System Repair", amount: "- Rs. 2,000", date: "Oct 23, 2023", status: "Pending" },
  { id: 5, type: "Donation", title: "Zakat Fund - Mr. Nazeer", amount: "+ Rs. 50,000", date: "Oct 22, 2023", status: "Completed" },
];

const initialNotifications = [
  { id: 1, text: "New donation received: Rs. 50,000", time: "2 min ago", read: false },
  { id: 2, text: "Monthly Electricity bill generated", time: "1 hour ago", read: false },
  { id: 3, text: "Member #402 payment overdue", time: "5 hours ago", read: true },
];

const monthlyChartData = [
  { name: "Jan", donations: 420000, expenses: 240000 },
  { name: "Feb", donations: 380000, expenses: 139000 },
  { name: "Mar", donations: 520000, expenses: 980000 },
  { name: "Apr", donations: 278000, expenses: 390800 },
  { name: "May", donations: 489000, expenses: 480000 },
  { name: "Jun", donations: 639000, expenses: 380000 },
  { name: "Jul", donations: 849000, expenses: 430000 },
];

// --- ANIMATION VARIANTS ---
const menuVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }
};

import { signOut, useSession } from "next-auth/react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/api";

// ... (keep imports)

import { DashboardSkeleton } from "./DashboardSkeleton";
import { QuickActions } from "@/components/general/QuickActions";

// ... (keep imports)

export default function MosqueDashboard() {
  const { data: session } = useSession();
  const { data: settings } = useSWR('/settings/app', apiFetcher);

  // State Management
  // Dropdown States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // UI States
  const [notifications, setNotifications] = useState(initialNotifications);
  const [searchTerm, setSearchTerm] = useState("");

  // Data Fetching with SWR
  const { data: dashboardData, isLoading: swrLoading } = useSWR("/dashboard", apiFetcher);

  // Stats Icon Mapping
  const iconMap = {
    Wallet: Wallet,
    TrendingUp: TrendingUp,
    Users: Users,
    FileText: FileText
  };

  const dashboardStats = dashboardData?.stats?.map(s => ({
    ...s,
    icon: iconMap[s.iconName] || Wallet
  })) || [];

  const activities = dashboardData?.activities || [];
  const loading = swrLoading;

  // Refs for click outside
  const notifRef = useRef(null);
  const userRef = useRef(null);

  // --- HANDLERS ---



  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(event.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search Logic (Client-side filtering of fetched activities)
  // Note: For large datasets, this should be server-side.
  const filteredActivities = activities.filter(act =>
    act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.amount.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Notification Logic
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 -mt-14">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>


      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Top Row: Welcome & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
            <p className="text-slate-500">Welcome back, {session?.user?.name || "Administrator"}. Here's what's happening.</p>
          </div>

          <div className="flex gap-3">
            <Link href="/billing/bulk-collection" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm transition-all">
              <Plus className="h-4 w-4" />
              Add Sanda
            </Link>
            <button className="hidden sm:flex px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
              Download Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group"
            >
              {/* Subtle background glow effect on hover */}
              <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl ${stat.bg}`}></div>
              
              <div className="relative z-10 flex items-center justify-between mb-6">
                <div className={`p-3.5 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center ring-4 ring-slate-50`}>
                  <stat.icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
                {stat.trend !== "neutral" && (
                  <div className={`flex items-center text-xs font-bold ${stat.trend === "up" ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"} px-2.5 py-1.5 rounded-full shadow-sm`}>
                    {stat.trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5 mr-1" strokeWidth={3} /> : <ArrowDownRight className="h-3.5 w-3.5 mr-1" strokeWidth={3} />}
                    {stat.change}
                  </div>
                )}
              </div>
              
              <div className="relative z-10">
                <h3 className="text-slate-500 text-sm font-semibold mb-1">{stat.title}</h3>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="mb-8 bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Monthly Overview
              </h3>
              <select className="text-sm border-slate-200 rounded-md bg-slate-50 text-slate-600 px-3 py-1.5 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                <option>This Year</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `Rs ${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`Rs. ${value.toLocaleString()}`]}
                  />
                  <Area type="monotone" dataKey="Income" name="Income" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorDonations)" />
                  <Area type="monotone" dataKey="Expense" name="Expenses" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 gap-8">

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-emerald-600" />
                Recent Transactions
              </h3>
              <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">View All</button>
            </div>

            <div className="divide-y divide-slate-50 flex-1">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <div key={activity.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${activity.type === "Donation" ? "bg-emerald-100 text-emerald-600" :
                          activity.type === "Expense" ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                        }`}>
                        {activity.type === "Donation" ? <ArrowUpRight className="h-5 w-5" /> :
                          activity.type === "Expense" ? <ArrowDownRight className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-emerald-900 transition-colors">{activity.title}</p>
                        <p className="text-xs text-slate-500">{activity.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${activity.amount.includes("+") ? "text-emerald-600" : activity.amount.includes("-") ? "text-slate-800" : "text-slate-400"}`}>
                        {activity.amount}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${activity.status === "Completed" ? "bg-emerald-50 text-emerald-600" :
                          activity.status === "Approved" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                        }`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400">No activities found matching "{searchTerm}"</div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Icon Helper
function ActivityIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
}