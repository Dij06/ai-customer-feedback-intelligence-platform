import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-xl font-bold">
          <span className="text-blue-500">➿</span> Loop
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/sign-in" className="text-sm font-medium hover:text-slate-300">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Get started free →
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center px-4 py-20 max-w-4xl mx-auto my-auto flex flex-col items-center">
        <span className="text-xs uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 border border-slate-800 px-3 py-1 rounded-full">
          <span>⚡</span> Powered by Gemini
        </span>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Every customer voice, <br />
          turned into a clear next step.
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-8">
          Loop collects feedback from every channel, has AI analyze it in seconds, and shows your team exactly what to fix first — so nothing important gets lost again.
        </p>

        <div className="flex gap-4">
          <Link
            href="/sign-up"
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Get started free →
          </Link>
          <Link
            href="/sign-in"
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        © {new Date().getFullYear()} Loop. All rights reserved.
      </footer>
    </main>
  );
}