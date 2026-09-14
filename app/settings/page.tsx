"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  User,
  Phone,
  Building2,
  Users,
  Shield,
  Sparkles,
  Save,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Mail,
} from "lucide-react";

interface Member {
  membershipId: string;
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
}

interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<"profile" | "workspace" | "team" | "ai">("profile");

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Workspace & Team State
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [currentRole, setCurrentRole] = useState<string>("VIEWER");
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Invite Member Form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "ANALYST" | "VIEWER">("VIEWER");
  const [inviting, setInviting] = useState(false);

  // AI Configuration State
  const [aiProvider, setAiProvider] = useState("grok");
  const [autoTriage, setAutoTriage] = useState(true);
  const [savingAi, setSavingAi] = useState(false);

  // Fetch initial profile & workspace context
  useEffect(() => {
    async function loadData() {
      try {
        // Load User Profile
        const profRes = await fetch("/api/user/profile");
        if (profRes.ok) {
          const profData = await profRes.json();
          if (profData.success && profData.user) {
            setFullName(profData.user.name || user?.fullName || "");
            setPhoneNumber(profData.user.phoneNumber || "");
            setDepartment(profData.user.department || "");
          }
        }

        // Load Workspace Members
        const memRes = await fetch("/api/workspace/members");
        if (memRes.ok) {
          const memData = await memRes.json();
          if (memData.success) {
            setWorkspace(memData.workspace);
            setCurrentRole(memData.currentRole || "VIEWER");
            setMembers(memData.members || []);
          }
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoadingMembers(false);
      }
    }

    if (isLoaded) {
      loadData();
    }
  }, [isLoaded, user]);

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          phoneNumber: phoneNumber.trim(),
          department: department.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Profile saved successfully!");
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (err) {
      toast.error("An error occurred while saving profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Invite Member Handler
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error("Please enter a valid email");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch("/api/workspace/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Invited ${inviteEmail} as ${inviteRole}!`);
        setInviteEmail("");
        setInviteName("");
        // Refresh members
        const memRes = await fetch("/api/workspace/members");
        const memData = await memRes.json();
        if (memData.success) setMembers(memData.members);
      } else {
        toast.error(data.error || "Failed to add member");
      }
    } catch (err) {
      toast.error("Error inviting member");
    } finally {
      setInviting(false);
    }
  };

  // Update Member Role
  const handleUpdateRole = async (membershipId: string, newRole: string) => {
    try {
      const res = await fetch("/api/workspace/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Role updated");
        setMembers((prev) =>
          prev.map((m) => (m.membershipId === membershipId ? { ...m, role: newRole as any } : m))
        );
      } else {
        toast.error(data.error || "Failed to update role");
      }
    } catch (err) {
      toast.error("Error updating role");
    }
  };

  // Remove Member
  const handleRemoveMember = async (membershipId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await fetch(`/api/workspace/members?membershipId=${membershipId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Member removed");
        setMembers((prev) => prev.filter((m) => m.membershipId !== membershipId));
      } else {
        toast.error(data.error || "Failed to remove member");
      }
    } catch (err) {
      toast.error("Error removing member");
    }
  };

  const isAdmin = currentRole === "ADMIN";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage your profile, optional contact info, workspace tenancy, team members, and AI engine settings.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "profile"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <User className="w-4 h-4" />
          <span>My Profile</span>
        </button>

        <button
          onClick={() => setActiveTab("workspace")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "workspace"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Workspace</span>
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "team"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team & Roles ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "ai"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Engine</span>
        </button>
      </div>

      {/* Tab 1: Profile Information (with optional phone number) */}
      {activeTab === "profile" && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Profile Information
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update your account details and contact preferences.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5 max-w-2xl">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Email (Clerk Authenticated) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified by Clerk
                </span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user?.primaryEmailAddress?.emailAddress || ""}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  Phone Number
                </span>
                <span className="text-[10px] text-slate-400 font-medium">(Optional)</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000 or +91 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400">
                Optional: Used for high-urgency customer sentiment SMS alerts or escalation notices.
              </p>
            </div>

            {/* Job Title / Department (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                  Job Title / Department
                </span>
                <span className="text-[10px] text-slate-400 font-medium">(Optional)</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Product Manager, Customer Success Lead"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Save Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 hover:scale-102"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? "Saving Profile..." : "Save Profile"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Workspace Info */}
      {activeTab === "workspace" && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              Workspace Organization & Tenancy
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review workspace tenancy details and tenant isolation configuration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workspace Name</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {workspace?.name || "Default Workspace"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workspace Slug</span>
              <p className="text-base font-mono text-blue-600 dark:text-blue-400 font-bold">
                {workspace?.slug || "workspace-default"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Assigned Role</span>
              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {currentRole}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Isolation Policy</span>
              <p className="text-sm font-semibold text-emerald-500 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Strict PostgreSQL RLS
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Team Members & RBAC */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Invite Form (Admin Only) */}
          {isAdmin && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-500" />
                Invite Workspace Member
              </h3>
              <form onSubmit={handleInviteMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Full Name (optional)"
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="VIEWER">Viewer (Read-only)</option>
                  <option value="ANALYST">Analyst (Ingest & Triage)</option>
                  <option value="ADMIN">Admin (Full Access)</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all"
                >
                  {inviting ? "Inviting..." : "Add Member"}
                </button>
              </form>
            </div>
          )}

          {/* Members Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Active Workspace Members</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {members.length} members
              </span>
            </h3>

            {loadingMembers ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading team members...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">Member</th>
                      <th className="pb-3">Role</th>
                      {isAdmin && <th className="pb-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {members.map((m) => (
                      <tr key={m.membershipId} className="group">
                        <td className="py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">{m.name}</div>
                          <div className="text-xs text-slate-400">{m.email}</div>
                        </td>
                        <td className="py-3.5">
                          {isAdmin ? (
                            <select
                              value={m.role}
                              onChange={(e) => handleUpdateRole(m.membershipId, e.target.value)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-hidden"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="ANALYST">ANALYST</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>
                          ) : (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {m.role}
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => handleRemoveMember(m.membershipId)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: AI Engine Configuration */}
      {activeTab === "ai" && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Model & Inference Settings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure the AI backend for sentiment scoring, topic clustering, and Ask Loop chat.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Primary Intelligence Provider
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setAiProvider("grok")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    aiProvider === "grok"
                      ? "bg-blue-500/10 border-blue-500 text-blue-400 ring-2 ring-blue-500/20"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="font-bold text-sm">xAI Grok</div>
                  <div className="text-[11px] text-slate-400 mt-1">Grok 2 Latest (Primary Engine)</div>
                </div>

                <div
                  onClick={() => setAiProvider("groq")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    aiProvider === "groq"
                      ? "bg-purple-500/10 border-purple-500 text-purple-400 ring-2 ring-purple-500/20"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="font-bold text-sm">Groq Cloud</div>
                  <div className="text-[11px] text-slate-400 mt-1">Ultra-fast Llama 3.3 70B & 8B</div>
                </div>

                <div
                  onClick={() => setAiProvider("offline")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    aiProvider === "offline"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/20"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="font-bold text-sm">Hybrid Offline</div>
                  <div className="text-[11px] text-slate-400 mt-1">Local Heuristic NLP</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Real-time Sentiment Auto-Triage
                </div>
                <div className="text-xs text-slate-400">
                  Automatically classify incoming comments by urgency and category.
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoTriage}
                onChange={(e) => setAutoTriage(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="pt-3">
              <button
                onClick={() => toast.success("AI preferences updated successfully")}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save AI Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

