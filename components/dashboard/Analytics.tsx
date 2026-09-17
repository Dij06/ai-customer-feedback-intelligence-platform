"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  const [feedbacksList, setFeedbacksList] = useState<any[]>([]);
  const [timelineRange, setTimelineRange] = useState<7 | 30>(7);
  const [sentimentCounts, setSentimentCounts] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    async function fetchStats() {
      try {
        setLoading(true);
        const url = `/api/feedback?workspaceId=${workspaceId}`;
        
        const res = await fetch(url);
        if (res.ok) {
          const feedbacks = await res.json();
          const items = Array.isArray(feedbacks) ? feedbacks : feedbacks.feedbacks || [];
          setFeedbacksList(items);
          setTotalVolume(items.length);

          let pos = 0, neu = 0, neg = 0;
          items.forEach((fb: { sentiment?: string }) => {
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
    { name: "Positive", value: posPercent, color: "#3B82F6" },
    { name: "Neutral", value: neuPercent, color: "#F59E0B" },
    { name: "Negative", value: negPercent, color: "#EC4899" },
  ];

  // Calculate real timestamp-based daily volume timeline
  const volumeData = useMemo(() => {
    const days: { day: string; dateLabel: string; count: number; positive: number; negative: number }[] = [];
    const now = new Date();

    for (let i = timelineRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const monthDay = `${d.getMonth() + 1}/${d.getDate()}`;

      let count = 0;
      let pos = 0;
      let neg = 0;

      feedbacksList.forEach((fb) => {
        if (!fb.createdAt) return;
        const fbDate = new Date(fb.createdAt).toISOString().slice(0, 10);
        if (fbDate === dateStr) {
          count++;
          const s = (fb.sentiment || "").toUpperCase();
          if (s === "POSITIVE") pos++;
          else if (s === "NEGATIVE") neg++;
        }
      });

      days.push({
        day: timelineRange === 7 ? `${dayName} ${monthDay}` : monthDay,
        dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count,
        positive: pos,
        negative: neg,
      });
    }

    return days;
  }, [feedbacksList, timelineRange]);

  return (
    <div className="bg-[#0B0F19] text-white p-4 sm:p-6 rounded-2xl space-y-6 border border-slate-800 shadow-2xl overflow-hidden">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#111827] border border-slate-800/80 p-3.5 sm:p-4 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Total Volume</span>
            <span className="bg-blue-500/10 text-blue-400 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full border border-blue-500/20">Live</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold mt-1.5 sm:mt-2 text-white">{loading ? "..." : totalVolume}</div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Total feedback stored</p>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 p-3.5 sm:p-4 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Positive Share</span>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/20">Ratio</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold mt-1.5 sm:mt-2 text-emerald-400">{loading ? "..." : `${posPercent}%`}</div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1">{sentimentCounts.positive} positive reviews</p>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 p-3.5 sm:p-4 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Negative Alerts</span>
            <span className="bg-red-500/10 text-red-400 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full border border-red-500/20">Attention</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold mt-1.5 sm:mt-2 text-red-500">{loading ? "..." : sentimentCounts.negative}</div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Issues needing review</p>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 p-3.5 sm:p-4 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Neutral Feedback</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold mt-1.5 sm:mt-2 text-amber-400">{loading ? "..." : sentimentCounts.neutral}</div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Standard suggestions</p>
        </div>
      </div>

      {/* Main Charts Row */}
      {totalVolume === 0 && !loading ? (
        <div className="bg-[#111827] border border-slate-800/80 p-6 sm:p-8 rounded-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-sm sm:text-base font-bold text-white">No Customer Feedback Recorded Yet</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            This workspace currently has 0 customer feedbacks. Click &quot;Add Sample Data&quot; above to populate 130 realistic customer feedback items or import feedback from a CSV file.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#111827] border border-slate-800/80 p-4 sm:p-5 rounded-xl space-y-4 min-w-0">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">Feedback Volume Velocity</h4>
                <p className="text-[10px] sm:text-xs text-slate-500">Real daily customer activity timeline</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setTimelineRange(7)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      timelineRange === 7
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimelineRange(30)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      timelineRange === 30
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Last 30 Days
                  </button>
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 bg-slate-800/50 px-2.5 sm:px-3 py-1 rounded-md border border-slate-700/50">
                  Total: {totalVolume}
                </span>
              </div>
            </div>

            <div className="h-52 sm:h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#64748B" fontSize={11} width={28} />
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
                  name="Total Feedback"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
                <Area
                  type="monotone"
                  dataKey="negative"
                  name="Negative Issues"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNeg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 p-4 sm:p-5 rounded-xl space-y-4 flex flex-col justify-between min-w-0">
          <div>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">Sentiment Polarity</h4>
            <p className="text-[10px] sm:text-xs text-slate-500">Distribution breakdown across dataset</p>
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
      )}
    </div>
  );
}