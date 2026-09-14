import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-xl text-sky-600">
          <span>❖</span> Loop
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Get started free →
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <section className="text-center px-4 max-w-4xl mx-auto my-auto py-12">
        <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight mb-4">
          Every customer voice, <br />
          <span className="text-sky-500">turned into a clear next step.</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-8">
          Loop collects feedback from every channel, has AI analyze it in seconds, and tells your team exactly what to fix first.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Get started free →
          </Link>
          <Link
            href="/login"
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-lg font-medium transition"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}