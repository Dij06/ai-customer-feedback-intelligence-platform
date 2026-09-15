'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface CitationItem {
  id: string;
  content: string;
  source: string;
  sentiment: string;
  customerName?: string | null;
  createdAt: string | Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  confidence?: number;
  provider?: string;
  citedItems?: CitationItem[];
  suggestedFollowUps?: string[];
}

function getFormattedTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createMsgId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function AskLoopPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm **Ask LOOP**, your AI customer intelligence assistant powered by **Grok (xAI)**. Ask me anything in plain English about what customers like, top complaints, bug reports, or feature requests.",
      timestamp: 'Just now',
      suggestedFollowUps: [
        'What are users saying about onboarding & workspace setup?',
        'Why are customers complaining about billing and invoices?',
        'What features are customers praising the most?',
        'Are there any critical bugs blocking engineering teams?',
      ],
    },
  ]);

  const handleAsk = async (textToSend?: string) => {
    const question = textToSend || query;
    if (!question.trim() || loading) return;

    const userMsg: Message = {
      id: createMsgId('user'),
      role: 'user',
      content: question,
      timestamp: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      if (data.success) {
        const aiMsg: Message = {
          id: createMsgId('ai'),
          role: 'assistant',
          content: data.answer,
          timestamp: getFormattedTime(),
          confidence: data.confidence,
          provider: data.provider,
          citedItems: data.citedItems || [],
          suggestedFollowUps: data.suggestedFollowUps || [],
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: Message = {
          id: createMsgId('err'),
          role: 'assistant',
          content: 'Sorry, I had trouble searching the workspace feedback. Please try again.',
          timestamp: getFormattedTime(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error('Ask LOOP error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 flex flex-col h-[calc(100vh-5rem)]">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-5 sm:pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Ask LOOP AI
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Ask questions in plain English and get honest answers backed by real customer reviews.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link
              href="/trends"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            >
              &larr; View Trends
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
            >
              <span>Weekly Reports</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl p-5 shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                }`}
              >
                {/* Provider tag */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-2xs text-slate-400">
                    <span className="font-semibold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      {msg.provider || 'Grok (xAI)'}
                    </span>
                    {msg.confidence && (
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">
                        Verified from workspace data
                      </span>
                    )}
                  </div>
                )}

                {/* Message text */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-normal">
                  {msg.content}
                </p>

                {/* Citations and customer quotes */}
                {msg.citedItems && msg.citedItems.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Customer Quotes &amp; Evidence ({msg.citedItems.length})
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.citedItems.map((cite, i) => (
                        <div
                          key={cite.id || i}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <div className="flex items-center justify-between text-2xs text-slate-400 mb-1">
                            <span className="font-medium text-slate-600 dark:text-slate-400">
                              {cite.source} · {cite.customerName || 'Customer'}
                            </span>
                            <span
                              className={`font-semibold ${
                                cite.sentiment === 'Positive'
                                  ? 'text-emerald-600'
                                  : cite.sentiment === 'Negative'
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {cite.sentiment}
                            </span>
                          </div>
                          <p className="italic text-slate-700 dark:text-slate-300">&ldquo;{cite.content}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested follow-up prompts */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2 max-w-2xl">
                  {msg.suggestedFollowUps.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(prompt)}
                      className="px-3 py-1 text-2xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-all text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              <span className="text-2xs text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                Searching through customer feedback to write your answer...
              </div>
            </div>
          )}
        </div>

        {/* Input form */}
        <div className="pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about customer feedback (e.g. 'What are top complaints this month?')..."
              className="flex-1 px-4 py-3 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl transition-all shadow-xs shrink-0"
            >
              {loading ? 'Analyzing...' : 'Ask AI'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
