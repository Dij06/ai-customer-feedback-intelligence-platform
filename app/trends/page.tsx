"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  X,
  MessageSquare,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import ClearDataModal from "@/components/ClearDataModal";

interface ThemeItem {
  id: string;
  name: string;
  description: string;
  color: string;
  count: number;
  recentCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positiveRatio: number;
  negativeRatio: number;
  spikeStatus: "surge" | "growth" | "stable";
  spikeLabel: string;
  sampleQuote: string;
}

interface DrillDownFeedback {
  id: string;
  content: string;
  source: string;
  sentiment: string;
  customerName?: string;
  createdAt: string;
}

export default function TrendsPage() {
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [drillDownFeedbacks, setDrillDownFeedbacks] = useState<DrillDownFeedback[]>([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  const fetchThemes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/themes");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.themes)) {
          setThemes(data.themes);
        }
      }
    } catch (err) {
      console.error("Error fetching themes:", err);
      toast.error("Failed to load customer feedback trends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/feedback/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Seeded sample feedback across all categories!");
        fetchThemes();
      } else {
        toast.error(data.error || "Failed to seed sample data");
      }
    } catch (err) {
      toast.error("Error seeding sample data");
    } finally {
      setSeeding(false);
    }
  };

  const handleConfirmClear = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/feedback?clearAll=true", { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "All feedback cleared successfully.");
        setShowClearModal(false);
        fetchThemes();
      } else {
        toast.error(data.error || "Failed to clear feedback");
      }
    } catch (err) {
      toast.error("Error clearing feedback data");
    } finally {
      setClearing(false);
    }
  };

  const handleOpenDrillDown = async (themeId: string) => {
    setSelectedThemeId(themeId);
    setDrillDownLoading(true);
    try {
      const res = await fetch(`/api/themes?themeId=${themeId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.feedbacks)) {
          setDrillDownFeedbacks(data.feedbacks);
        }
      }
    } catch (err) {
      console.error("Error loading theme details:", err);
    } finally {
      setDrillDownLoading(false);
    }
  };

  const drillDownTheme = themes.find((t) => t.id === selectedThemeId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-6 sm:space-y-8 min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Customer Feedback Trends & Clusters
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time clustering across all 8 customer topics with automatic volume surge detection and sentiment breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={fetchThemes}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowClearModal(true)}
            disabled={clearing}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-rose-950/20 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-2xs disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{clearing ? "Clearing..." : "Clear All"}</span>
          </button>

          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{seeding ? "Populating..." : "Add Sample Data"}</span>
          </button>
        </div>
      </div>

      {/* Grid of Trend Theme Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 animate-pulse space-y-4"
            >
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : !themes || themes.length === 0 || !themes.some((t) => t.count > 0) ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Feedback Trends Recorded Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            This workspace currently has 0 customer feedbacks. Click &ldquo;Add Sample Data&rdquo; to populate customer reviews across all topics.
          </p>
          <div className="pt-2">
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{seeding ? "Populating..." : "Add Sample Data"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {themes.map((theme) => {
            return (
              <div
                key={theme.id}
                onClick={() => handleOpenDrillDown(theme.id)}
                className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/90 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${theme.color}15`,
                        color: theme.color,
                        border: `1px solid ${theme.color}30`,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }} />
                      {theme.count} {theme.count === 1 ? "review" : "reviews"}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        theme.spikeStatus === "surge"
                          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
                          : theme.spikeStatus === "growth"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {theme.spikeLabel}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                      {theme.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {theme.description}
                    </p>
                  </div>

                  {/* Sentiment Breakdown Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      <span className="text-emerald-500">{theme.positiveRatio}% Pos</span>
                      <span className="text-rose-400">{theme.negativeRatio}% Neg</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div style={{ width: `${theme.positiveRatio}%` }} className="bg-emerald-500 h-full" />
                      <div
                        style={{
                          width: `${Math.max(0, 100 - theme.positiveRatio - theme.negativeRatio)}%`,
                        }}
                        className="bg-amber-400 h-full"
                      />
                      <div style={{ width: `${theme.negativeRatio}%` }} className="bg-rose-500 h-full" />
                    </div>
                  </div>

                  {/* Customer Quote Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800/80 text-xs italic text-slate-600 dark:text-slate-300 line-clamp-2">
                    &ldquo;{theme.sampleQuote}&rdquo;
                  </div>
                </div>

                {/* Drilldown Arrow Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                  <span>View all {theme.count} items</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drill-down Drawer Modal */}
      {selectedThemeId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0b0f19] h-full shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Topic Drill-Down
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {drillDownTheme?.name || "Topic Feedback"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {drillDownTheme?.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedThemeId(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                <span>{drillDownFeedbacks.length} matching customer reviews</span>
              </div>

              {drillDownLoading ? (
                <div className="py-12 text-center text-sm text-slate-500">Loading reviews...</div>
              ) : drillDownFeedbacks.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  No reviews currently found for this topic. Seed sample data to view active reviews.
                </div>
              ) : (
                <div className="space-y-3">
                  {drillDownFeedbacks.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.sentiment?.toLowerCase() === "positive"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : item.sentiment?.toLowerCase() === "negative"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {item.sentiment}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.source} &bull; {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        {item.content}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span>Customer: {item.customerName || "Verified User"}</span>
                        <span className="font-semibold text-blue-500">Verified Feedback</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 flex justify-end">
              <button
                onClick={() => setSelectedThemeId(null)}
                className="px-5 py-2.5 text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl"
              >
                Close Drawer
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

