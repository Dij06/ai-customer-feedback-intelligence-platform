'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analyzeFeedbackWithAI } from '@/lib/ai';

interface RawParsedData {
  headers: string[];
  rawRows: Record<string, string>[];
}

interface MappedFeedbackItem {
  content: string;
  source: string;
  customerName: string;
  customerEmail: string;
  predictedSentiment: string;
  predictedCategory: string;
}

export default function BulkImportPage() {
  const router = useRouter();
  const [parsedData, setParsedData] = useState<RawParsedData | null>(null);
  const [contentCol, setContentCol] = useState<string>('');
  const [sourceCol, setSourceCol] = useState<string>('');
  const [nameCol, setNameCol] = useState<string>('');
  const [emailCol, setEmailCol] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Smart Fuzzy Column Matcher for universal CSV format support
  const detectColumn = (headers: string[], synonyms: string[]): string => {
    for (const syn of synonyms) {
      const found = headers.find((h) => {
        const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        const target = syn.toLowerCase().replace(/[^a-z0-9]/g, '');
        return clean.includes(target) || target.includes(clean);
      });
      if (found) return found;
    }
    return '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

        if (lines.length <= 1) {
          setError('The uploaded CSV file is empty or missing data rows.');
          setLoading(false);
          return;
        }

        // Header detection (quotes stripped)
        const headers = lines[0]
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map((h) => h.replace(/^"|"$/g, '').trim());

        const rawRows: Record<string, string>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const cols = line
            .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
            .map((c) => c.replace(/^"|"$/g, '').trim());

          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] || '';
          });
          rawRows.push(rowObj);
        }

        // Auto-detect matching columns from any CRM/tool (Zendesk, Intercom, App Store, Typeform, etc.)
        const autoContent =
          detectColumn(headers, [
            'content', 'feedback', 'text', 'review', 'comment', 'message',
            'description', 'body', 'issue', 'summary', 'response', 'note',
            'ticket', 'details', 'complaint', 'opinion',
          ]) || headers[0] || '';

        const autoSource = detectColumn(headers, [
          'source', 'channel', 'platform', 'origin', 'type', 'medium', 'category',
        ]);

        const autoName = detectColumn(headers, [
          'customer_name', 'name', 'customer', 'user', 'author', 'sender',
          'client', 'respondent', 'reviewer', 'full_name',
        ]);

        const autoEmail = detectColumn(headers, [
          'customer_email', 'email', 'user_email', 'contact', 'mail', 'email_address',
        ]);

        setContentCol(autoContent);
        setSourceCol(autoSource);
        setNameCol(autoName);
        setEmailCol(autoEmail);

        setParsedData({ headers, rawRows });
      } catch (err) {
        console.error(err);
        setError('Failed to parse CSV file. Please verify standard CSV encoding.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Re-map rows dynamically as the user modifies column dropdowns
  const mappedRows: MappedFeedbackItem[] = useMemo(() => {
    if (!parsedData || !contentCol) return [];

    return parsedData.rawRows
      .filter((r) => (r[contentCol] || '').trim().length > 0)
      .map((r) => {
        const content = r[contentCol] || '';
        const source = (sourceCol && r[sourceCol]) ? r[sourceCol] : 'CSV Upload';
        const customerName = (nameCol && r[nameCol]) ? r[nameCol] : '';
        const customerEmail = (emailCol && r[emailCol]) ? r[emailCol] : '';

        const ai = analyzeFeedbackWithAI(content);

        return {
          content,
          source,
          customerName,
          customerEmail,
          predictedSentiment: ai.sentiment,
          predictedCategory: ai.category,
        };
      });
  }, [parsedData, contentCol, sourceCol, nameCol, emailCol]);

  const handleImportAll = async () => {
    if (mappedRows.length === 0) return;
    setImporting(true);
    setError('');
    let imported = 0;

    for (let i = 0; i < mappedRows.length; i++) {
      const row = mappedRows[i];
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: row.content,
            source: row.source,
            customerName: row.customerName,
            customerEmail: row.customerEmail,
          }),
        });
        imported += 1;
        setProgress(Math.round(((i + 1) / mappedRows.length) * 100));
      } catch (err) {
        console.error(err);
      }
    }

    setImporting(false);
    setSuccessCount(imported);
    setTimeout(() => {
      router.push('/feedback');
    }, 1500);
  };

  const downloadSampleCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Feedback_Text,Channel_Source,Customer_Full_Name,Contact_Email\n' +
      '"The analytics dashboard performance is 10x faster now. Great job team!","Twitter","Sam Altman","sam@openai.com"\n' +
      '"Getting 403 forbidden error when inviting new analyst teammates.","Support Ticket","David Miller","dmiller@work.io"\n' +
      '"Please add dark mode export options and webhook notifications.","Discord","Alex Kim","alex.kim@dev.net"\n' +
      '"Double billed on our enterprise subscription renewal this morning.","Email","Sarah Jenkins","sarah@enterprise.com"\n' +
      '"Mobile app search bar freezes on iOS 17 update.","App Store","Chris Evans","chris.e@mobile.org"\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_customer_feedback.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-[#0b0f19] min-h-[calc(100vh-4rem)] transition-colors py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/feedback"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5 mb-1.5"
            >
              ← Back to Feedback Inbox
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Upload Feedback CSV
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-normal">
              Upload a spreadsheet or CSV export of customer reviews, support tickets, or emails. We&apos;ll automatically organize and score them with AI.
            </p>
          </div>

          <button
            type="button"
            onClick={downloadSampleCSV}
            className="self-start md:self-auto px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg shadow-sm transition-all"
          >
            Download Sample CSV
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Upload Dropzone */}
        <div className="p-12 sm:p-14 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-center transition-all shadow-xs">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            id="csvFileInput"
            className="hidden"
          />
          <label htmlFor="csvFileInput" className="cursor-pointer block">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white block">
              Click to upload your CSV file
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
              Works with exports from Zendesk, Intercom, App Store, Typeform, Excel, or Google Sheets.
            </span>
          </label>
        </div>

        {/* Universal Column Mapping Configurator */}
        {parsedData && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Match Your CSV Columns
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  We picked the best columns for you. You can adjust any of them below if needed.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {parsedData.rawRows.length} rows detected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Feedback Content *
                </label>
                <select
                  value={contentCol}
                  onChange={(e) => setContentCol(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Content Column</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Channel / Source
                </label>
                <select
                  value={sourceCol}
                  onChange={(e) => setSourceCol(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Default: &quot;CSV Upload&quot;</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Customer Name
                </label>
                <select
                  value={nameCol}
                  onChange={(e) => setNameCol(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Optional: None</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Customer Email
                </label>
                <select
                  value={emailCol}
                  onChange={(e) => setEmailCol(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Optional: None</option>
                  {parsedData.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Live Preview of Parsed Rows */}
        {loading && <p className="text-center text-slate-500 dark:text-slate-400 py-6 text-sm font-medium">Parsing CSV & Running AI Previews...</p>}

        {mappedRows.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-200">
                Parsed {mappedRows.length} Feedback Rows Ready for Import
              </span>
              <button
                onClick={handleImportAll}
                disabled={importing}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
              >
                {importing ? `Importing (${progress}%)...` : `Import All ${mappedRows.length} Items`}
              </button>
            </div>

            {importing && (
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-2 transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
            )}

            {successCount !== null && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                Successfully imported {successCount} feedbacks! Redirecting to inbox...
              </div>
            )}

            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Content</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">AI Sentiment</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Customer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-300">
                  {mappedRows.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 max-w-xs truncate font-medium text-slate-900 dark:text-slate-100">{row.content}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{row.source}</td>
                      <td className="p-3">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{row.predictedSentiment}</span>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{row.predictedCategory}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">{row.customerEmail || row.customerName || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mappedRows.length > 10 && (
                <p className="p-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                  + {mappedRows.length - 10} more rows ready to import
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
