"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

interface Cluster {
  theme: string;
  count: number;
  description: string;
}

interface InsightsData {
  clusters: Cluster[];
  trends: string[];
}

export default function AiInsightsCard({ workspaceId }: { workspaceId?: string }) {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch(`/api/insights?workspaceId=${workspaceId || ""}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch insights", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111827]/80 p-6 backdrop-blur-xl shadow-2xl animate-pulse">
        <div className="h-5 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-white/5 rounded-xl"></div>
          <div className="h-24 bg-white/5 rounded-xl"></div>
          <div className="h-24 bg-white/5 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111827]/80 p-6 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Subtle background glow */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">AI Cluster Insights</h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
          Groq AI Active
        </span>
      </div>

      {/* Dynamic Key Themes / Clusters */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Themes</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.clusters && data.clusters.length > 0 ? (
            data.clusters.map((cluster, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-slate-400 font-medium">{cluster.theme}</p>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                      {cluster.count} items
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 mt-1 line-clamp-2">{cluster.description}</p>
                </div>
                <span className="inline-flex items-center text-xs text-purple-400 gap-1 mt-3">
                  <AlertTriangle className="h-3 w-3" /> Auto-Clustered
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 col-span-3">No theme clusters available yet.</p>
          )}
        </div>
      </div>

      {/* Dynamic Emerging Trends */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Emerging Trends</h4>
        <ul className="space-y-2 text-xs text-slate-300">
          {data?.trends && data.trends.length > 0 ? (
            data.trends.map((trend, index) => (
              <li key={index} className="flex items-start gap-2 bg-white/5 p-2.5 rounded-lg border border-white/5">
                <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{trend}</span>
              </li>
            ))
          ) : (
            <li className="text-slate-500">No trend data available.</li>
          )}
        </ul>
      </div>
    </div>
  );
}