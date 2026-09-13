import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-[#F8F9FA] dark:bg-[#0b0f19] transition-colors min-h-[calc(100vh-4rem)]">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-[#2D68FF]/15 via-[#8B5CF6]/10 to-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Top pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-xs text-xs font-bold text-[#1A1F36] dark:text-slate-200">
            <span className="w-2 h-2 rounded-full bg-[#2D68FF]" />
            AI-Powered Customer Feedback Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-[#2D68FF] to-[#8B5CF6] bg-clip-text text-transparent pb-1">
            Collect, understand, and act on customer feedback
          </h1>

          <p className="text-base sm:text-lg font-medium text-[#1A1F36] dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Bring feedback from Email, Twitter, Discord, Support Tickets, and Surveys into one place. Automatically score sentiment, group topics, and fix critical product issues faster.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/feedback"
              className="px-6 py-3.5 text-sm font-semibold text-white bg-[#2D68FF] hover:bg-blue-600 rounded-xl shadow-md shadow-[#2D68FF]/25 hover:shadow-lg transition-all hover:scale-105"
            >
              Open Feedback Inbox →
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3.5 text-sm font-semibold text-white bg-[#1A1F36] hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-700/50 rounded-xl shadow-md transition-all hover:scale-105"
            >
              View Analytics Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500/40 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-200 dark:border-indigo-500/20 shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Trending Topics</div>
            <h2 className="text-lg font-bold text-[#1A1F36] dark:text-white">Customer Feedback Trends</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Automatically cluster customer comments by topic, track volume over time, and catch sudden complaint surges early.
            </p>
            <Link href="/trends" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-block pt-1">
              View Trends →
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/40 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#2D68FF] flex items-center justify-center font-bold border border-blue-200 dark:border-blue-500/20 shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="text-2xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">AI Assistant</div>
            <h2 className="text-lg font-bold text-[#1A1F36] dark:text-white">Ask LOOP</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Ask plain-English questions about what customers want and get clear answers backed by real customer reviews.
            </p>
            <Link href="/ask" className="text-xs font-semibold text-[#2D68FF] hover:underline inline-block pt-1">
              Ask Questions →
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/40 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-2xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Executive Digest</div>
            <h2 className="text-lg font-bold text-[#1A1F36] dark:text-white">Summary Reports</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Generate weekly and monthly executive summaries complete with sentiment shifts, customer quotes, and action items.
            </p>
            <Link href="/reports" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-block pt-1">
              Create Report →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}