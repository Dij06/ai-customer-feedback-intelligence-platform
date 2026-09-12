'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { analyzeFeedbackWithAI } from '@/lib/ai';

export default function NewFeedbackPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [source, setSource] = useState('Web Form');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Live client-side preview using classification analysis helper
  const liveAnalysis = content.trim() ? analyzeFeedbackWithAI(content) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please provide feedback content');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          source,
          customerName,
          customerEmail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/feedback');
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error(err);
      setError('Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadSample = (type: 'praise' | 'bug' | 'billing') => {
    if (type === 'praise') {
      setContent('The new summary report generator saved our product operations team 4 hours this week. Clean design and lightning fast.');
      setSource('Twitter');
      setCustomerName('Jordan Taylor');
      setCustomerEmail('jordan@cloudscale.io');
    } else if (type === 'bug') {
      setContent('The PDF report download crashes with a 500 error when the date filter is set to past 90 days. Urgent blocker for our quarterly customer review.');
      setSource('Support Ticket');
      setCustomerName('Morgan Lee');
      setCustomerEmail('m.lee@enterprise.com');
    } else {
      setContent('We were billed twice on our annual renewal invoice. Need an immediate refund for the duplicate charge on account AC-8821.');
      setSource('Email');
      setCustomerName('Samantha Reed');
      setCustomerEmail('sreed@venture.co');
    }
  };

  return (
    <div className="bg-[#F8F9FA] dark:bg-[#0b0f19] min-h-[calc(100vh-4rem)] transition-colors py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <Link href="/feedback" className="text-xs font-bold text-[#2D68FF] hover:underline flex items-center gap-1.5 mb-2">
            ← Back to Feedback Inbox
          </Link>
          <h1 className="text-3xl font-extrabold text-[#1A1F36] dark:text-white tracking-tight">
            Add Customer Feedback
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            Type or paste customer feedback from any channel. LOOP will automatically detect the sentiment, category, and urgency for you.
          </p>
        </div>

        {/* Quick Fill Presets */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Try an Example:</span>
          <button
            type="button"
            onClick={() => loadSample('praise')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 transition-all"
          >
            Product Praise
          </button>
          <button
            type="button"
            onClick={() => loadSample('bug')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 transition-all"
          >
            Urgent Bug Report
          </button>
          <button
            type="button"
            onClick={() => loadSample('billing')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 transition-all"
          >
            Billing Issue
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Ingestion Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Customer Feedback *
                </label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste what the customer said (e.g. an email, review, or chat message)..."
                  className="w-full p-3.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2D68FF] focus:bg-white dark:focus:bg-slate-950 transition-all leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Where did this come from?
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#2D68FF] font-medium"
                  >
                    <option value="Web Form">Web Form</option>
                    <option value="Email">Email</option>
                    <option value="Twitter">Twitter / X</option>
                    <option value="Discord">Discord</option>
                    <option value="Support Ticket">Support Ticket</option>
                    <option value="Survey">Customer Survey</option>
                    <option value="App Store">App Store / Play Store</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2D68FF] focus:bg-white dark:focus:bg-slate-950 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Customer Email (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@company.com"
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2D68FF] focus:bg-white dark:focus:bg-slate-950 transition-all"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/feedback"
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#2D68FF] hover:bg-blue-600 rounded-xl shadow-md shadow-[#2D68FF]/20 transition-all flex items-center gap-2"
                >
                  {submitting ? 'Saving...' : 'Save Feedback'}
                </button>
              </div>
            </form>
          </div>

          {/* Real-Time Live Preview Panel */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="w-2 h-2 rounded-full bg-[#2D68FF]" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Live AI Preview</h3>
              </div>

              {liveAnalysis ? (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Sentiment</span>
                    <span
                      className={`inline-block font-semibold px-2.5 py-1 rounded-md border ${
                        liveAnalysis.sentiment === 'Positive'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                          : liveAnalysis.sentiment === 'Negative'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                      }`}
                    >
                      {liveAnalysis.sentiment} ({liveAnalysis.sentimentScore > 0 ? '+' : ''}{liveAnalysis.sentimentScore})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Category</span>
                    <span className="inline-block font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30">
                      {liveAnalysis.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Urgency</span>
                    <span
                      className={`inline-block font-semibold px-2.5 py-1 rounded-md border ${
                        liveAnalysis.urgency === 'High'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {liveAnalysis.urgency} Urgency
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Quick Summary</span>
                    <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 italic">
                      &ldquo;{liveAnalysis.summary}&rdquo;
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  Start typing feedback on the left to see the live AI preview.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
