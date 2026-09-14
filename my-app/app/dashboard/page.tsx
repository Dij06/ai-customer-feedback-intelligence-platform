"use client";

import { useState, useEffect } from "react";
import FeedbackForm from "@/components/FeedbackForm";
import CsvUpload from "@/components/CsvUpload";
import FeedbackInbox from "@/components/FeedbackInbox";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import Analytics from "@/components/dashboard/Analytics"; 
import AiInsightsCard from "@/components/dashboard/AilnsightsCard";
import AskLoopChat from "@/components/dashboard/AskLoopChat";
import VocReportCard from "@/components/dashboard/VocReportCard";
import ExportPdfButton from "@/components/dashboard/ExportPdfButton";

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch("/api/workspace");
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(data);
          if (data.length > 0) setCurrentWorkspace(data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch workspaces", err);
      }
    };
    fetchWorkspaces();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-background min-h-screen">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Feedback Intelligence</h1>
          <p className="text-sm text-gray-500">Manage feedback, analytics, and bulk import.</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <ExportPdfButton />
          {WorkspaceSwitcher && (
            <WorkspaceSwitcher onSelectWorkspace={(ws: any) => setCurrentWorkspace(ws)} />
          )}
        </div>
      </div>

      {/* Analytics Graph Section */}
      <div className="w-full">
        <Analytics workspaceId={currentWorkspace?.id} />
      </div>

      {/* Voice of Customer Executive Report */}
      <div className="w-full">
        <VocReportCard workspaceId={currentWorkspace?.id} />
      </div>

      {/* AI Insights Section */}
      <div className="w-full">
        <AiInsightsCard workspaceId={currentWorkspace?.id} />
      </div>

      {/* Ask Loop AI Assistant Section */}
      <div className="w-full">
        <AskLoopChat workspaceId={currentWorkspace?.id} />
      </div>

      {/* Main Form & Inbox Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        <div className="space-y-6">
          <FeedbackForm workspaceId={currentWorkspace?.id} />
          <CsvUpload workspaceId={currentWorkspace?.id} />
        </div>
        <div>
          <FeedbackInbox workspaceId={currentWorkspace?.id} />
        </div>
      </div>
    </div>
  );
}