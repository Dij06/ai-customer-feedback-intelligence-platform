import { Inbox } from "lucide-react";

export default function EmptyState({ title, description }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-200 rounded-2xl bg-slate-50/50 text-center">
      <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 mb-3 text-slate-400">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-700">{title || "No feedback available"}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        {description || "Import CSV files or submit a feedback response to see real-time analytics."}
      </p>
    </div>
  );
}