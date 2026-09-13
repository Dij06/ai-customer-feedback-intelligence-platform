import FeedbackForm from "@/components/FeedbackForm";
import FeedbackInbox from "@/components/FeedbackInbox";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center md:text-left border-b border-slate-200 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Customer Feedback Intelligence
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          </p>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <FeedbackForm />
          </div>
          <div className="lg:col-span-2">
            <FeedbackInbox />
          </div>
        </div>
      </div>
    </main>
  );
}