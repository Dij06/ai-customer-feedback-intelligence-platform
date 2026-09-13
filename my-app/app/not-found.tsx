import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
      <h1 className="text-6xl font-extrabold text-purple-500">404</h1>
      <h2 className="text-2xl font-bold mt-4">Page Not Found</h2>
      <p className="text-slate-400 mt-2 text-center max-w-md">
        The page or workspace resource you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
