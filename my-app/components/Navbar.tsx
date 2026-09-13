'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const [role, setRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER' | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    if (!isSignedIn) {
      return;
    }

    async function loadContext() {
      try {
        const res = await fetch('/api/workspace/members');
        const data = await res.json();
        if (!ignore && data.success && data.workspace) {
          setWorkspaceName(data.workspace.name);
          if (data.currentRole && ['ADMIN', 'ANALYST', 'VIEWER'].includes(data.currentRole)) {
            setRole(data.currentRole);
          }
        }
      } catch (err) {
        console.error('Error loading workspace context:', err);
      }
    }

    loadContext();
    return () => {
      ignore = true;
    };
  }, [isSignedIn]);

  const activeRole = isSignedIn ? role : null;
  const activeWorkspaceName = isSignedIn ? workspaceName : null;

  const navItems = [
    { label: 'Inbox', href: '/feedback' },
    { label: 'Trends', href: '/trends' },
    { label: 'Ask AI', href: '/ask' },
    { label: 'Reports', href: '/reports' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Team', href: '/workspace/members' },
  ];

  const getRoleBadgeColor = (userRole: 'ADMIN' | 'ANALYST' | 'VIEWER') => {
    switch (userRole) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      case 'ANALYST':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'VIEWER':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">
              LOOP
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/feedback' && pathname.startsWith('/feedback'));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs dark:bg-blue-600/15 dark:text-blue-400 dark:border-blue-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tenant, role, theme, and auth */}
        <div className="flex items-center gap-2.5">
          {/* Active Workspace Display */}
          {activeWorkspaceName && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {activeWorkspaceName}
            </div>
          )}

          {/* Active Role Badge */}
          {activeRole && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getRoleBadgeColor(activeRole)}`}>
              Role: {activeRole}
            </span>
          )}

          {/* Theme Switcher Toggle */}
          <ThemeToggle />

          {/* Clerk Auth: User Profile Avatar & Sign In */}
          {isLoaded && (
            isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all">
                  Sign In
                </button>
              </SignInButton>
            )
          )}
        </div>
      </div>
    </header>
  );
}
