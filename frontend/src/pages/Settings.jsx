import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Trash2,
  KeyRound,
  IdCard,
  ShieldCheck,
  Users,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';

export const Settings = () => {
  const { user, updateProfile, deleteAccount, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Profile fields
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status feedback
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Admin User Role Management state
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleUpdatingId, setRoleUpdatingId] = useState(null);
  const [adminFeedback, setAdminFeedback] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Load all users if current user is an Admin
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api.get('/auth/users');
      setUsersList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch user list:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if ((targetUser.role || '').toLowerCase() === newRole.toLowerCase()) return;
    if (targetUser.id === user?.id && newRole !== 'admin') {
      const confirmSelf = window.confirm(
        'Warning: You are demoting yourself from Admin! You will lose access to this admin panel. Continue?'
      );
      if (!confirmSelf) return;
    }

    try {
      setRoleUpdatingId(targetUser.id);
      setAdminFeedback('');
      await api.patch(`/auth/users/${targetUser.id}/role`, { role: newRole });
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      setAdminFeedback(`Role for ${targetUser.username} updated to ${newRole.toUpperCase()}!`);
      setTimeout(() => setAdminFeedback(''), 4000);
    } catch (err) {
      console.error('Failed to change role:', err);
      alert(err.response?.data?.detail || 'Failed to update user role');
    } finally {
      setRoleUpdatingId(null);
    }
  };

  // Handle Profile Update (Username, Email)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const payload = {};
      if (username !== user?.username) payload.username = username;
      if (email !== user?.email) payload.email = email;

      if (Object.keys(payload).length === 0) {
        setProfileSuccess('No changes to save.');
        setProfileLoading(false);
        return;
      }

      await updateProfile(payload);
      setProfileSuccess('Personal information updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setProfileError(err.response?.data?.detail || 'Failed to update personal details.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      setPasswordLoading(false);
      return;
    }

    try {
      await updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setPasswordError(
        err.response?.data?.detail || 'Failed to change password. Ensure your current password is correct.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'Are you sure you want to delete your account? This action cannot be undone. Type "DELETE" to confirm:'
    );

    if (confirmation !== 'DELETE') return;

    try {
      await deleteAccount();
      navigate('/login');
    } catch (err) {
      console.error('Account deletion error:', err);
      alert('Failed to delete account. Please try again.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Personal Account & Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your personal details, credentials, and account settings.
        </p>
      </div>

      {/* Account Overview Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-brand-500/20">
            {user?.username ? user.username[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold text-zinc-100">{user?.username}</h2>
              <Badge status={user?.role || 'user'} />
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{user?.email}</p>
            <p className="text-[11px] font-mono text-zinc-500 mt-1">
              Account ID: {user?.id}
            </p>
          </div>
        </div>

        <div className="text-right self-start sm:self-center">
          <span className="text-[11px] font-mono text-zinc-500 block">Member Since</span>
          <span className="text-xs font-medium text-zinc-300">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Update Personal Information */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-brand-400">
              <IdCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Personal Information</h3>
              <p className="text-xs text-zinc-400">Update your name and primary email</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}
          {profileError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">
                Full Name / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
            >
              {profileLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Personal Details</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Section 2: Security & Password */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-purple-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Security & Credentials</h3>
              <p className="text-xs text-zinc-400">Update your account login password</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}
          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">
                New Password (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs border border-zinc-700 transition disabled:opacity-50"
            >
              {passwordLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Admin Panel: User Role Management (Rendered ONLY for Admins) */}
      {isAdmin && (
        <div className="bg-zinc-900/60 border border-brand-500/30 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <span>User Access & Role Management</span>
                  <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    Admin Exclusive
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Assign or revoke User, Agent, and Admin privileges across all registered accounts.
                </p>
              </div>
            </div>

            <button
              onClick={fetchUsers}
              disabled={usersLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition shrink-0 self-start sm:self-auto"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Refresh Users</span>
            </button>
          </div>

          {adminFeedback && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{adminFeedback}</span>
            </div>
          )}

          {usersLoading ? (
            <div className="py-12 flex justify-center text-zinc-500">
              <span className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/80 bg-zinc-950/50">
              {usersList.map((targetUser) => {
                const isSelf = targetUser.id === user?.id;
                const isUpdating = roleUpdatingId === targetUser.id;

                return (
                  <div
                    key={targetUser.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-900/50 transition"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300 shrink-0">
                        {targetUser.username ? targetUser.username[0].toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-200 truncate">
                            {targetUser.username}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                              You
                            </span>
                          )}
                          <Badge status={targetUser.role || 'user'} className="text-[10px] py-0" />
                        </div>
                        <p className="text-xs text-zinc-500 truncate mt-0.5 font-mono">
                          {targetUser.email} • Joined {new Date(targetUser.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Role Selection Buttons */}
                    <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                      <span className="text-[11px] text-zinc-500 font-medium mr-1 hidden sm:inline">
                        Change Role:
                      </span>
                      {['user', 'agent', 'admin'].map((roleOption) => {
                        const isCurrentRole = targetUser.role === roleOption;

                        return (
                          <button
                            key={roleOption}
                            type="button"
                            disabled={isUpdating || isCurrentRole}
                            onClick={() => handleRoleChange(targetUser, roleOption)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize border transition-all ${
                              isCurrentRole
                                ? roleOption === 'admin'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm cursor-default'
                                  : roleOption === 'agent'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm cursor-default'
                                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm cursor-default'
                                : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            {isUpdating && targetUser.role === roleOption ? '...' : roleOption}
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
      )}

      {/* Danger Zone: Account Deletion */}
      <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Danger Zone: Delete Account
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg">
            Permanently deletes your user credentials and sessions. Your tickets will be retained with orphaned ownership for auditing.
          </p>
        </div>

        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold transition shrink-0"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};

