"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Inbox,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Check,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import ClearDataModal from "@/components/ClearDataModal";

interface FeedbackItem {
  id: string;
  content: string;
  source: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  sentimentScore: number;
  category: string | null;
  urgency: "High" | "Medium" | "Low";
  status: "NEW" | "REVIEWED" | "ACTIONED";
  customerName: string | null;
  customerEmail: string | null;
  summary: string | null;
  tags: string[];
  createdAt: string;
}

interface Stats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  highUrgency: number;
  positiveRatio: number;
}

export default function FeedbackInboxPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    highUrgency: 0,
    positiveRatio: 0,
  });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const loadFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sentimentFilter !== "ALL") params.set("sentiment", sentimentFilter);
      if (urgencyFilter !== "ALL") params.set("urgency", urgencyFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFeedbacks(data);
          // Calculate stats
          const total = data.length;
          const pos = data.filter((f) => f.sentiment === "Positive").length;
          const neu = data.filter((f) => f.sentiment === "Neutral").length;
          const neg = data.filter((f) => f.sentiment === "Negative").length;
          const urgent = data.filter((f) => f.urgency === "High").length;
          const posRatio = total > 0 ? Math.round((pos / total) * 100) : 0;
          setStats({
            total,
            positive: pos,
            neutral: neu,
            negative: neg,
            highUrgency: urgent,
            positiveRatio: posRatio,
          });
        } else if (data.feedbacks) {
          setFeedbacks(data.feedbacks);
          if (data.stats) setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      toast.error("Failed to load feedback inbox");
    } finally {
      setLoading(false);
    }
  }, [sentimentFilter, urgencyFilter, statusFilter, categoryFilter, search]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  // Seed Data Handler
  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/feedback/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Sample feedback seeded successfully!");
        loadFeedbacks();
      } else {
        toast.error(data.error || "Failed to seed sample data");
      }
    } catch (err) {
      toast.error("Error seeding feedback data");
    } finally {
      setSeeding(false);
    }
  };

  // Clear all feedbacks in workspace
  const handleConfirmClear = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/feedback?clearAll=true", { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "All feedback items cleared.");
        setShowClearModal(false);
        loadFeedbacks();
      } else {
        toast.error(data.error || "Failed to clear feedback");
      }
    } catch (err) {
      toast.error("Error clearing feedback data");
    } finally {
      setClearing(false);
    }
  };

  // Delete single feedback
  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Delete this feedback item?")) return;
    try {
      const res = await fetch(`/api/feedback?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Feedback deleted");
        setFeedbacks((prev) => prev.filter((item) => item.id !== id));
        setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      } else {
        toast.error("Failed to delete feedback");
      }
    } catch (err) {
      toast.error("Error deleting feedback");
    }
  };

  // Triage status change
  const handleTriage = async (id: string, newStatus: "NEW" | "REVIEWED" | "ACTIONED") => {
    try {
      const res = await fetch(`/api/feedback/${id}/triage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Marked as ${newStatus}`);
        setFeedbacks((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      } else {
        // Fallback optimistic update
        setFeedbacks((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        toast.success(`Status updated to ${newStatus}`);
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
      case "negative":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "high":
        return "bg-rose-500/10 text-rose-500 border-rose-500/30";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-6 min-w-0">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
              <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Customer Feedback Inbox
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time omnichannel feedback stream with automated AI sentiment analysis and triage workflow.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setShowClearModal(true)}
            disabled={seeding || clearing}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 transition-colors shadow-2xs disabled:opacity-40"
            title="Reset this workspace to 0 feedbacks"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{clearing ? "Clearing..." : "Clear All"}</span>
          </button>

          <Link
            href="/feedback/import"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import CSV</span>
          </Link>

          <button
            onClick={handleSeedData}
            disabled={seeding || clearing}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-white dark:bg-indigo-600/15 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/30 transition-colors shadow-2xs disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>{seeding ? "Populating..." : "Add Sample Data"}</span>
          </button>

          <Link
            href="/feedback/new"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Feedback</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Feedback</span>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Positive</span>
          <p className="text-xl font-extrabold text-emerald-500">{stats.positive}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Neutral</span>
          <p className="text-xl font-extrabold text-amber-500">{stats.neutral}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Negative</span>
          <p className="text-xl font-extrabold text-rose-500">{stats.negative}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">High Urgency</span>
          <p className="text-xl font-extrabold text-rose-400">{stats.highUrgency}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keywords, customer name, comments..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">All Urgency</option>
            <option value="High">High Urgency</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="REVIEWED">REVIEWED</option>
            <option value="ACTIONED">ACTIONED</option>
          </select>
        </div>
      </div>

      {/* Feedback Items List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3"
              >
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
            <Inbox className="w-10 h-10 mx-auto text-slate-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Feedback Items Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&rsquo;t added any customer feedback yet. Click &ldquo;Add Sample Data&rdquo; to populate realistic reviews across all channels.
            </p>
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md"
            >
              {seeding ? "Adding Data..." : "Add Sample Data Now"}
            </button>
          </div>
        ) : (
          feedbacks.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/40 hover:shadow-md transition-all space-y-3"
            >
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Sentiment */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getSentimentBadge(
                      item.sentiment
                    )}`}
                  >
                    {item.sentiment}
                  </span>

                  {/* Urgency */}
                  {item.urgency && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getUrgencyBadge(
                        item.urgency
                      )}`}
                    >
                      {item.urgency} Urgency
                    </span>
                  )}

                  {/* Category */}
                  {item.category && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.category}
                    </span>
                  )}

                  {/* Source */}
                  <span className="text-[11px] text-slate-400">
                    via {item.source} &bull; {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Triage Status Pills & Delete */}
                <div className="flex items-center gap-1.5">
                  {(["NEW", "REVIEWED", "ACTIONED"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleTriage(item.id, status)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                        item.status === status
                          ? status === "ACTIONED"
                            ? "bg-emerald-600 text-white"
                            : status === "REVIEWED"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                          : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {status}
                    </button>
                  ))}

                  <button
                    onClick={() => handleDeleteFeedback(item.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
                    title="Delete feedback item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                {item.content}
              </p>

              {/* Summary if available */}
              {item.summary && (
                <div className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 not-italic">
                    AI Summary:{" "}
                  </span>
                  {item.summary}
                </div>
              )}

              {/* Footer Details */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <span>
                  Customer: <strong className="text-slate-700 dark:text-slate-300">{item.customerName || "Anonymous"}</strong>{" "}
                  {item.customerEmail && `(${item.customerEmail})`}
                </span>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ClearDataModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClear}
        loading={clearing}
      />
    </div>
  );
}

