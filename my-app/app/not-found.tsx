import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] dark:bg-[#0b0f19] flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-[#2D68FF] flex items-center justify-center mx-auto text-2xl font-black border border-blue-200 dark:border-blue-500/20">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#1A1F36] dark:text-white">Page Not Found</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The feedback page or route you are looking for does not exist in this workspace.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/feedback"
            className="px-4 py-2.5 rounded-xl bg-[#2D68FF] text-white text-xs font-bold hover:bg-blue-600 shadow-sm transition-all"
          >
            Go to Feedback Inbox
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-all"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
