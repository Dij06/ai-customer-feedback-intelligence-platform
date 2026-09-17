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

  // Member Deletion State (in-app modal)
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  // AI Configuration State
  const [aiProvider, setAiProvider] = useState("groq");
  const [autoTriage, setAutoTriage] = useState(true);

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

        // Load AI Preferences from Local Storage
        const savedAi = localStorage.getItem("loop_ai_provider");
        if (savedAi) setAiProvider(savedAi);
        const savedAuto = localStorage.getItem("loop_auto_triage");
        if (savedAuto !== null) setAutoTriage(savedAuto === "true");
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoadingMembers(false);
      }
    }

    if (isLoaded) {
      loadData();
    }
  }, [isLoaded, user?.id]);

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

  // Remove Member Confirm Handler
  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setRemovingMember(true);
    try {
      const res = await fetch(`/api/workspace/members?membershipId=${memberToRemove}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Member removed");
        setMembers((prev) => prev.filter((m) => m.membershipId !== memberToRemove));
        setMemberToRemove(null);
      } else {
        toast.error(data.error || "Failed to remove member");
      }
    } catch (err) {
      toast.error("Error removing member");
    } finally {
      setRemovingMember(false);
    }
  };

  const handleSaveAi = () => {
    try {
      localStorage.setItem("loop_ai_provider", aiProvider);
      localStorage.setItem("loop_auto_triage", String(autoTriage));
      toast.success("AI preferences saved successfully!");
    } catch {
      toast.error("Failed to save AI preferences");
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
              Settings &amp; Preferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage your profile, workspace tenancy, team members, and AI engine settings.
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
          <span>Team &amp; Roles ({members.length})</span>
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

      {/* Tab 1: Profile Information */}
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
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified by Clerk
                </span>
              </label>
              <input
                type="email"
                disabled
                value={user?.primaryEmailAddress?.emailAddress || ""}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 text-slate-500 text-sm cursor-not-allowed"
              />
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

            {/* Job Title / Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                  Department / Role
                </span>
                <span className="text-[10px] text-slate-400 font-medium">(Optional)</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Product Engineering, CX Operations, Support"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? "Saving..." : "Save Profile"}</span>
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
              <Building2 className="w-5 h-5 text-blue-500" />
              Workspace Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Strict multi-tenant organization context. All customer feedback is scoped to this workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Workspace Name</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {workspace?.name || "Loop Default Workspace"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Slug Identifier</span>
              <p className="text-base font-mono text-slate-600 dark:text-slate-400">
                {workspace?.slug || "default"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your Permission Role</span>
              <div className="pt-0.5">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {currentRole}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tenant Isolation</span>
              <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                <Shield className="w-3.5 h-3.5" /> Enforced at Database Level
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Team Members */}
      {activeTab === "team" && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Team Members &amp; RBAC Roles
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control which teammates can view, triage, or delete customer intelligence data.
            </p>
          </div>

          {/* Invite Form (Admin Only) */}
          {isAdmin && (
            <form onSubmit={handleInviteMember} className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-blue-500" />
                Invite Team Member
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Colleague Name (optional)"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="ANALYST">Analyst (Triage &amp; View)</option>
                    <option value="ADMIN">Admin (Full Control)</option>
                    <option value="VIEWER">Viewer (Read Only)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {inviting ? "Inviting..." : "Add"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Members Table */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {members.map((m) => (
              <div key={m.membershipId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    {(m.name || m.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{m.name || m.email.split("@")[0]}</span>
                      {m.email === user?.primaryEmailAddress?.emailAddress && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md">You</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      <span>{m.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleUpdateRole(m.membershipId, e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="ANALYST">ANALYST</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {m.role}
                    </span>
                  )}

                  {isAdmin && m.email !== user?.primaryEmailAddress?.emailAddress && (
                    <button
                      type="button"
                      onClick={() => setMemberToRemove(m.membershipId)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: AI Engine */}
      {activeTab === "ai" && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Intelligence Engine Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize natural language models and auto-classification behavior for sentiment and themes.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Primary Intelligence Provider
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setAiProvider("groq")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    aiProvider === "groq"
                      ? "bg-purple-500/10 border-purple-500 text-purple-400 ring-2 ring-purple-500/20"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="font-bold text-sm">Groq Cloud AI (Active)</div>
                  <div className="text-[11px] text-slate-400 mt-1">High-speed inference via Llama 3.3 70B &amp; GPT-OSS</div>
                </div>

                <div
                  onClick={() => setAiProvider("offline")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    aiProvider === "offline"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/20"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="font-bold text-sm">Offline Fallback</div>
                  <div className="text-[11px] text-slate-400 mt-1">Built-in heuristic NLP when network is unavailable</div>
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
                type="button"
                onClick={handleSaveAi}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save AI Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Deletion In-App Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Remove Teammate</h3>
                <p className="text-xs text-slate-500">Revoke workspace access</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove this member from the workspace? They will immediately lose access to feedback records and analytics.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removingMember}
                onClick={handleConfirmRemoveMember}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition disabled:opacity-50 cursor-pointer"
              >
                {removingMember ? "Removing..." : "Remove Teammate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
