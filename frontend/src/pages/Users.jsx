import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users as UsersIcon, CheckCircle2, Search, User as UserIcon } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';

export const Users = () => {
  const { user, isAdmin } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleUpdatingId, setRoleUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      setUsersList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch user list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if ((targetUser.role || '').toLowerCase() === newRole.toLowerCase()) return;

    if (targetUser.id === user?.id && newRole !== 'admin') {
      const confirmSelf = window.confirm(
        'Warning: You are demoting your own account from Admin! You will lose access to this admin panel. Continue?'
      );
      if (!confirmSelf) return;
    }

    try {
      setRoleUpdatingId(targetUser.id);
      setFeedback('');
      await api.patch(`/auth/users/${targetUser.id}/role`, { role: newRole });
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      setFeedback(`Role for ${targetUser.username} updated to ${newRole.toUpperCase()}!`);
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      console.error('Failed to change role:', err);
      alert(err.response?.data?.detail || 'Failed to update user role');
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-100">Access Restricted</h2>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          User Access & Role Management is only available to System Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">User Management</h1>
              <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                Admin Exclusive
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Assign or revoke User, Agent, and Admin privileges across all registered accounts.
            </p>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition shrink-0 self-start sm:self-auto"
        >
          <UsersIcon className="w-3.5 h-3.5 text-zinc-400" />
          <span>Refresh Users</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search users by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition"
        />
      </div>

      {/* Users List */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">Registered Accounts</h2>
          <span className="text-xs text-zinc-500 font-mono">{filteredUsers.length} Users</span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-zinc-500">
            <span className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <UserIcon className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400 font-medium">No users found</p>
            <p className="text-xs text-zinc-500 mt-1">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {filteredUsers.map((targetUser) => {
              const isSelf = targetUser.id === user?.id;
              const isUpdating = roleUpdatingId === targetUser.id;
              const targetRole = (targetUser.role || 'user').toLowerCase();

              return (
                <div
                  key={targetUser.id}
                  className="p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-800/30 transition group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold text-sm text-zinc-200 shrink-0">
                      {targetUser.username ? targetUser.username[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-100 truncate">
                          {targetUser.username}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                            You
                          </span>
                        )}
                        <Badge status={targetRole} className="text-[10px] py-0" />
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5 font-mono">
                        {targetUser.email} • Joined {new Date(targetUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Role Change Buttons */}
                  <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                    <span className="text-[11px] text-zinc-500 font-medium mr-1 hidden sm:inline">
                      Role:
                    </span>
                    {['user', 'agent', 'admin'].map((roleOption) => {
                      const isCurrentRole = targetRole === roleOption;

                      return (
                        <button
                          key={roleOption}
                          type="button"
                          disabled={isUpdating || isCurrentRole}
                          onClick={() => handleRoleChange(targetUser, roleOption)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize border transition-all ${
                            isCurrentRole
                              ? roleOption === 'admin'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm cursor-default'
                                : roleOption === 'agent'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm cursor-default'
                                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm cursor-default'
                              : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {isUpdating && targetRole === roleOption ? '...' : roleOption}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

