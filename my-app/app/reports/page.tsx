'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ReportData {
  id: string;
  title: string;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
  content: {
    title: string;
    period: string;
    generatedAt: string;
    executiveSummary: string;
    stats: {
      totalFeedback: number;
      positiveCount: number;
      neutralCount: number;
      negativeCount: number;
      netSentimentScore: string;
    };
    topThemes: Array<{
      theme: string;
      sentiment: string;
      count: number;
      spikeIndicator: string;
      insight: string;
    }>;
    notableQuotes: Array<{
      quote: string;
      author: string;
      sentiment: 'Positive' | 'Negative' | 'Neutral';
    }>;
    recommendedActions: Array<{
      priority: 'P0 - Blocker' | 'P1 - High' | 'P2 - Medium';
      action: string;
      owner: string;
    }>;
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [userRole, setUserRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER'>('ADMIN');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
        if (data.reports && data.reports.length > 0) {
          setSelectedReport(data.reports[0]);
        }
        if (data.context?.userRole) {
          setUserRole(data.context.userRole);
        }
      }
    } catch (err) {
      console.error('Failed to load VoC reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const periodLabel = period === '7d' ? 'Last 7 Days' : period === '90d' ? 'Last Quarter (90 Days)' : 'Last 30 Days';
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: periodLabel }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReports((prev) => [data.report, ...prev]);
        setSelectedReport(data.report);
      } else {
        alert(data.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Error generating executive report');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors print:bg-white print:text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Weekly &amp; Monthly Digests
              </span>
              <span className="text-2xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800">
                Executive Ready
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mt-2 text-slate-900 dark:text-white">
              Customer Feedback Reports
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              One-click executive summaries highlighting top customer feedback, sentiment trends, notable quotes, and action items.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/trends"
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
            >
              &larr; View Trends
            </Link>
            <button
              onClick={handlePrint}
              disabled={!selectedReport}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Save / Print PDF</span>
            </button>
          </div>
        </div>

        {/* Generator Controls */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Timeframe</span>
            <div className="flex items-center gap-2 pt-1">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    period === p
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {p === '7d' ? 'Last 7 Days' : p === '90d' ? 'Last Quarter (90d)' : 'Last 30 Days'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generating || userRole === 'VIEWER'}
            className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating Report...
              </>
            ) : (
              'Generate Summary Report'
            )}
          </button>
        </div>

        {/* Report Content + Sidebar Archive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Saved Reports Sidebar */}
          <div className="lg:col-span-1 space-y-3 print:hidden">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
              Previous Reports ({reports.length})
            </h3>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No saved reports yet. Click Generate above to create one.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {reports.map((rep) => {
                  const isSelected = selectedReport?.id === rep.id;
                  return (
                    <button
                      key={rep.id}
                      onClick={() => setSelectedReport(rep)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {rep.title || 'Summary Report'}
                      </div>
                      <div className="flex items-center justify-between text-2xs text-slate-400 mt-1">
                        <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {rep.content?.stats?.netSentimentScore || 'Active'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Report Viewer / Canvas */}
          <div className="lg:col-span-3">
            {selectedReport ? (
              <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-8 print:p-0 print:border-none print:shadow-none">
                
                {/* Report Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Customer Feedback Summary
                    </span>
                    <span className="text-xs text-slate-400">
                      Generated {new Date(selectedReport.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {selectedReport.content?.title || selectedReport.title}
                  </h2>
                  <div className="text-xs font-medium text-slate-500">
                    Period: {selectedReport.content?.period || 'Last 30 Days'}
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Executive Summary
                  </h3>
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-normal">
                    {selectedReport.content?.executiveSummary}
                  </div>
                </div>

                {/* Stat Metrics Grid */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Feedback Numbers &amp; Sentiment
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <div className="text-2xs font-semibold text-slate-500 uppercase">Total Reviews</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {selectedReport.content?.stats?.totalFeedback || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <div className="text-2xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Positive Feedback</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {selectedReport.content?.stats?.positiveCount || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <div className="text-2xs font-semibold text-rose-600 dark:text-rose-400 uppercase">Issues &amp; Bugs</div>
                      <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                        {selectedReport.content?.stats?.negativeCount || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <div className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">Net Sentiment</div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        {selectedReport.content?.stats?.netSentimentScore || '0%'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Surging Themes Table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Top Feedback Themes
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3.5">Topic</th>
                          <th className="p-3.5">Volume</th>
                          <th className="p-3.5">Trend</th>
                          <th className="p-3.5">Key Insight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedReport.content?.topThemes?.map((th, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">{th.theme}</td>
                            <td className="p-3.5 font-medium text-slate-600 dark:text-slate-300">{th.count} reviews</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                                  th.spikeIndicator.includes('Surge')
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                {th.spikeIndicator}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-300">{th.insight}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notable Verbatim Quotes */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    What Customers Are Saying
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedReport.content?.notableQuotes?.map((quote, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between space-y-3"
                      >
                        <p className="text-xs italic text-slate-700 dark:text-slate-200">
                          &ldquo;{quote.quote}&rdquo;
                        </p>
                        <div className="flex items-center justify-between text-2xs pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                          <span className="font-semibold text-slate-500">{quote.author}</span>
                          <span
                            className={`font-bold ${
                              quote.sentiment === 'Positive'
                                ? 'text-emerald-600'
                                : quote.sentiment === 'Negative'
                                ? 'text-rose-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {quote.sentiment}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prioritized Recommended Actions */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Recommended Next Steps
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3.5">Priority</th>
                          <th className="p-3.5">Action Item</th>
                          <th className="p-3.5">Designated Owner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedReport.content?.recommendedActions?.map((act, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                                  act.priority.includes('P0')
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                    : act.priority.includes('P1')
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                }`}
                              >
                                {act.priority}
                              </span>
                            </td>
                            <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">{act.action}</td>
                            <td className="p-3.5 font-semibold text-slate-500">{act.owner}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500">Select a report from the list or generate a new digest above.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
