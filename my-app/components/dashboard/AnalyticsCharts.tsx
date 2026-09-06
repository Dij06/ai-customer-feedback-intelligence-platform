"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface StatsData {
  totalFeedbacks: number;
  sentimentStats: { name: string; value: number; fill: string }[];
  urgencyStats: { name: string; count: number; fill: string }[];
}

export default function AnalyticsCharts({ stats }: { stats: StatsData }) {
  if (!stats || stats.totalFeedbacks === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 my-6">
        <p className="text-gray-500 font-medium">No feedback data available yet for analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 my-6">
      {/* Key Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Total Feedbacks</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalFeedbacks}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Urgent Items</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {stats.urgencyStats.find((u) => u.name.includes("Urgent"))?.count || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Positive Ratio</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {Math.round(
              ((stats.sentimentStats.find((s) => s.name === "Positive")?.value || 0) / stats.totalFeedbacks) * 100
            )}%
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sentiment Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Sentiment Breakdown</h3>
          <p className="text-xs text-gray-500 mb-4">Positive vs Neutral vs Negative feedback</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.sentimentStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.sentimentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs font-medium text-gray-600 mt-2">
            {stats.sentimentStats.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.fill }}></span>
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>

        {/* Urgency Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Urgency Distribution</h3>
          <p className="text-xs text-gray-500 mb-4">High priority items vs standard feedback</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.urgencyStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {stats.urgencyStats.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}