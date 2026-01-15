"use client";

import { Search, Bell, User, Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { QuickActions } from "@/components/general/QuickActions";

export default function Header() {
  const [notifications] = useState(3);
  const { setTheme, theme } = useTheme();
  const { data: session } = useSession();
  const fetcher = (url) => fetch(url).then((res) => res.json());
  const { data: settings } = useSWR('/api/settings/app', fetcher);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">POS</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {settings?.mosqueName || "Masjid System"}
              </h1>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <QuickActions />
            {/* Search */}

            {/* Theme Toggle */}
            {/* <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button> */}

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            {/* User Profile */}
            <button className="flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <User className="w-5 h-5" />
              <span className="hidden sm:block text-sm font-medium capitalize">{session?.user?.role || "User"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
