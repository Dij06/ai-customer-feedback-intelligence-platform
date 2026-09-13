'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] dark:bg-[#0b0f19] flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-2xl font-black border border-rose-200 dark:border-rose-500/20">
          !
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#1A1F36] dark:text-white">Something Went Wrong</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            An unexpected error occurred while loading feedback data.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2.5 rounded-xl bg-[#2D68FF] text-white text-xs font-bold hover:bg-blue-600 shadow-sm transition-all"
          >
            Try Again
          </button>
          <Link
            href="/feedback"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all inline-block"
          >
            Return to Inbox
          </Link>
        </div>
      </div>
    </div>
  );
}
