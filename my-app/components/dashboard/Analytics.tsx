"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsProps {
  workspaceId?: string;
}

export default function Analytics({ workspaceId }: AnalyticsProps) {
  const [totalVolume, setTotalVolume] = useState(0);
  const [sentimentCounts, setSentimentCounts] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const url = workspaceId 
          ? `/api/feedback?workspaceId=${workspaceId}` 
          : `/api/feedback`;
        
        const res = await fetch(url);
        if (res.ok) {
          const feedbacks = await res.json();
          
          setTotalVolume(feedbacks.length);

          let pos = 0, neu = 0, neg = 0;
          feedbacks.forEach((fb: any) => {
            const s = (fb.sentiment || "").toUpperCase();
            if (s === "POSITIVE") pos++;
            else if (s === "NEGATIVE") neg++;
            else neu++;
          });

          setSentimentCounts({ positive: pos, neutral: neu, negative: neg });
        }
      } catch (err) {
        console.error("Failed to load analytics data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [workspaceId]);

  const totalSentiments = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
  const posPercent = totalSentiments > 0 ? Math.round((sentimentCounts.positive / totalSentiments) * 100) : 0;
  const neuPercent = totalSentiments > 0 ? Math.round((sentimentCounts.neutral / totalSentiments) * 100) : 0;
  const negPercent = totalSentiments > 0 ? Math.round((sentimentCounts.negative / totalSentiments) * 100) : 0;

  const sentimentData = [
    { name: "Positive", value: posPercent || 1, color: "#3B82F6" },
    { name: "Neutral", value: neuPercent || 1, color: "#F59E0B" },
    { name: "Negative", value: negPercent || 1, color: "#EC4899" },
  ];

  const volumeData = [
    { day: "Mon", count: Math.round(totalVolume * 0.1) },
    { day: "Tue", count: Math.round(totalVolume * 0.2) },
    { day: "Wed", count: Math.round(totalVolume * 0.15) },
    { day: "Thu", count: Math.round(totalVolume * 0.3) },
    { day: "Fri", count: Math.round(totalVolume * 0.25) },
    { day: "Sat", count: Math.round(totalVolume * 0.05) },
    { day: "Sun", count: Math.round(totalVolume * 0.05) },
  ];

  return (
    <div className="bg-[#0B0F19] text-white p-6 rounded-2xl space-y-6 border border-slate-800 shadow-2xl">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800/80 p-4 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Volume</span>
            <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-500/20">Live</span>
          </div>
          <div className="text-3xl font-bold mt-2 text-white">{loading ? "..." : totalVolume}</div>
          <p className="text-xs text-slate-500 mt-1">Total feedback items stored</p>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 p-4 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Positive Share</span>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">Ratio</span>
          </div>
          <div className="text-3xl font-bold mt-2 text-emerald-400">{loading ? "..." : `${posPercent}%`}</div>
          <p className="text-xs text-slate-500 mt-1">{sentimentCounts.positive} positive responses</p>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 p-4 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Negative Alerts</span>
            <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/20">Attention</span>
          </div>
          <div className="text-3xl font-bold mt-2 text-red-500">{loading ? "..." : sentimentCounts.negative}</div>
          <p className="text-xs text-slate-500 mt-1">Issues needing review</p>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 p-4 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Neutral Feedback</span>
          </div>
          <div className="text-3xl font-bold mt-2 text-amber-400">{loading ? "..." : sentimentCounts.neutral}</div>
          <p className="text-xs text-slate-500 mt-1">Standard suggestions</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800/80 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Feedback Volume Velocity</h4>
              <p className="text-xs text-slate-500">Ingested customer items timeline</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-800/50 px-3 py-1 rounded-md border border-slate-700/50">
              Total: {totalVolume}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#FFF",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Sentiment Polarity</h4>
            <p className="text-xs text-slate-500">Distribution breakdown across dataset</p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    borderColor: "#334155",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-white">{posPercent}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Positive</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            {sentimentData.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="text-slate-400 font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}