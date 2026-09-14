import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex flex-col justify-between">
      {/* Hero Section */}
      <section className="text-center px-4 py-20 max-w-4xl mx-auto my-auto flex flex-col items-center">
        <span className="text-xs uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 border border-slate-800 px-3 py-1 rounded-full bg-slate-900/50">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> AI-Powered Customer Intelligence
        </span>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
          Every customer voice, <br />
          turned into a clear next step.
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed">
          Loop collects feedback from every channel, analyzes sentiment with AI, and surfaces critical product insights so nothing important gets lost.
        </p>

        {isSignedIn ? (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-semibold transition shadow-lg shadow-blue-600/30 hover:scale-105"
            >
              Open Dashboard &rarr;
            </Link>
            <Link
              href="/feedback"
              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-semibold transition hover:scale-105"
            >
              Feedback Inbox
            </Link>
            <Link
              href="/trends"
              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-semibold transition hover:scale-105"
            >
              AI Trends
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-semibold transition shadow-lg shadow-blue-600/30 hover:scale-105"
            >
              Get started free &rarr;
            </Link>
            <Link
              href="/sign-in"
              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-semibold transition hover:scale-105"
            >
              Sign in
            </Link>
          </div>
        )}
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Analytics</div>
          <h2 className="text-lg font-bold text-white mb-2">Executive Dashboard</h2>
          <p className="text-sm text-slate-400">View real-time sentiment distribution, total feedback count, and recent imports.</p>
          <Link href="/dashboard" className="text-xs font-semibold text-blue-400 hover:underline inline-block mt-4">
            Explore Dashboard &rarr;
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
          <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Clustering</div>
          <h2 className="text-lg font-bold text-white mb-2">Customer Trends</h2>
          <p className="text-sm text-slate-400">Auto-cluster customer feedback into themes with xAI Grok intelligence processing.</p>
          <Link href="/trends" className="text-xs font-semibold text-purple-400 hover:underline inline-block mt-4">
            View Trends &rarr;
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Assistant</div>
          <h2 className="text-lg font-bold text-white mb-2">Ask Loop AI</h2>
          <p className="text-sm text-slate-400">Ask natural language questions across all customer feedback records.</p>
          <Link href="/ask" className="text-xs font-semibold text-emerald-400 hover:underline inline-block mt-4">
            Ask Questions &rarr;
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        &copy; {new Date().getFullYear()} Loop. All rights reserved.
      </footer>
    </main>
  );
}

