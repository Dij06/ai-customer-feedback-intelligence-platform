"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-slate-400 mt-2 text-center max-w-md text-sm">
        An unexpected error occurred while processing feedback data.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-xl text-sm font-semibold transition-all"
      >
        Try Again
      </button>
    </div>
  );
}
