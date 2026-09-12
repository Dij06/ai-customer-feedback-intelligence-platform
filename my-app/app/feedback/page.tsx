'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface FeedbackItem {
  id: string;
  content: string;
  source: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  sentimentScore: number;
  category: string | null;
  urgency: 'High' | 'Medium' | 'Low';
  status: 'NEW' | 'REVIEWED' | 'ACTIONED';
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [context, setContext] = useState<{ workspaceName: string; userRole: string }>({
    workspaceName: 'Acme Corp',
    userRole: 'ADMIN',
  });

  const [loading, setLoading] = useState(true);
  const [reclassifyingId, setReclassifyingId] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [actionError, setActionError] = useState<string>('');

  // Filters State
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    setActionError('');
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');

      if (search.trim()) params.set('search', search.trim());
      if (sentimentFilter !== 'ALL') params.set('sentiment', sentimentFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (sourceFilter !== 'ALL') params.set('source', sourceFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (dateRangeFilter !== 'ALL') params.set('dateRange', dateRangeFilter);

      const res = await fetch(`/api/feedback?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        const list = Array.isArray(data.feedbacks) ? data.feedbacks : (Array.isArray(data.feedback) ? data.feedback : []);
        setFeedbacks(list);
        if (data.stats) setStats(data.stats);
        if (data.pagination) setPagination(data.pagination);
        if (data.context) {
          setContext({
            workspaceName: data.context.workspaceName || 'Workspace',
            userRole: data.context.userRole || 'ADMIN',
          });
        }
      } else {
        setFeedbacks([]);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, sentimentFilter, categoryFilter, sourceFilter, statusFilter, dateRangeFilter]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Debounced search / filter reset to page 1
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: newStatus as FeedbackItem['status'] } : f))
        );
        if (selectedFeedback && selectedFeedback.id === id) {
          setSelectedFeedback({ ...selectedFeedback, status: newStatus as FeedbackItem['status'] });
        }
      } else {
        setActionError(data.error || 'Permission Denied: 403 Forbidden');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setActionError('Network error updating status');
    }
  };

  const handleReclassify = async (id: string) => {
    setReclassifyingId(id);
    setActionError('');
    try {
      const res = await fetch('/api/feedback/reclassify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, ...data.feedback } : f))
        );
        if (selectedFeedback && selectedFeedback.id === id) {
          setSelectedFeedback({ ...selectedFeedback, ...data.feedback });
        }
      } else {
        setActionError(data.error || 'Permission Denied: 403 Forbidden');
      }
    } catch (err) {
      console.error('Error reclassifying feedback:', err);
      setActionError('Network error during AI reclassification');
    } finally {
      setReclassifyingId(null);
    }
  };

  const handleDeleteFeedback = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this feedback entry?')) return;

    setActionError('');
    try {
      const res = await fetch(`/api/feedback?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        if (selectedFeedback?.id === id) setSelectedFeedback(null);
      } else {
        setActionError(data.error || 'Permission Denied: Only Admins can delete feedback');
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setActionError('Network error deleting feedback');
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/feedback/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchFeedbacks();
      }
    } catch (err) {
      console.error('Error seeding data:', err);
    } finally {
      setSeeding(false);
    }
  };

  const getSentimentBadge = (sentiment: string | null) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30';
      case 'Negative':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30';
    }
  };

  const getUrgencyBadge = (urgency: string | null) => {
    switch (urgency) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 font-bold';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-[#F8F9FA] dark:bg-[#0b0f19] min-h-[calc(100vh-4rem)] transition-colors py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1F36] dark:text-white tracking-tight">
                Feedback Inbox
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Live Stream
              </span>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
              All your customer feedback in one place. We automatically detect sentiment, topics, and urgency levels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs transition-all"
            >
              <span>{seeding ? 'Adding Data...' : 'Add Sample Data'}</span>
            </button>

          <Link
            href="/feedback/import"
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Upload CSV</span>
          </Link>

          <Link
            href="/feedback/new"
            className={`px-4 py-2 text-xs sm:text-sm font-semibold text-white rounded-lg shadow-sm transition-all flex items-center gap-2 ${
              context.userRole === 'VIEWER'
                ? 'bg-slate-400 dark:bg-slate-800 cursor-not-allowed pointer-events-none'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <span>+ Add Feedback</span>
          </Link>
        </div>
      </div>

      {/* Role Notice & Error Alerts */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-800 dark:hover:text-white">✕</button>
        </div>
      )}

      {context.userRole === 'VIEWER' && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 shadow-xs">
          <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>Viewer Mode (Read-Only):</strong> You can browse and search feedback in <strong>{context.workspaceName}</strong>. Editing, status changes, and deletions are reserved for Admins and Analysts.
          </span>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Feedback</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5">{stats.total}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Positive Feedback</p>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5">{stats.positiveRatio}%</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">High Urgency</p>
          <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1.5">{stats.highUrgency}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Negative Issues</p>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1.5">{stats.negative}</p>
        </div>
      </div>

      {/* Search & Multi-filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Search feedback text, email, customer name..."
            value={search}
            onChange={(e) => handleFilterChange(setSearch, e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => handleFilterChange(setSentimentFilter, e.target.value)}
            aria-label="Filter by sentiment"
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Sentiments</option>
            <option value="Positive">Positive (POS)</option>
            <option value="Neutral">Neutral (NEU)</option>
            <option value="Negative">Negative (NEG)</option>
          </select>

          {/* Category/Theme Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => handleFilterChange(setCategoryFilter, e.target.value)}
            aria-label="Filter by category"
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Themes</option>
            <option value="Performance">Performance</option>
            <option value="Bug">Bug</option>
            <option value="Feature Request">Feature Request</option>
            <option value="UI/UX">UI/UX</option>
            <option value="Billing">Billing</option>
            <option value="Support">Support</option>
          </select>

          {/* Channel Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => handleFilterChange(setSourceFilter, e.target.value)}
            aria-label="Filter by channel"
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Channels</option>
            <option value="Email">Email</option>
            <option value="Twitter">Twitter / X</option>
            <option value="Discord">Discord</option>
            <option value="Support Ticket">Support Ticket</option>
            <option value="Survey">Survey</option>
            <option value="App Store">App Store</option>
          </select>

          {/* Status Workflow Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            aria-label="Filter by workflow status"
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ACTIONED">Actioned</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => handleFilterChange(setDateRangeFilter, e.target.value)}
            aria-label="Filter by date range"
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Feedback Feed */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium">Loading feedback...</div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <p className="text-slate-500 dark:text-slate-400 font-medium">No feedback items found matching your filters.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={handleSeedData}
              className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg hover:bg-blue-100"
            >
              Add Sample Feedback Data
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {feedbacks.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/90 hover:border-blue-400/60 dark:hover:border-blue-500/40 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
              onClick={() => setSelectedFeedback(item)}
            >
              <div className="flex-1 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {item.source}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${getSentimentBadge(item.sentiment)}`}>
                    {item.sentiment || 'Neutral'} {item.sentimentScore !== null ? `(${item.sentimentScore > 0 ? '+' : ''}${item.sentimentScore})` : ''}
                  </span>
                  {item.category && (
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20 font-medium">
                      {item.category}
                    </span>
                  )}
                  {item.urgency && item.urgency !== 'Low' && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-md border font-semibold ${getUrgencyBadge(item.urgency)}`}>
                      {item.urgency} Urgency
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium ml-auto sm:ml-2">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed line-clamp-2">
                  {item.content}
                </p>

                {item.summary && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                      Summary
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic font-medium">
                      &ldquo;{item.summary}&rdquo;
                    </p>
                  </div>
                )}

                {item.customerEmail && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.customerName || 'Customer'}</span>
                    <span>&lt;{item.customerEmail}&gt;</span>
                  </p>
                )}
              </div>

              {/* Action Controls */}
              <div
                className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Re-analyze Button */}
                <button
                  onClick={() => handleReclassify(item.id)}
                  disabled={reclassifyingId === item.id || context.userRole === 'VIEWER'}
                  className="px-3 py-1.5 text-xs font-semibold text-[#2D68FF] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-700/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg disabled:opacity-50 transition-all flex items-center gap-1.5"
                  title="Re-run AI analysis"
                >
                  <svg className={`w-3 h-3 ${reclassifyingId === item.id ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{reclassifyingId === item.id ? 'Analyzing...' : 'Re-analyze'}</span>
                </button>

                {/* Status Selector */}
                <select
                  value={item.status || 'NEW'}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  disabled={context.userRole === 'VIEWER'}
                  aria-label="Change status"
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="NEW">New</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="ACTIONED">Actioned</option>
                </select>

                {/* Delete Button (Admins only) */}
                {context.userRole === 'ADMIN' && (
                  <button
                    onClick={(e) => handleDeleteFeedback(item.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                    title="Delete feedback entry"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Showing Page <strong className="text-slate-900 dark:text-white font-mono">{pagination.page}</strong> of <strong className="text-slate-900 dark:text-white font-mono">{pagination.totalPages}</strong> ({pagination.total} total items)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {selectedFeedback.source}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getSentimentBadge(selectedFeedback.sentiment)}`}>
                  {selectedFeedback.sentiment} ({selectedFeedback.sentimentScore})
                </span>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Feedback</h3>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 whitespace-pre-wrap leading-relaxed">
                {selectedFeedback.content}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Category:</span>
                <span className="ml-2 font-semibold text-slate-800 dark:text-slate-200">{selectedFeedback.category || 'General'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Urgency:</span>
                <span className="ml-2 font-semibold text-slate-800 dark:text-slate-200">{selectedFeedback.urgency || 'Low'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Customer:</span>
                <span className="ml-2 font-semibold text-slate-800 dark:text-slate-200">{selectedFeedback.customerName || 'Anonymous'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Email:</span>
                <span className="ml-2 font-semibold text-slate-800 dark:text-slate-200 font-mono">{selectedFeedback.customerEmail || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 dark:text-slate-400">Quick Summary:</span>
                <p className="mt-1 font-medium text-slate-800 dark:text-slate-300 italic">{selectedFeedback.summary || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReclassify(selectedFeedback.id)}
                  disabled={reclassifyingId === selectedFeedback.id || context.userRole === 'VIEWER'}
                  className="px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-700/60 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {reclassifyingId === selectedFeedback.id ? 'Analyzing...' : 'Re-analyze with AI'}
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
                  <select
                    value={selectedFeedback.status || 'NEW'}
                    onChange={(e) => handleStatusChange(selectedFeedback.id, e.target.value)}
                    disabled={context.userRole === 'VIEWER'}
                    aria-label="Change status in modal"
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="NEW">New</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="ACTIONED">Actioned</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
