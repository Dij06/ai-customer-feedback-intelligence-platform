"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Inbox } from "lucide-react";

interface FeedbackInboxProps {
  workspaceId?: string;
}

export default function FeedbackInbox({ workspaceId }: FeedbackInboxProps) {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const categories = ["ALL", "POSITIVE", "NEUTRAL", "NEGATIVE"];

  useEffect(() => {
    if (!workspaceId || workspaceId === "undefined") {
      setFeedbacks([]);
      return;
    }

    const fetchFeedbacks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/feedback?workspaceId=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setFeedbacks(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching feedback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [workspaceId]);

  const filteredFeedbacks = feedbacks.filter((item) => {
    if (filter === "ALL") return true;
    return item.sentiment === filter;
  });

  return (
    <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Feedback Inbox
        </h3>
        <p className="text-xs text-slate-500">
          Total <span className="font-semibold">{filteredFeedbacks.length}</span> feedbacks
        </p>
      </div>

      {/* Filter Buttons UI */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              filter === cat
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feedbacks List */}
      <div className="space-y-3 min-h-[200px]">
        {loading ? (
          // --- SKELETON LOADING STATE ---
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded-lg animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          // --- PROFESSIONAL EMPTY STATE UI ---
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/50 text-center my-2">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No Feedbacks Found
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              You haven't added any feedback yet. Add direct feedback or upload a CSV file.
            </p>
          </div>
        ) : (
          // --- FEEDBACK CARDS LIST ---
          filteredFeedbacks.map((item) => (
            <div key={item.id} className="p-3 border rounded-lg bg-background hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-semibold">{item.title || item.content}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  item.sentiment === "POSITIVE" ? "bg-green-100 text-green-700" :
                  item.sentiment === "NEGATIVE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {item.sentiment || "NEUTRAL"}
                </span>
              </div>
              {item.description && <p className="text-xs text-slate-600 dark:text-slate-400">{item.description}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}