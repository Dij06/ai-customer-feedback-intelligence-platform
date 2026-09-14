"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public pages that should not display the dashboard sidebar
  const isPublicPage =
    pathname === "/" ||
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up");

  if (isPublicPage) {
    return (
      <main className="flex-1 flex flex-col min-h-screen w-full">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Vertical Sidebar Navigation */}
      <Sidebar />

      {/* Main Scrollable Content Area */}
      <main className="flex-1 lg:pl-72 flex flex-col min-h-screen overflow-x-hidden">
        <div className="flex-1 w-full">{children}</div>
      </main>
    </div>
  );
}

export default AppShell;
