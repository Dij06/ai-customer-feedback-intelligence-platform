"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Award, AlertCircle, CheckCircle2, Lightbulb, RefreshCw, Sparkles } from "lucide-react";

interface VocReport {
  summary: string;
  csatScore: string;
  topComplaints: string[];
  keyWins: string[];
  actionItems: string[];
}

export default function VocReportCard({ workspaceId }: { workspaceId?: string }) {
  const [report, setReport] = useState<VocReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVocReport = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/reports/voc?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error("Failed to load VoC Report", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchVocReport();
  }, [fetchVocReport]);

  if (loading) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
          <div className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Voice of Customer (VoC) Executive Brief
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI-synthesized strategic insights, sentiment drivers, and recommended action items.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVocReport}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh VoC Analysis"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full text-xs font-bold">
            <Award className="h-3.5 w-3.5 text-blue-500" />
            <span>Est. CSAT: {report?.csatScore || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
        <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Executive Digest
        </h4>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
          {report?.summary || "No summary available."}
        </p>
      </div>

      {/* Grid: Key Customer Wins & Pain Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Customer Wins */}
        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Key Customer Praises & Wins
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {(report?.keyWins || []).map((win, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5">&bull;</span>
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Pain Points */}
        <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-bold text-xs uppercase tracking-wide">
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            Top Friction Points & Complaints
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {(report?.topComplaints || []).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-rose-500 font-bold mt-0.5">&bull;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 space-y-2">
        <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-400 font-bold text-xs uppercase tracking-wide">
          <Lightbulb className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Recommended Next Steps & Action Items
        </div>
        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
          {(report?.actionItems || []).map((action, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold mt-0.5">&rarr;</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

