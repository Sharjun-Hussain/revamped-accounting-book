"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  LayoutDashboard,
  Wallet,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Search,
  Trash2,
  TrendingUp,
  Calendar,
  ChevronRight
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

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

const upcomingEvents = [
  { id: 1, title: "Tafsir Class", time: "7:15 PM", date: "Friday", attendees: "450+" },
  { id: 2, title: "Ladies Bayan", time: "4:30 PM", date: "Saturday", attendees: "120" },
  { id: 3, title: "Quran Class ", time: "10:00 AM", date: "Sunday", attendees: "35" },
];

// --- ANIMATION VARIANTS ---
const menuVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }
};

import { accountingService } from "@/services/accountingService";
import { signOut } from "next-auth/react";

// ... (keep imports)

import { DashboardSkeleton } from "./DashboardSkeleton";

// ... (keep imports)

export default function MosqueDashboard() {
  // State Management
  // Dropdown States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Data States
  const [notifications, setNotifications] = useState(initialNotifications);
  const [searchTerm, setSearchTerm] = useState("");
  const [activities, setActivities] = useState([]);
  const [dashboardStats, setDashboardStats] = useState([]); // Initialize as empty
  const [loading, setLoading] = useState(true);

  // Refs for click outside
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const quickRef = useRef(null);

  // --- HANDLERS ---

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await accountingService.getDashboardStats();
        
        // Map API stats to UI format
        // The API returns stats array with correct structure, so we can use it directly or map if needed.
        // Let's assume API returns matching structure.
        if (data.stats) {
            // Need to map icons back because they are strings in API response (if we sent strings)
            // But wait, I sent iconName in API. I need to map string to component.
            const iconMap = {
                Wallet: Wallet,
                TrendingUp: TrendingUp,
                Users: Users,
                FileText: FileText
            };
            
            const mappedStats = data.stats.map(s => ({
                ...s,
                icon: iconMap[s.iconName] || Wallet // Fallback
            }));
            setDashboardStats(mappedStats);
        }

        if (data.activities) {
            setActivities(data.activities);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(event.target)) setShowUserMenu(false);
      if (quickRef.current && !quickRef.current.contains(event.target)) setShowQuickActions(false);
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>

      {/* --- NAVIGATION BAR --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Moon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-emerald-950 tracking-tight">Masjidhul Haadhi</h1>
                <p className="text-xs text-emerald-600 font-medium">Masjid Admin</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              
              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-100 border-transparent border-2 focus:border-emerald-500 focus:bg-white rounded-full text-sm w-64 transition-all outline-none"
                />
              </div>

              {/* Notifications Dropdown */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 relative hover:bg-slate-100 rounded-full transition-colors outline-none"
                >
                  <Bell className="h-5 w-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      variants={menuVariants} initial="hidden" animate="visible" exit="exit"
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h4 className="font-semibold text-sm text-slate-700">Notifications</h4>
                        {notifications.length > 0 && (
                          <button onClick={clearNotifications} className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Clear
                          </button>
                        )}
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-sm">No new notifications</div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} 
                                 className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${notif.read ? 'opacity-60' : 'bg-emerald-50/30'}`}
                                 onClick={() => markAsRead(notif.id)}
                            >
                              <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                              <div>
                                <p className="text-sm text-slate-800 leading-tight">{notif.text}</p>
                                <span className="text-xs text-slate-400 block mt-1">{notif.time}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-2 bg-slate-50 text-center">
                        <button className="text-xs font-medium text-emerald-700 hover:underline">View All Activity</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Profile Dropdown */}
              <div className="relative" ref={userRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 hover:bg-slate-100 p-1 pr-3 rounded-full transition-colors outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200 text-emerald-700 font-semibold text-sm">
                    MA
                  </div>
                  <span className="text-xs font-medium text-slate-600">Admin</span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div 
                      variants={menuVariants} initial="hidden" animate="visible" exit="exit"
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1"
                    >
                      <div className="px-4 py-2 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-800">Masjid Admin</p>
                        <p className="text-xs text-slate-500">admin@almanar.lk</p>
                      </div>
                      <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
                        <User className="w-4 h-4" /> My Profile
                      </a>
                      <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
                        <Settings className="w-4 h-4" /> Settings
                      </a>
                      <div className="border-t border-slate-100 my-1"></div>
                      <button 
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 text-left"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <SidebarTrigger />
            </div>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Top Row: Welcome & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
            <p className="text-slate-500">Welcome back, Administrator. Here's what's happening.</p>
          </div>
          
          <div className="flex gap-3 relative" ref={quickRef}>
            <button className="hidden sm:flex px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
              Download Report
            </button>
            
            <button 
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Quick Action
            </button>

            {/* Quick Actions Dropdown */}
            <AnimatePresence>
              {showQuickActions && (
                <motion.div 
                  variants={menuVariants} initial="hidden" animate="visible" exit="exit"
                  className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-40 p-2"
                >
                  <div className="grid grid-cols-1 gap-1">
                    <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 text-left group">
                      <div className="bg-emerald-100 p-2 rounded-md text-emerald-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <HandCoins className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-slate-800">Add Donation</span>
                        <span className="block text-xs text-slate-500">Record incoming funds</span>
                      </div>
                    </button>
                    
                    <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 text-left group">
                      <div className="bg-blue-100 p-2 rounded-md text-blue-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-slate-800">New Member</span>
                        <span className="block text-xs text-slate-500">Register Sanda payer</span>
                      </div>
                    </button>

                    <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-rose-50 text-left group">
                      <div className="bg-rose-100 p-2 rounded-md text-rose-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-slate-800">Record Expense</span>
                        <span className="block text-xs text-slate-500">Track spending</span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                {stat.trend !== "neutral" && (
                  <div className={`flex items-center text-xs font-semibold ${stat.trend === "up" ? "text-emerald-600" : "text-rose-600"} bg-opacity-10 px-2 py-1 rounded-full`}>
                    {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {stat.change}
                  </div>
                )}
              </div>
              <h3 className="text-slate-500 text-sm font-medium">{stat.title}</h3>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Lower Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
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
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        activity.type === "Donation" ? "bg-emerald-100 text-emerald-600" : 
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
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                        activity.status === "Completed" ? "bg-emerald-50 text-emerald-600" : 
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

          {/* Right Sidebar: Events & Funds */}
          <div className="space-y-6">
            
            {/* Event Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Moon className="h-24 w-24 text-emerald-600 transform rotate-12" />
              </div>
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                Upcoming Events
              </h3>
              <div className="space-y-4 relative z-10">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="bg-emerald-50 text-emerald-700 rounded-lg p-2 text-center min-w-[3.5rem]">
                      <span className="block text-xs font-bold uppercase">{event.date.substring(0, 3)}</span>
                      <span className="block text-lg font-bold">{event.id + 12}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{event.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {event.time} • {event.attendees} Exp.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg font-medium hover:bg-emerald-100 transition-colors">
                View Calendar
              </button>
            </div>

            {/* Zakat Fund Card */}
            <div className="bg-emerald-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 bg-emerald-800 w-24 h-24 rounded-full opacity-50 blur-xl"></div>
              <div className="absolute -top-4 -left-4 bg-emerald-500 w-20 h-20 rounded-full opacity-20 blur-xl"></div>

              <h3 className="font-bold text-lg mb-1">Zakat Fund Status</h3>
              <p className="text-emerald-200 text-sm mb-6">Cycle ending in 12 days</p>

              <div className="space-y-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Target</span>
                  <span>82%</span>
                </div>
                <div className="w-full bg-emerald-800 rounded-full h-2">
                  <div className="bg-emerald-400 h-2 rounded-full w-[82%]"></div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div>
                    <span className="text-xs text-emerald-300 block">Collected</span>
                    <span className="font-bold text-lg">Rs. 850,000</span>
                  </div>
                  <button className="bg-white text-emerald-900 p-2 rounded-lg hover:bg-emerald-50 transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
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