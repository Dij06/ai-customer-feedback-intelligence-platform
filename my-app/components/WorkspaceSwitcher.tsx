"use client";

import { useEffect, useState } from "react";

interface Workspace {
  id: string;
  name: string;
  role: "ADMIN" | "MEMBER";
}

export default function WorkspaceSwitcher({
  onSelectWorkspace,
}: {
  onSelectWorkspace: (ws: Workspace) => void;
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        const res = await fetch("/api/workspace");
        if (res.ok) {
          const data: Workspace[] = await res.json();
          setWorkspaces(data);
          if (data.length > 0) {
            setSelectedId(data[0].id);
            if (typeof onSelectWorkspace === "function"){
              onSelectWorkspace(data[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch workspaces", err);
      }
    }
    fetchWorkspaces();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wsId = e.target.value;
    setSelectedId(wsId);
    const ws = workspaces.find((w) => w.id === wsId);
    if (ws) onSelectWorkspace(ws);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Workspace:</label>
      <select
        value={selectedId}
        onChange={handleChange}
        className="p-2 border rounded-md bg-white shadow-sm text-sm"
      >
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name} ({ws.role})
          </option>
        ))}
      </select>
    </div>
  );
}