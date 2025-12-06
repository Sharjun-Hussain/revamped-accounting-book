"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
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
  Menu,
  X,
  TrendingUp,
  Calendar,
  ChevronRight,
} from "lucide-react";

// Mock Data
const stats = [
  {
    title: "Total Donations",
    value: "$124,500",
    change: "+12.5%",
    trend: "up",
    icon: Wallet,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  {
    title: "Monthly Expenses",
    value: "$8,250",
    change: "-2.4%",
    trend: "down",
    icon: TrendingUp,
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
  {
    title: "Active Members",
    value: "854",
    change: "+5.2%",
    trend: "up",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    title: "Pending Approvals",
    value: "12",
    change: "Requires Action",
    trend: "neutral",
    icon: FileText,
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
];

const recentActivities = [
  {
    id: 1,
    type: "Donation",
    title: "Friday Collection",
    amount: "+$1,250.00",
    date: "Today, 2:30 PM",
    status: "Completed",
  },
  {
    id: 2,
    type: "Expense",
    title: "Utility Bill (Electricity)",
    amount: "-$450.00",
    date: "Yesterday, 10:15 AM",
    status: "Processed",
  },
  {
    id: 3,
    type: "Member",
    title: "New Registration: Ahmed K.",
    amount: "-",
    date: "Oct 24, 2023",
    status: "Approved",
  },
  {
    id: 4,
    type: "Maintenance",
    title: "Audio System Repair",
    amount: "-$200.00",
    date: "Oct 23, 2023",
    status: "Pending",
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: "Jummah Prayer",
    time: "1:15 PM",
    date: "Friday",
    attendees: "450+",
  },
  {
    id: 2,
    title: "Community Iftar",
    time: "6:30 PM",
    date: "Saturday",
    attendees: "120",
  },
  {
    id: 3,
    title: "Quran Class (Kids)",
    time: "10:00 AM",
    date: "Sunday",
    attendees: "35",
  },
];

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

export default function MosqueDashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-200 text-slate-800">
      {/* Subtle Islamic Geometric Pattern Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Moon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-emerald-950 tracking-tight">
                  Al-Manar
                </h1>
                <p className="text-xs text-emerald-600 font-medium">
                  Masjid Admin
                </p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500 w-64 transition-all"
                />
              </div>
              <button className="p-2 relative hover:bg-slate-100 rounded-full transition-colors">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                <span className="text-emerald-700 font-semibold text-sm">
                  MA
                </span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
              >
                {isMobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden bg-white border-t border-slate-200"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              <a
                href="#"
                className="block px-3 py-2 rounded-md text-base font-medium text-emerald-700 bg-emerald-50"
              >
                Dashboard
              </a>
              <a
                href="#"
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50"
              >
                Donations
              </a>
              <a
                href="#"
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50"
              >
                Members
              </a>
              <a
                href="#"
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50"
              >
                Settings
              </a>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Dashboard Overview
              </h2>
              <p className="text-slate-500">
                Welcome back, Administrator. Here's what's happening today.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
                Download Report
              </button>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Quick Action
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  {stat.trend !== "neutral" && (
                    <div
                      className={`flex items-center text-xs font-semibold ${
                        stat.trend === "up"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      } bg-opacity-10 px-2 py-1 rounded-full`}
                    >
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      {stat.change}
                    </div>
                  )}
                  {stat.trend === "neutral" && (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  )}
                </div>
                <h3 className="text-slate-500 text-sm font-medium">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Lower Section Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ActivityIcon className="h-5 w-5 text-emerald-600" />
                  Recent Transactions
                </h3>
                <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">
                  View All
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          activity.type === "Donation"
                            ? "bg-emerald-100 text-emerald-600"
                            : activity.type === "Expense"
                            ? "bg-rose-100 text-rose-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {activity.type === "Donation" ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : activity.type === "Expense" ? (
                          <ArrowDownRight className="h-5 w-5" />
                        ) : (
                          <Users className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-emerald-900 transition-colors">
                          {activity.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activity.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          activity.amount.startsWith("+")
                            ? "text-emerald-600"
                            : activity.amount.startsWith("-")
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {activity.amount}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                          activity.status === "Completed"
                            ? "bg-emerald-50 text-emerald-600"
                            : activity.status === "Approved"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Upcoming Events / Sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
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
                    <div
                      key={event.id}
                      className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0"
                    >
                      <div className="bg-emerald-50 text-emerald-700 rounded-lg p-2 text-center min-w-[3.5rem]">
                        <span className="block text-xs font-bold uppercase">
                          {event.date.substring(0, 3)}
                        </span>
                        <span className="block text-lg font-bold">
                          {event.id + 12}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">
                          {event.title}
                        </h4>
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

              {/* Quick Transfer/Action Card */}
              <div className="bg-emerald-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute -bottom-4 -right-4 bg-emerald-800 w-24 h-24 rounded-full opacity-50 blur-xl"></div>
                <div className="absolute -top-4 -left-4 bg-emerald-500 w-20 h-20 rounded-full opacity-20 blur-xl"></div>

                <h3 className="font-bold text-lg mb-1">Zakat Fund Status</h3>
                <p className="text-emerald-200 text-sm mb-6">
                  Cycle ending in 12 days
                </p>

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
                      <span className="text-xs text-emerald-300 block">
                        Collected
                      </span>
                      <span className="font-bold text-lg">$24,500</span>
                    </div>
                    <button className="bg-white text-emerald-900 p-2 rounded-lg hover:bg-emerald-50 transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// Helper component for the recent activity section
function ActivityIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
}
