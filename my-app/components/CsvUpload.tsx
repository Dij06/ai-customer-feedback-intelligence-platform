"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";

interface CsvUploadProps {
  workspaceId?: string;
  onSuccess?: () => void;
}

export default function CsvUpload({ workspaceId, onSuccess }: CsvUploadProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeWorkspaceId = workspaceId || "cmtbcxvci0000ex7dtm";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setStatus("Parsing CSV...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[];
        
        // CSV parsing fallback for common feedback column names
        const feedbackList = rows
          .map((row) => row.feedback || row.text || row.content || row.Description || Object.values(row)[0])
          .filter((text): text is string => Boolean(text && text.trim().length > 0));

        if (feedbackList.length === 0) {
          setStatus("Error: CSV file is empty or missing content columns.");
          setLoading(false);
          return;
        }

        setStatus(`Groq AI analyzing ${feedbackList.length} feedback items...`);

        try {
          const res = await fetch("/api/feedback/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              feedbacks: feedbackList,
              workspaceId: activeWorkspaceId,
            }),
          });

          if (res.ok) {
            setStatus(`Success! Processed & saved ${feedbackList.length} items.`);
            if (fileInputRef.current) fileInputRef.current.value = "";
            if (onSuccess) onSuccess();
          } else {
            const errData = await res.json().catch(() => ({}));
            setStatus(`Import failed: ${errData.error || "Server Error"}`);
          }
        } catch {
          setStatus("Network error while connecting to server.");
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        setStatus(`CSV Parse Error: ${error.message}`);
        setLoading(false);
      },
    });
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-3">
        Bulk Upload Feedback
      </h3>

      <div className="relative border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-6 text-center bg-gray-50/50 hover:bg-blue-50/30 transition-all cursor-pointer group">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
            {loading ? "⏳" : "📄"}
          </div>

          <div className="text-sm text-gray-600">
            <span className="text-blue-600 font-semibold group-hover:underline">
              Click to upload CSV
            </span>{" "}
            or drag and drop
          </div>

          {fileName && (
            <p className="text-xs font-medium text-gray-500">
              Selected: <span className="text-gray-800 font-semibold">{fileName}</span>
            </p>
          )}
        </div>
      </div>

      {status && (
        <div
          className={`mt-3 p-3 rounded-lg text-xs font-semibold ${
            status.includes("Success")
              ? "bg-green-50 text-green-700 border border-green-200"
              : status.includes("Error") || status.includes("failed")
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {status}
        </div>
      )}
    </div>
  );
}