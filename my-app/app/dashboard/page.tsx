'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

interface FeedbackItem {
  id: string;
  content: string;
  source: string;
  sentiment: string | null;
  sentimentScore: number | null;
  category: string | null;
  urgency: string | null;
  status: string | null;
  customerName: string | null;
  customerEmail: string | null;
  summary: string | null;
  createdAt: string;
}

interface ChartPoint {
  label: string;
  fullDate: string;
  count: number;
}

export default function DashboardPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback?dateRange=${timeframe}&limit=200`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.feedback || data.feedbacks || []);
      } else {
        throw new Error(data.error || 'Failed to load feedback data');
      }
    } catch (err: unknown) {
      console.error('Failed to load dashboard metrics:', err);
      setError(err instanceof Error ? err.message : 'Could not connect to the feedback database. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch(`/api/feedback?dateRange=${timeframe}&limit=200`);
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        const data = await res.json();
        if (isMounted) {
          if (data.success) {
            setFeedbacks(data.feedback || data.feedbacks || []);
          } else {
            setError(data.error || 'Failed to load feedback data');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to load dashboard metrics:', err);
          setError(err instanceof Error ? err.message : 'Could not connect to database.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [timeframe]);

  // Metrics calculation
  const total = feedbacks.length;
  const positiveFeedbacks = useMemo(() => feedbacks.filter((f) => f.sentiment === 'Positive'), [feedbacks]);
  const neutralFeedbacks = useMemo(() => feedbacks.filter((f) => f.sentiment === 'Neutral'), [feedbacks]);
  const negativeFeedbacks = useMemo(() => feedbacks.filter((f) => f.sentiment === 'Negative'), [feedbacks]);
  const highUrgencyItems = useMemo(() => feedbacks.filter((f) => f.urgency === 'High' && f.status !== 'ACTIONED'), [feedbacks]);

  const positivePercent = total > 0 ? Math.round((positiveFeedbacks.length / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round((neutralFeedbacks.length / total) * 100) : 0;
  const negativePercent = total > 0 ? Math.round((negativeFeedbacks.length / total) * 100) : 0;
  const netSentiment = positivePercent - negativePercent;

  // Category breakdown calculation
  const categoryCounts = useMemo(() => {
    const map: Record<string, { total: number; positive: number; negative: number }> = {};
    feedbacks.forEach((f) => {
      const cat = f.category || 'General';
      if (!map[cat]) {
        map[cat] = { total: 0, positive: 0, negative: 0 };
      }
      map[cat].total += 1;
      if (f.sentiment === 'Positive') map[cat].positive += 1;
      if (f.sentiment === 'Negative') map[cat].negative += 1;
    });
    return map;
  }, [feedbacks]);

  const sortedCategories = useMemo(() => {
    return Object.entries(categoryCounts).sort((a, b) => b[1].total - a[1].total);
  }, [categoryCounts]);

  // Sources breakdown calculation
  const channelCounts = useMemo(() => {
    const map: Record<string, number> = {};
    feedbacks.forEach((f) => {
      const src = f.source || 'Other';
      map[src] = (map[src] || 0) + 1;
    });
    return map;
  }, [feedbacks]);

  // Dynamic real-data time-series bucketing
  const chartPoints: ChartPoint[] = useMemo(() => {
    const now = new Date();

    if (timeframe === '7d') {
      // 7 daily buckets from 6 days ago up to today
      const points: ChartPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString(undefined, { weekday: 'short' });
        const fullDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        const count = feedbacks.filter((f) => {
          if (!f.createdAt) return false;
          return f.createdAt.slice(0, 10) === dateKey;
        }).length;

        points.push({ label, fullDate, count });
      }
      return points;
    }

    if (timeframe === '30d') {
      // 6 five-day interval buckets
      const points: ChartPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const startD = new Date(now);
        startD.setDate(startD.getDate() - (i + 1) * 5);
        const endD = new Date(now);
        endD.setDate(endD.getDate() - i * 5);

        const label = `${startD.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}`;
        const fullDate = `${startD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

        const count = feedbacks.filter((f) => {
          if (!f.createdAt) return false;
          const fd = new Date(f.createdAt);
          return fd >= startD && fd <= endD;
        }).length;

        points.push({ label, fullDate, count });
      }
      return points;
    }

    if (timeframe === '90d') {
      // 6 fifteen-day interval buckets
      const points: ChartPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const startD = new Date(now);
        startD.setDate(startD.getDate() - (i + 1) * 15);
        const endD = new Date(now);
        endD.setDate(endD.getDate() - i * 15);

        const label = `${startD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
        const fullDate = `${startD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

        const count = feedbacks.filter((f) => {
          if (!f.createdAt) return false;
          const fd = new Date(f.createdAt);
          return fd >= startD && fd <= endD;
        }).length;

        points.push({ label, fullDate, count });
      }
      return points;
    }

    // 'all' timeframe: last 6 calendar months
    const points: ChartPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const startD = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endD = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = startD.toLocaleDateString(undefined, { month: 'short' });
      const fullDate = startD.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

      const count = feedbacks.filter((f) => {
        if (!f.createdAt) return false;
        const fd = new Date(f.createdAt);
        return fd >= startD && fd <= endD;
      }).length;

      points.push({ label, fullDate, count });
    }
    return points;
  }, [feedbacks, timeframe]);

  const maxChartCount = useMemo(() => {
    const maxVal = Math.max(...chartPoints.map((p) => p.count), 0);
    return maxVal === 0 ? 1 : maxVal;
  }, [chartPoints]);

  const handleResolveUrgent = async (id: string) => {
    setActioningId(id);
    try {
      await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'ACTIONED' }),
      });
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'ACTIONED' } : f))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const exportAsCSV = () => {
    if (feedbacks.length === 0) return;
    const headers = ['ID', 'Content', 'Source', 'Sentiment', 'SentimentScore', 'Category', 'Urgency', 'Status', 'CustomerName', 'CustomerEmail', 'Summary', 'CreatedAt'];
    const rows = feedbacks.map((f) => [
      f.id,
      `"${(f.content || '').replace(/"/g, '""')}"`,
      `"${f.source || ''}"`,
      f.sentiment || '',
      f.sentimentScore !== null ? f.sentimentScore : '',
      `"${f.category || ''}"`,
      f.urgency || '',
      f.status || '',
      `"${(f.customerName || '').replace(/"/g, '""')}"`,
      `"${(f.customerEmail || '').replace(/"/g, '""')}"`,
      `"${(f.summary || '').replace(/"/g, '""')}"`,
      f.createdAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `loop-customer-feedback-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportAsJSON = () => {
    if (feedbacks.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(feedbacks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `loop-customer-feedback-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setShowExportMenu(false);
  };

  // SVG Area path generation
  const svgWidth = 700;
  const svgHeight = 160;
  const bottomY = 140;
  const topY = 25;
  const usableHeight = bottomY - topY;

  const pointCoords = useMemo(() => {
    const n = chartPoints.length;
    if (n === 0) return [];
    return chartPoints.map((pt, i) => {
      const x = n > 1 ? (i / (n - 1)) * 600 + 50 : 350;
      const y = total > 0 ? bottomY - (pt.count / maxChartCount) * usableHeight : bottomY;
      return { x, y, count: pt.count, label: pt.label, fullDate: pt.fullDate };
    });
  }, [chartPoints, maxChartCount, total, usableHeight]);

  const areaPathD = useMemo(() => {
    if (pointCoords.length === 0) return '';
    const pointsStr = pointCoords.map((p) => `L ${p.x},${p.y}`).join(' ');
    const firstX = pointCoords[0].x;
    const lastX = pointCoords[pointCoords.length - 1].x;
    return `M ${firstX},${bottomY} ${pointsStr} L ${lastX},${bottomY} Z`;
  }, [pointCoords]);

  const linePointsStr = useMemo(() => {
    return pointCoords.map((p) => `${p.x},${p.y}`).join(' ');
  }, [pointCoords]);

  return (
    <div className="bg-[#F8F9FA] dark:bg-[#0b0f19] min-h-[calc(100vh-4rem)] transition-colors py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1F36] dark:text-white tracking-tight">
                Feedback Analytics
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2D68FF] border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                Live Overview
              </span>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
              See overall customer happiness, top feedback categories, and issues that need attention.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe Dropdown Selector */}
            <div className="relative">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as '7d' | '30d' | '90d' | 'all')}
                aria-label="Select timeframe"
                className="appearance-none pl-3.5 pr-8 py-2 text-xs font-bold text-[#1A1F36] dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs transition-all cursor-pointer focus:outline-none focus:border-[#2D68FF]"
              >
                <option value="7d">Past 7 Days</option>
                <option value="30d">Past 30 Days</option>
                <option value="90d">Past 90 Days</option>
                <option value="all">All Time</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Export Dataset Dropdown with Format Selection */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                type="button"
                className="px-4 py-2 text-xs font-bold text-[#1A1F36] dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-[#2D68FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export Data</span>
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Export Format</p>
                    <button
                      onClick={exportAsCSV}
                      className="w-full px-3.5 py-2.5 text-left rounded-xl text-[#1A1F36] dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-600/15 hover:text-[#2D68FF] dark:hover:text-blue-400 font-bold flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export as CSV
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">.csv</span>
                    </button>
                    <button
                      onClick={exportAsJSON}
                      className="w-full px-3.5 py-2.5 text-left rounded-xl text-[#1A1F36] dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-600/15 hover:text-[#2D68FF] dark:hover:text-blue-400 font-bold flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Export as JSON
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold">.json</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <Link
              href="/feedback/new"
              className="px-5 py-2 text-xs font-bold text-white bg-[#2D68FF] hover:bg-blue-600 rounded-xl shadow-md shadow-[#2D68FF]/20 transition-all"
            >
              + Add Feedback
            </Link>
          </div>
        </div>

        {/* Error State Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                !
              </div>
              <div>
                <p className="text-xs font-bold text-rose-900 dark:text-rose-200">Unable to load analytics data</p>
                <p className="text-xs text-rose-700 dark:text-rose-400">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-3.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-800/80 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-72 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
              <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-56 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
              <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Feedback */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Feedback</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                    {timeframe === '7d' ? '7 Days' : timeframe === '30d' ? '30 Days' : timeframe === '90d' ? '90 Days' : 'All Time'}
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">{total}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>From {Object.keys(channelCounts).length} feedback sources</span>
                </div>
              </div>

              {/* Customer Happiness Score */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Happy Customers</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${netSentiment >= 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                      }`}
                  >
                    {netSentiment >= 0 ? `+${netSentiment}` : netSentiment} Score
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">{positivePercent}%</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>{positiveFeedbacks.length} happy vs {negativeFeedbacks.length} unhappy</span>
                </div>
              </div>

              {/* Urgent Issues */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Urgent Issues</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
                    {highUrgencyItems.length} Open
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2 font-mono">{highUrgencyItems.length}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>Bugs & critical feedback to address</span>
                </div>
              </div>

              {/* Top Category */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Top Topic</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20">
                    Most Discussed
                  </span>
                </div>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-300 mt-2 truncate">
                  {sortedCategories.length > 0 ? sortedCategories[0][0] : 'General'}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>{sortedCategories.length > 0 ? `${sortedCategories[0][1].total} reviews` : 'No data recorded'}</span>
                </div>
              </div>
            </div>

            {/* Empty state alert when 0 items */}
            {total === 0 && (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#2D68FF] flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No feedback recorded for this period</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  There are no customer feedback items recorded in this timeframe ({timeframe}). You can submit fresh feedback or choose a different date range.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <Link
                    href="/feedback/new"
                    className="px-4 py-2 text-xs font-bold text-white bg-[#2D68FF] hover:bg-blue-600 rounded-xl transition-all"
                  >
                    + Add New Feedback
                  </Link>
                  <Link
                    href="/feedback"
                    className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    Open Feedback Inbox
                  </Link>
                </div>
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Feedback Over Time Chart (Area Trend) */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Feedback Volume Over Time</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real feedback arrivals across active date intervals</p>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total in view: <strong className="text-slate-900 dark:text-white font-mono">{total}</strong></span>
                </div>

                {/* Area chart */}
                <div className="w-full h-48 relative pt-4">
                  {total === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <span>No volume trend data available</span>
                    </div>
                  ) : (
                    <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2D68FF" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#2D68FF" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="0" y1="30" x2={svgWidth} y2="30" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />
                      <line x1="0" y1="80" x2={svgWidth} y2="80" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />
                      <line x1="0" y1={bottomY} x2={svgWidth} y2={bottomY} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />

                      {/* Area fill path */}
                      {areaPathD && (
                        <path
                          d={areaPathD}
                          fill="url(#areaGradient)"
                        />
                      )}

                      {/* Top glowing line */}
                      {linePointsStr && (
                        <polyline
                          points={linePointsStr}
                          fill="none"
                          stroke="#2D68FF"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Chart Dots */}
                      {pointCoords.map((pt, i) => (
                        <g key={i}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="4"
                            className="fill-[#2D68FF] stroke-white dark:stroke-slate-900 stroke-2 hover:r-6 transition-all"
                          >
                            <title>{`${pt.fullDate}: ${pt.count} feedback reviews`}</title>
                          </circle>
                        </g>
                      ))}
                    </svg>
                  )}

                  {/* X-axis labels */}
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 px-2">
                    {chartPoints.map((pt, i) => (
                      <span key={i} className="font-mono text-center" title={pt.fullDate}>
                        {pt.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart 2: Sentiment breakdown (Donut Gauge) */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Customer Sentiment</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time positive, neutral, and negative ratio</p>
                </div>

                {/* Donut Gauge */}
                <div className="relative w-36 h-36 mx-auto my-2 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background Track Circle */}
                    <path
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />

                    {/* Positive Segment (Emerald Green) */}
                    {positivePercent > 0 && (
                      <path
                        className="text-emerald-500 transition-all duration-500"
                        strokeDasharray={`${positivePercent}, 100`}
                        strokeDashoffset="0"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}

                    {/* Neutral Segment (Amber Yellow) */}
                    {neutralPercent > 0 && (
                      <path
                        className="text-amber-400 transition-all duration-500"
                        strokeDasharray={`${neutralPercent}, 100`}
                        strokeDashoffset={`${-positivePercent}`}
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}

                    {/* Negative Segment (Rose Red) */}
                    {negativePercent > 0 && (
                      <path
                        className="text-rose-500 transition-all duration-500"
                        strokeDasharray={`${negativePercent}, 100`}
                        strokeDashoffset={`${-(positivePercent + neutralPercent)}`}
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    )}
                  </svg>

                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                      {total > 0 ? `${positivePercent}%` : '0%'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      {total > 0 ? 'Positive' : 'No Data'}
                    </span>
                  </div>
                </div>

                {/* Segmented Color Bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex my-2 shadow-inner">
                  <div style={{ width: `${positivePercent}%` }} className="bg-emerald-500 transition-all duration-500" title={`Positive: ${positivePercent}%`} />
                  <div style={{ width: `${neutralPercent}%` }} className="bg-amber-400 transition-all duration-500" title={`Neutral: ${neutralPercent}%`} />
                  <div style={{ width: `${negativePercent}%` }} className="bg-rose-500 transition-all duration-500" title={`Negative: ${negativePercent}%`} />
                </div>

                {/* Detailed Breakdown Legend */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Positive</span>
                    </div>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{positiveFeedbacks.length} ({positivePercent}%)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Neutral</span>
                    </div>
                    <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{neutralFeedbacks.length} ({neutralPercent}%)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Negative</span>
                    </div>
                    <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">{negativeFeedbacks.length} ({negativePercent}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Theme / Category Volume Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 3: Category Bars */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Feedback Categories</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real category volume and distribution</p>
                  </div>
                  <Link href="/feedback" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    View in Inbox →
                  </Link>
                </div>

                {sortedCategories.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No feedback category data found for this period.
                  </div>
                ) : (
                  <div className="space-y-3.5 pt-2">
                    {sortedCategories.map(([cat, data]) => {
                      const percent = total > 0 ? Math.round((data.total / total) * 100) : 0;
                      return (
                        <div key={cat} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                              <span className="text-slate-400 font-mono">({data.total} reviews)</span>
                            </div>
                            <span className="font-mono font-semibold text-slate-600 dark:text-slate-400">{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                            <div
                              className="bg-[#2D68FF] h-2 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Feedback Sources Breakdown */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Feedback Sources</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Where your customer reviews originate</p>
                </div>

                {Object.keys(channelCounts).length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No source channels recorded.
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {Object.entries(channelCounts).map(([source, count]) => {
                      const share = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={source} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{source}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{count}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({share}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Urgent Issues Queue */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-rose-200 dark:border-rose-500/25 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Urgent Issues Needing Attention ({highUrgencyItems.length})
                  </h2>
                </div>
                <Link href="/feedback?status=NEW" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  View All Feedback →
                </Link>
              </div>

              {highUrgencyItems.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">No urgent issues right now</span>
                  <p className="text-slate-500 text-xs mt-1">All urgent customer issues and bugs have been resolved.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {highUrgencyItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
                            {item.source}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30">
                            Urgent
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.category}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-200">{item.content}</p>
                        {item.customerEmail && (
                          <p className="text-[11px] text-slate-500">
                            From: {item.customerName || 'Customer'} ({item.customerEmail})
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleResolveUrgent(item.id)}
                        disabled={actioningId === item.id}
                        className="self-start sm:self-center px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <span>{actioningId === item.id ? 'Saving...' : 'Mark Resolved'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
