"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "./ThemeToggle";
import {
  LayoutDashboard,
  Inbox,
  TrendingUp,
  Sparkles,
  FileBarChart,
  Settings,
  Menu,
  X,
  Layers,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded, user } = useUser();
  const [role, setRole] = useState<"ADMIN" | "ANALYST" | "VIEWER" | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!isSignedIn) return;

    async function loadWorkspaceContext() {
      try {
        const res = await fetch("/api/workspace/members");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.success && data.workspace) {
            setWorkspaceName(data.workspace.name);
            if (data.currentRole && ["ADMIN", "ANALYST", "VIEWER"].includes(data.currentRole)) {
              setRole(data.currentRole);
            }
          }
        }
      } catch (err) {
        console.error("Error loading workspace context:", err);
      }
    }

    loadWorkspaceContext();
    return () => {
      ignore = true;
    };
  }, [isSignedIn]);

  // Ordered Navigation Items: Dashboard 1st
  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Feedback Inbox",
      href: "/feedback",
      icon: Inbox,
    },
    {
      label: "AI Trends",
      href: "/trends",
      icon: TrendingUp,
    },
    {
      label: "Ask Loop AI",
      href: "/ask",
      icon: Sparkles,
    },
    {
      label: "VoC Reports",
      href: "/reports",
      icon: FileBarChart,
    },
    {
      label: "Settings & Team",
      href: "/settings",
      icon: Settings,
    },
  ];

  const getRoleBadgeColor = (userRole: string | null) => {
    switch (userRole) {
      case "ADMIN":
        return "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30";
      case "ANALYST":
        return "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30";
      case "VIEWER":
        return "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };


  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-16 bg-white dark:bg-[#0b0f19] border-b border-slate-200 dark:border-slate-800 backdrop-blur-md w-full shrink-0">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">LOOP</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Vertical Sidebar Navigation Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0b0f19] border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Section: Brand & Workspace */}
        <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 font-bold text-xl group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                  LOOP
                </span>
                <span className="text-[10px] block text-slate-400 font-semibold tracking-wider uppercase">
                  Feedback Intelligence
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Workspace & Role Indicator Card */}
          <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {workspaceName || "Default Workspace"}
                </div>
                <div className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Tenant
                </div>
              </div>
            </div>

            {role && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase shrink-0 ${getRoleBadgeColor(
                  role
                )}`}
              >
                {role}
              </span>
            )}
          </div>
        </div>

        {/* Center Section: Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/feedback" && pathname?.startsWith("/feedback")) ||
              (item.href === "/settings" && pathname?.startsWith("/workspace"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-blue-500"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Section: Theme Switcher & User Profile */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Appearance</span>
            <ThemeToggle />
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
            {isLoaded && isSignedIn ? (
              <div className="flex items-center gap-3 w-full">
                <UserButton />
                <div className="overflow-hidden flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {user?.fullName || user?.firstName || "Account"}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {user?.primaryEmailAddress?.emailAddress || "Signed in"}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="w-full text-center py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

