"use client";

import { useEffect, useState } from "react";
import { FileText, Award, AlertCircle, CheckCircle2, Lightbulb } from "lucide-react";

interface VocReport {
  summary: string;
  csatScore: string;
  topComplaints: string[];
  keyWins: string[];
  actionItems: string[];
}

export default function VocReportCard({ workspaceId }: { workspaceId?: string }) {
  const [report, setReport] = useState<VocReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVocReport = async () => {
      try {
        const res = await fetch(`/api/reports/voc?workspaceId=${workspaceId || ""}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        }
      } catch (err) {
        console.error("Failed to load VoC Report", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVocReport();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-16 bg-gray-100 rounded-xl"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="h-20 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 my-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 border-gray-100">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Voice of Customer (VoC) Report</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
          <Award className="h-4 w-4" />
          <span>CSAT: {report?.csatScore || "N/A"}</span>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Executive Summary</h4>
        <p className="text-sm text-gray-700 leading-relaxed">{report?.summary || "No summary available."}</p>
      </div>

      {/* Grid: Complaints & Wins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Wins */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
          <div className="flex items-center gap-2 mb-2 text-emerald-800 font-semibold text-xs uppercase">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Key Customer Wins
          </div>
          <ul className="space-y-1.5 text-xs text-gray-700 list-disc list-inside">
            {(report?.keyWins || []).map((win, i) => (
              <li key={i}>{win}</li>
            ))}
          </ul>
        </div>

        {/* Top Complaints */}
        <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
          <div className="flex items-center gap-2 mb-2 text-red-800 font-semibold text-xs uppercase">
            <AlertCircle className="h-4 w-4 text-red-600" /> Top Pain Points
          </div>
          <ul className="space-y-1.5 text-xs text-gray-700 list-disc list-inside">
            {(report?.topComplaints || []).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Items */}
      <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
        <div className="flex items-center gap-2 mb-2 text-indigo-800 font-semibold text-xs uppercase">
          <Lightbulb className="h-4 w-4 text-indigo-600" /> Recommended Strategic Actions
        </div>
        <ul className="space-y-1 text-xs text-gray-700 list-disc list-inside">
          {(report?.actionItems || []).map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}