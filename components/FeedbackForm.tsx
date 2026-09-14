"use client";

import { useState } from "react";

interface FeedbackFormProps {
  workspaceId?: string;
}

export default function FeedbackForm({ workspaceId }: FeedbackFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Prisma Studio ki existing Workspace ID as automatic fallback
  const activeWorkspaceId = workspaceId || "cmtbcxvci0000ex7dtmteat";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description) {
      alert("Please fill in both title and description!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          workspaceId: activeWorkspaceId,
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        alert("Feedback submitted successfully!");
        window.location.reload();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || "Failed to submit"}`);
      }
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Something went wrong while submitting feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
      <h3 className="text-lg font-bold">Add New Feedback</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bug in navigation menu"
            className="w-full p-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide detail about the feedback..."
            rows={4}
            className="w-full p-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}