"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Analytics from "@/components/dashboard/Analytics";
import VocReportCard from "@/components/dashboard/VocReportCard";
import ExportPdfButton from "@/components/dashboard/ExportPdfButton";
import {
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Inbox,
  Shield,
  Clock,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface FeedbackPreview {
  id: string;
  content: string;
  source: string;
  sentiment: string;
  urgency: string;
  status: "NEW" | "REVIEWED" | "ACTIONED";
  customerName?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState<FeedbackPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Get workspace context
      const wsRes = await fetch("/api/workspace/members");
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        if (wsData.success && wsData.workspace) {
          setWorkspace(wsData.workspace);
        }
      }

      // 2. Get recent feedback
      const fbRes = await fetch("/api/feedback?limit=6");
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        if (Array.isArray(fbData)) {
          setRecentFeedbacks(fbData.slice(0, 6));
        } else if (fbData.feedbacks) {
          setRecentFeedbacks(fbData.feedbacks.slice(0, 6));
        }
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/feedback/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Seeded sample feedback across all categories!");
        loadDashboardData();
      } else {
        toast.error(data.error || "Failed to seed sample data");
      }
    } catch (err) {
      toast.error("Error seeding data");
    } finally {
      setSeeding(false);
    }
  };

  const handleTriage = async (id: string, newStatus: "NEW" | "REVIEWED" | "ACTIONED") => {
    try {
      setRecentFeedbacks((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      toast.success(`Marked as ${newStatus}`);
      await fetch(`/api/feedback/${id}/triage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Error updating triage:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Executive Feedback Dashboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics, automated Voice of Customer (VoC) synthesis, and urgent feedback triage.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 hover:scale-102"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{seeding ? "Populating..." : "Add Sample Data"}</span>
          </button>

          <ExportPdfButton />
        </div>
      </div>

      {/* 1. Analytics Charts Section (Sentiment Breakdown & Volume Timeline) */}
      <div className="w-full">
        <Analytics workspaceId={workspace?.id} />
      </div>

      {/* 2. Single Best VoC Intelligence Section */}
      <div className="w-full">
        <VocReportCard workspaceId={workspace?.id} />
      </div>

      {/* 3. Recent Urgent Customer Feedback Feed */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Customer Feedbacks
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest customer submissions with 1-click status triage.
              </p>
            </div>
          </div>

          <Link
            href="/feedback"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View all in Inbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentFeedbacks.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <Inbox className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-xs text-slate-500">No feedback items yet.</p>
            <button
              onClick={handleSeedData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
            >
              Add Sample Data Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentFeedbacks.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 flex flex-col justify-between hover:border-blue-500/40 transition-colors"
              >
                <div className="space-y-1.5">
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

                    <span className="text-[10px] text-slate-400">
                      {item.source} &bull; {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium line-clamp-3 leading-relaxed">
                    {item.content}
                  </p>
                </div>

                {/* Footer with Customer & Triage */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 truncate max-w-[150px]">
                    By: {item.customerName || "Customer"}
                  </span>

                  <div className="flex items-center gap-1">
                    {(["NEW", "REVIEWED", "ACTIONED"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleTriage(item.id, s)}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          item.status === s
                            ? s === "ACTIONED"
                              ? "bg-emerald-600 text-white"
                              : s === "REVIEWED"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                            : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

