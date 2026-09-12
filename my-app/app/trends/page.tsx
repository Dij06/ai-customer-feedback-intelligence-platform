'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ThemeMetric {
  id: string;
  name: string;
  description: string | null;
  color: string;
  count: number;
  recentCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positiveRatio: number;
  negativeRatio: number;
  spikeStatus: 'surge' | 'growth' | 'stable' | 'declining';
  spikeLabel: string;
  spikePercentage: number;
  sampleQuote: string;
}

interface FeedbackDetail {
  id: string;
  content: string;
  source: string;
  sentiment: string;
  sentimentScore: number;
  category: string;
  urgency: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  summary: string | null;
  confidence: number;
  createdAt: string;
}

export default function TrendsPage() {
  const [themes, setThemes] = useState<ThemeMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [drillDownTheme, setDrillDownTheme] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [drillDownFeedbacks, setDrillDownFeedbacks] = useState<FeedbackDetail[]>([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'SURGES' | 'POSITIVE' | 'NEGATIVE'>('ALL');

  const fetchThemes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/themes');
      const data = await res.json();
      if (data.success) {
        setThemes(data.themes || []);
      }
    } catch (err) {
      console.error('Failed to load theme trends:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const handleOpenDrillDown = async (themeId: string) => {
    setSelectedThemeId(themeId);
    setDrillDownLoading(true);
    try {
      const res = await fetch(`/api/themes?themeId=${themeId}`);
      const data = await res.json();
      if (data.success) {
        setDrillDownTheme(data.theme);
        setDrillDownFeedbacks(data.feedbacks || []);
      }
    } catch (err) {
      console.error('Failed to load theme drill-down:', err);
    } finally {
      setDrillDownLoading(false);
    }
  };

  const filteredThemes = themes.filter((t) => {
    if (filterType === 'SURGES') return t.spikeStatus === 'surge' || t.spikeStatus === 'growth';
    if (filterType === 'POSITIVE') return t.positiveRatio >= 60;
    if (filterType === 'NEGATIVE') return t.negativeRatio >= 40;
    return true;
  });

  const totalThemeItems = themes.reduce((acc, t) => acc + t.count, 0);
  const surgeCount = themes.filter((t) => t.spikeStatus === 'surge').length;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Customer Topics &amp; Trends
              </span>
              {surgeCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  {surgeCount} Topics Trending Up
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight mt-2 text-slate-900 dark:text-white">
              Trending Feedback Topics
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              See what topics customers are talking about most, track changes over time, and catch sudden surges in complaints.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ask"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
            >
              Ask Questions (AI) &rarr;
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
            >
              Executive Digest
            </Link>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Topics</span>
            <div className="text-2xl font-black mt-2 text-slate-900 dark:text-white">{themes.length}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Identified across feedback</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Feedback Items</span>
            <div className="text-2xl font-black mt-2 text-indigo-600 dark:text-indigo-400">{totalThemeItems}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Categorized into topics</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trending Up</span>
            <div className="text-2xl font-black mt-2 text-rose-600 dark:text-rose-400">{surgeCount}</div>
            <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">Surging complaints this week</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Top Topic</span>
            <div className="text-xl font-bold mt-2 text-slate-900 dark:text-white truncate">
              {themes[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{themes[0]?.count || 0} reviews</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {(['ALL', 'SURGES', 'POSITIVE', 'NEGATIVE'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === filter
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {filter === 'ALL'
                ? 'All Topics'
                : filter === 'SURGES'
                ? '⚡ Surges & Growth'
                : filter === 'POSITIVE'
                ? 'Positive Sentiment'
                : 'Negative Concerns'}
            </button>
          ))}
        </div>

        {/* Themes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-900/50 animate-pulse border border-slate-200 dark:border-slate-800" />
            ))}
          </div>
        ) : filteredThemes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No topics found matching this filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try switching filter tabs or adding new customer feedback.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredThemes.map((theme) => {
              const isSurge = theme.spikeStatus === 'surge';
              return (
                <div
                  key={theme.id}
                  onClick={() => handleOpenDrillDown(theme.id)}
                  className={`group relative p-6 rounded-2xl bg-white dark:bg-slate-900/90 border transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
                    isSurge
                      ? 'border-rose-300 dark:border-rose-900/50 shadow-rose-500/5 ring-1 ring-rose-500/20'
                      : 'border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:border-blue-500/50'
                  }`}
                >
                  {/* Top Spike Pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: `${theme.color}15`,
                        color: theme.color,
                        border: `1px solid ${theme.color}30`,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }} />
                      {theme.count} items
                    </span>

                    <span
                      className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${
                        theme.spikeStatus === 'surge'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
                          : theme.spikeStatus === 'growth'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}
                    >
                      {theme.spikeLabel}
                    </span>
                  </div>

                  {/* Theme Title & Description */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {theme.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {theme.description || 'Customer feedback topic.'}
                  </p>

                  {/* Sentiment Bar Meter */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex justify-between text-2xs font-semibold text-slate-600 dark:text-slate-400">
                      <span>{theme.positiveRatio}% Positive</span>
                      <span>{theme.negativeRatio}% Negative</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div style={{ width: `${theme.positiveRatio}%` }} className="bg-emerald-500 h-full" />
                      <div
                        style={{ width: `${100 - theme.positiveRatio - theme.negativeRatio}%` }}
                        className="bg-amber-400 h-full"
                      />
                      <div style={{ width: `${theme.negativeRatio}%` }} className="bg-rose-500 h-full" />
                    </div>
                  </div>

                  {/* Verbatim Sample Snippet */}
                  {theme.sampleQuote && (
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs italic text-slate-600 dark:text-slate-300 line-clamp-2">
                      &ldquo;{theme.sampleQuote}&rdquo;
                    </div>
                  )}

                  {/* Footer drill-down action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                    <span>View all {theme.count} feedback items</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Drill-down Drawer Modal */}
        {selectedThemeId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Customer Reviews
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {drillDownTheme?.name || 'Loading Topic...'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {drillDownTheme?.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedThemeId(null)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <span>{drillDownFeedbacks.length} matching reviews</span>
                </div>

                {drillDownLoading ? (
                  <div className="py-12 text-center text-sm text-slate-500">Loading reviews...</div>
                ) : drillDownFeedbacks.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-500">No reviews found for this topic.</div>
                ) : (
                  <div className="space-y-3">
                    {drillDownFeedbacks.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                              item.sentiment === 'Positive'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : item.sentiment === 'Negative'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {item.sentiment}
                          </span>
                          <span className="text-2xs text-slate-400">
                            {item.source} · {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                          {item.content}
                        </p>

                        <div className="flex items-center justify-between text-2xs text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                          <span>By: {item.customerName || 'Anonymous'}</span>
                          <span className="font-semibold text-indigo-500">
                            Verified Review
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedThemeId(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl"
                >
                  Close Reviews
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
