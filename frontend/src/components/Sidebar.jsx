import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  FileText,
  Bot,
  LogOut,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user, logout, isAgent, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/tickets', label: 'Tickets', icon: Ticket },
    { to: '/documents', label: 'Knowledge Base', icon: FileText },
    { to: '/ask', label: 'Ask Assistant', icon: Bot, badge: 'AI' },
    ...(isAdmin ? [{ to: '/users', label: 'User Management', icon: Users, badge: 'Admin' }] : []),
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-zinc-100 tracking-tight text-base leading-none">ResolveIQ</h1>
          <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">AI Support Ops</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors outline-none ${
                  isActive
                    ? 'bg-zinc-800/80 text-zinc-100 border-zinc-700/60'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-zinc-400" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-md border border-brand-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-zinc-800/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
          <Link
            to="/settings"
            title="Edit Profile"
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 font-semibold text-xs border border-zinc-700/50">
              {user?.username ? user.username[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-200 truncate">{user?.username || 'User'}</p>
              <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                {isAdmin ? (
                  <span className="flex items-center gap-1 text-rose-400 font-medium">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                ) : isAgent ? (
                  <span className="flex items-center gap-1 text-purple-400 font-medium">
                    <ShieldCheck className="w-3 h-3" /> Agent
                  </span>
                ) : (
                  <span>Member</span>
                )}
              </div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
