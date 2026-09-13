'use client';

import { useState, useEffect, useCallback } from 'react';

interface Member {
  membershipId: string;
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
}

export default function WorkspaceMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [workspace, setWorkspace] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER'>('ADMIN');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER'>('ANALYST');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/workspace/members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.members);
        setWorkspace(data.workspace);
        setCurrentRole(data.currentRole);
      } else {
        setError(data.error || 'Failed to load team members');
      }
    } catch (err) {
      console.error(err);
      setError('Network error while loading team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/workspace/members');
        const data = await res.json();
        if (!ignore && data.success) {
          setMembers(data.members);
          setWorkspace(data.workspace);
          setCurrentRole(data.currentRole);
        } else if (!ignore) {
          setError(data.error || 'Failed to load team members');
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setError('Network error while loading team members');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRoleChange = async (membershipId: string, newRole: 'ADMIN' | 'ANALYST' | 'VIEWER') => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/workspace/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Role updated to ${newRole}`);
        setMembers((prev) =>
          prev.map((m) => (m.membershipId === membershipId ? { ...m, role: newRole } : m))
        );
      } else {
        setError(data.error || 'Permission Denied: 403 Forbidden');
      }
    } catch (err) {
      console.error(err);
      setError('Error communicating with server');
    }
  };

  const handleRemoveMember = async (membershipId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from this workspace?`)) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/workspace/members?membershipId=${membershipId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Removed ${email} from workspace`);
        setMembers((prev) => prev.filter((m) => m.membershipId !== membershipId));
      } else {
        setError(data.error || 'Permission Denied: 403 Forbidden');
      }
    } catch (err) {
      console.error(err);
      setError('Error communicating with server');
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/workspace/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Successfully invited ${inviteEmail} as ${inviteRole}`);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteName('');
        await fetchMembers();
      } else {
        setError(data.error || 'Failed to invite teammate');
      }
    } catch (err) {
      console.error(err);
      setError('Network error occurred');
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadge = (role: 'ADMIN' | 'ANALYST' | 'VIEWER') => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20';
      case 'ANALYST':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20';
      case 'VIEWER':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';
    }
  };

  return (
    <div className="bg-[#F8F9FA] dark:bg-[#0b0f19] min-h-[calc(100vh-4rem)] transition-colors py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1F36] dark:text-white tracking-tight">
                Team &amp; Permissions
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20">
                {workspace?.name || 'Workspace'}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
              Manage who has access to this workspace and what they can do (Admin, Analyst, Viewer).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentRole === 'ADMIN' ? (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#2D68FF] hover:bg-blue-600 rounded-xl shadow-md shadow-[#2D68FF]/20 transition-all flex items-center gap-2"
              >
                <span>+ Invite Teammate</span>
              </button>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 shadow-xs">
                <span>Read-Only: You are signed in as <strong className="text-slate-900 dark:text-slate-200">{currentRole}</strong></span>
              </div>
            )}
          </div>
        </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-800 dark:hover:text-white text-sm">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-800 dark:hover:text-white text-sm">✕</button>
        </div>
      )}

      {/* Roles and permissions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-purple-200 dark:border-purple-500/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Admin</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20">Full Access</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Can invite and remove teammates, assign roles, delete feedback, and configure workspace settings.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-blue-200 dark:border-blue-500/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Analyst</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20">Read &amp; Write</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Can add feedback, upload CSV files, change status (New, Reviewed, Actioned), and run AI analysis.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-amber-200 dark:border-amber-500/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Viewer</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">Read-Only</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Can browse and search feedback, view charts, and download reports. Editing actions are restricted.
          </p>
        </div>
      </div>

      {/* Members list */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/90 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Workspace Members ({members.length})
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Tenant: <strong className="text-slate-800 dark:text-slate-200 font-mono">{workspace?.slug}</strong></span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading team roster...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Member</th>
                  <th className="py-3.5 px-4 sm:px-6">Email</th>
                  <th className="py-3.5 px-4 sm:px-6">Assigned Role</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {members.map((member) => (
                  <tr key={member.membershipId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900 dark:text-white">
                      {member.name}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-600 dark:text-slate-300 font-mono">
                      {member.email}
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      {currentRole === 'ADMIN' ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(
                              member.membershipId,
                              e.target.value as 'ADMIN' | 'ANALYST' | 'VIEWER'
                            )
                          }
                          className="px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="ANALYST">ANALYST</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-md border text-xs font-semibold ${getRoleBadge(member.role)}`}>
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      {currentRole === 'ADMIN' ? (
                        <button
                          onClick={() => handleRemoveMember(member.membershipId, member.email)}
                          className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all font-semibold"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Invite Teammate to {workspace?.name}</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@acme-corp.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Sarah Connor"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Select Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'ANALYST' | 'VIEWER')}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ANALYST">ANALYST (Ingest & Triage Feedback)</option>
                  <option value="VIEWER">VIEWER (Read-Only Access)</option>
                  <option value="ADMIN">ADMIN (Full Administrative Control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-all"
                >
                  {inviting ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
