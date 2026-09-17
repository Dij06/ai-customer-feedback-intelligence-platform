"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Download,
  Tag,
  CheckSquare,
  Square,
  X,
  ChevronDown,
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

  // Filters & 300ms Debounced Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Tag Cloud Filter
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Bulk Triage State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Single Item Delete Modal State
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  // User Role State
  const [currentRole, setCurrentRole] = useState<"ADMIN" | "ANALYST" | "VIEWER" | null>(null);

  useEffect(() => {
    async function loadRole() {
      try {
        const res = await fetch("/api/workspace/members");
        if (res.ok) {
          const data = await res.json();
          if (data.currentRole) {
            setCurrentRole(data.currentRole);
          }
        }
      } catch (err) {
        console.error("Error fetching workspace role:", err);
      }
    }
    loadRole();
  }, []);

  const isAdmin = currentRole === "ADMIN";
  const canEdit = currentRole === "ADMIN" || currentRole === "ANALYST";
  const [deletingSingle, setDeletingSingle] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sentimentFilter !== "ALL") params.set("sentiment", sentimentFilter);
      if (urgencyFilter !== "ALL") params.set("urgency", urgencyFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFeedbacks(data);
          // Calculate stats
          const total = data.length;
          const pos = data.filter((f) => (f.sentiment || "").toUpperCase() === "POSITIVE").length;
          const neu = data.filter((f) => (f.sentiment || "").toUpperCase() === "NEUTRAL").length;
          const neg = data.filter((f) => (f.sentiment || "").toUpperCase() === "NEGATIVE").length;
          const urgent = data.filter((f) => (f.urgency || "").toUpperCase() === "HIGH").length;
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
  }, [sentimentFilter, urgencyFilter, statusFilter, categoryFilter, debouncedSearch]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  // Compute top 10 most frequent tags
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    feedbacks.forEach((f) => {
      (f.tags || []).forEach((t) => {
        const clean = t.trim().toLowerCase().replace(/^#/, "");
        if (clean) counts[clean] = (counts[clean] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [feedbacks]);

  // Filter feedbacks by selectedTag cloud
  const displayedFeedbacks = useMemo(() => {
    if (!selectedTag) return feedbacks;
    return feedbacks.filter((f) =>
      (f.tags || []).some(
        (t) => t.trim().toLowerCase().replace(/^#/, "") === selectedTag
      )
    );
  }, [feedbacks, selectedTag]);

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

  // Confirm and execute single feedback deletion
  const handleConfirmSingleDelete = async () => {
    if (!feedbackToDelete) return;
    setDeletingSingle(true);
    try {
      const res = await fetch(`/api/feedback?id=${feedbackToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Feedback deleted successfully");
        setFeedbacks((prev) => prev.filter((item) => item.id !== feedbackToDelete));
        setSelectedIds((prev) => prev.filter((id) => id !== feedbackToDelete));
        setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        setFeedbackToDelete(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Failed to delete feedback");
      }
    } catch (err) {
      toast.error("Error deleting feedback");
    } finally {
      setDeletingSingle(false);
    }
  };

  // Triage status change with proper error handling and state revert
  const handleTriage = async (id: string, newStatus: "NEW" | "REVIEWED" | "ACTIONED") => {
    try {
      const res = await fetch(`/api/feedback/${id}/triage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Marked as ${newStatus}`);
        setFeedbacks((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      } else {
        toast.error(data.error || "Permission Denied: Only Admins and Analysts can triage feedback");
        loadFeedbacks();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Export filtered feedbacks to CSV
  const handleExportCsv = () => {
    if (displayedFeedbacks.length === 0) {
      toast.error("No feedback items to export");
      return;
    }

    const headers = [
      "ID",
      "Customer Name",
      "Customer Email",
      "Source",
      "Sentiment",
      "Urgency",
      "Category",
      "Status",
      "Content",
      "Tags",
      "Created At",
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = displayedFeedbacks.map((f) => [
      escapeCsv(f.id),
      escapeCsv(f.customerName || ""),
      escapeCsv(f.customerEmail || ""),
      escapeCsv(f.source || ""),
      escapeCsv(f.sentiment || ""),
      escapeCsv(f.urgency || ""),
      escapeCsv(f.category || ""),
      escapeCsv(f.status || ""),
      escapeCsv(f.content || ""),
      escapeCsv((f.tags || []).join("; ")),
      escapeCsv(new Date(f.createdAt).toLocaleString()),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `loop_feedback_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${displayedFeedbacks.length} feedback items to CSV`);
  };

  // Bulk Selection Helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedFeedbacks.length && displayedFeedbacks.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedFeedbacks.map((f) => f.id));
    }
  };

  const handleBulkStatus = async (status: "REVIEWED" | "ACTIONED") => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success(`Marked ${selectedIds.length} items as ${status}`);
        setFeedbacks((prev) =>
          prev.map((f) => (selectedIds.includes(f.id) ? { ...f, status } : f))
        );
        setSelectedIds([]);
      } else {
        toast.error(data.error || "Failed to update selected feedbacks");
      }
    } catch {
      toast.error("Network error during bulk update");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch(`/api/feedback?ids=${selectedIds.join(",")}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success(`Deleted ${selectedIds.length} feedback items`);
        setFeedbacks((prev) => prev.filter((f) => !selectedIds.includes(f.id)));
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - selectedIds.length),
        }));
        setSelectedIds([]);
        setShowBulkDeleteModal(false);
      } else {
        toast.error(data.error || "Failed to delete selected feedbacks");
      }
    } catch {
      toast.error("Network error during bulk delete");
    } finally {
      setBulkLoading(false);
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
          {isAdmin && (
            <button
              onClick={() => setShowClearModal(true)}
              disabled={seeding || clearing}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 transition-colors shadow-2xs disabled:opacity-40 cursor-pointer"
              title="Reset this workspace to 0 feedbacks"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearing ? "Clearing..." : "Clear All"}</span>
            </button>
          )}

          {canEdit && (
            <Link
              href="/feedback/import"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import CSV</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={displayedFeedbacks.length === 0}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors shadow-2xs disabled:opacity-40 cursor-pointer"
            title="Export filtered feedbacks to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleSeedData}
              disabled={seeding || clearing}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-white dark:bg-indigo-600/15 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/30 transition-colors shadow-2xs disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{seeding ? "Populating..." : "Add Sample Data"}</span>
            </button>
          )}

          {canEdit && (
            <Link
              href="/feedback/new"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Feedback</span>
            </Link>
          )}
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

        {/* AI Tag Filter Cloud */}
        {tagCounts.length > 0 && (
          <div className="w-full pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3 text-blue-500" />
              <span>AI Tags:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                selectedTag === null
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              All ({feedbacks.length})
            </button>
            {tagCounts.map(([tag, count]) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(isSelected ? null : tag)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white font-semibold shadow-xs ring-1 ring-blue-500"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>#{tag}</span>
                  <span className={`text-[10px] ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
            {selectedTag && (
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="text-[11px] text-rose-500 hover:underline ml-1 cursor-pointer"
              >
                Clear tag
              </button>
            )}
          </div>
        )}
      </div>

      {/* Select All / Bulk Action Bar Header (Only visible for Admin & Analyst) */}
      {!loading && canEdit && displayedFeedbacks.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400">
          <div
            onClick={toggleSelectAll}
            className="flex items-center gap-2.5 cursor-pointer font-semibold select-none group"
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                selectedIds.length === displayedFeedbacks.length && displayedFeedbacks.length > 0
                  ? "bg-blue-600 border-blue-500 text-white shadow-xs"
                  : selectedIds.length > 0
                  ? "bg-blue-600/30 border-blue-500 text-blue-500 dark:text-blue-300"
                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-slate-400 dark:group-hover:border-slate-500 text-transparent"
              }`}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition">
              Select All ({displayedFeedbacks.length})
            </span>
          </div>
          {selectedIds.length > 0 && (
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected for bulk action
            </span>
          )}
        </div>
      )}

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
              {isAdmin
                ? "You haven't added any customer feedback yet. Click \"Add Sample Data\" to populate realistic reviews across all channels."
                : "No customer feedback recorded in this workspace yet. An Administrator can import or seed data."}
            </p>
            {isAdmin && (
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
              >
                {seeding ? "Adding Data..." : "Add Sample Data Now"}
              </button>
            )}
          </div>
        ) : (
          displayedFeedbacks.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900/60 border transition-all space-y-3 ${
                selectedIds.includes(item.id)
                  ? "border-blue-500/70 shadow-md bg-blue-500/5 dark:bg-blue-500/5"
                  : "border-slate-200/90 dark:border-slate-800 hover:border-blue-500/40 hover:shadow-md"
              }`}
            >
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer mr-1.5 shrink-0 ${
                        selectedIds.includes(item.id)
                          ? "bg-blue-600 border-blue-500 text-white shadow-xs"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500 text-transparent"
                      }`}
                      title={selectedIds.includes(item.id) ? "Deselect item" : "Select item for bulk action"}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                  )}

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

                {/* Triage Status */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {canEdit ? (
                    <div className="relative inline-flex items-center">
                      <span
                        className={`pointer-events-none absolute left-2.5 w-1.5 h-1.5 rounded-full z-10 ${
                          item.status === "ACTIONED"
                            ? "bg-emerald-500"
                            : item.status === "REVIEWED"
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <select
                        value={item.status || "NEW"}
                        onChange={(e) => handleTriage(item.id, e.target.value as "NEW" | "REVIEWED" | "ACTIONED")}
                        className={`appearance-none text-[11px] font-bold pl-5 pr-6 py-1 rounded-lg border transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-2xs ${
                          item.status === "ACTIONED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-500/25"
                            : item.status === "REVIEWED"
                            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30 dark:hover:bg-blue-500/25"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-500/25"
                        }`}
                        title="Change triage status"
                      >
                        <option value="NEW" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold">
                          NEW
                        </option>
                        <option value="REVIEWED" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold">
                          REVIEWED
                        </option>
                        <option value="ACTIONED" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold">
                          ACTIONED
                        </option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 w-3 h-3 opacity-60 text-current z-10" />
                    </div>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border select-none ${
                        item.status === "ACTIONED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                          : item.status === "REVIEWED"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === "ACTIONED"
                            ? "bg-emerald-500"
                            : item.status === "REVIEWED"
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {item.status || "NEW"}
                    </span>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setFeedbackToDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete feedback item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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

      {/* Floating Bulk Action Bar */}
      {canEdit && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 dark:border-slate-600 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="text-xs font-semibold pr-2 border-r border-slate-700 dark:border-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>{selectedIds.length} Selected</span>
          </div>

          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => handleBulkStatus("REVIEWED")}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-xs"
          >
            Mark Reviewed
          </button>

          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => handleBulkStatus("ACTIONED")}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-xs"
          >
            Mark Actioned
          </button>

          {isAdmin && (
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition ml-1 cursor-pointer"
            title="Deselect all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Single Item Delete Confirmation Modal */}
      {feedbackToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Feedback</h3>
                <p className="text-xs text-slate-500">Confirm record removal</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete this feedback item? This action will permanently remove it from your workspace.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFeedbackToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingSingle}
                onClick={handleConfirmSingleDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition disabled:opacity-50 cursor-pointer"
              >
                {deletingSingle ? "Deleting..." : "Delete Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete {selectedIds.length} Items</h3>
                <p className="text-xs text-slate-500">Bulk record removal</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete all <strong className="text-slate-900 dark:text-white">{selectedIds.length}</strong> selected feedback items? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={handleConfirmBulkDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition disabled:opacity-50 cursor-pointer"
              >
                {bulkLoading ? "Deleting..." : `Delete ${selectedIds.length} Items`}
              </button>
            </div>
          </div>
        </div>
      )}

      <ClearDataModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClear}
        loading={clearing}
      />
    </div>
  );
}

