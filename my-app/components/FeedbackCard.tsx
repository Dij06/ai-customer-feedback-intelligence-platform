"use client";

interface FeedbackItem {
  id: string;
  title?: string;
  content: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  urgency: boolean;
  category?: string;
  createdAt: string;
}

export default function FeedbackCard({ item }: { item: FeedbackItem }) {
  const sentimentStyles = {
    POSITIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    NEUTRAL: "bg-slate-50 text-slate-700 border-slate-200",
    NEGATIVE: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="font-semibold text-gray-900 text-base leading-snug">
            {item.title || item.content.slice(0, 40) + "..."}
          </h4>
          
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
              sentimentStyles[item.sentiment] || sentimentStyles.NEUTRAL
            }`}
          >
            {item.sentiment}
          </span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
          {item.category || "General"}
        </span>

        {item.urgency && (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 font-semibold rounded flex items-center gap-1">
            ⚠️ Urgent
          </span>
        )}
      </div>
    </div>
  );
}