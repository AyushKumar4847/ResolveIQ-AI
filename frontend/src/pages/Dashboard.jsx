import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  Upload,
  ArrowRight,
  Bot,
  Sparkles,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { NewTicketModal } from '../components/NewTicketModal';

export const Dashboard = () => {
  const { user, isAgent, isAdmin } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Ticket modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, docsRes] = await Promise.allSettled([
        api.get('/tickets/'),
        api.get('/documents/'),
      ]);

      if (ticketsRes.status === 'fulfilled') {
        setTickets(ticketsRes.value.data || []);
      }
      if (docsRes.status === 'fulfilled') {
        setDocuments(docsRes.value.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openTickets = tickets.filter((t) => t.status === 'open');
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Welcome back, {user?.username || 'User'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium">
              {isAdmin ? 'Admin Console' : isAgent ? 'Agent Console' : 'Member Workspace'}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            ResolveIQ automated knowledge and ticket resolution overview.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {isAgent && (
            <Link
              to="/documents"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-sm font-medium transition"
            >
              <Upload className="w-4 h-4 text-zinc-400" />
              <span>Upload PDF</span>
            </Link>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-medium shadow-lg shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tickets"
          value={tickets.length}
          icon={Ticket}
          description={isAgent ? 'All system tickets' : 'Your tickets'}
        />
        <StatCard
          title="Open Actionable"
          value={openTickets.length}
          icon={Clock}
          description="Waiting for resolution"
        />
        <StatCard
          title="Resolved"
          value={resolvedTickets.length}
          icon={CheckCircle2}
          description="AI & Agent resolutions"
        />
        <StatCard
          title="Knowledge Documents"
          value={documents.length}
          icon={FileText}
          description="Indexed PDF sources"
        />
      </div>

      {/* Interactive AI Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-950/70 via-zinc-900 to-zinc-900 border border-brand-500/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              Autonomous Ticket Resolver Active
            </h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              Knowledge vectors are stored in PostgreSQL using pgvector with Groq LLM inference.
              Tickets can be resolved instantly by scanning indexed documentation.
            </p>
          </div>
        </div>
        <Link
          to="/ask"
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium shadow-md transition"
        >
          <Bot className="w-4 h-4" />
          <span>Test AI Assistant</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Two Column Layout: Recent Tickets & Knowledge Base */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets Table (2 cols) */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Recent Support Tickets</h2>
              <p className="text-xs text-zinc-400">Tickets requiring attention or resolved</p>
            </div>
            <Link
              to="/tickets"
              className="text-xs text-brand-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center text-zinc-500 text-sm">
              <span className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
              <Ticket className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400 font-medium">No tickets created yet</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-3 text-xs text-brand-400 hover:underline"
              >
                Create your first ticket
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60 overflow-hidden">
              {tickets.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  to={`/tickets/${t.id}`}
                  className="py-3.5 flex items-center justify-between hover:bg-zinc-800/30 px-3 -mx-3 rounded-xl transition group"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-brand-400 transition truncate">
                      {t.subject}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-zinc-500 truncate">{t.description}</p>
                      {t.owner && (
                        <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                          • {t.owner.username}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge status={t.status} />
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Knowledge Base Sources (1 col) */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">Knowledge Sources</h2>
                <p className="text-xs text-zinc-400">PDFs feeding vector RAG</p>
              </div>
              <Link
                to="/documents"
                className="text-xs text-brand-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>{isAgent ? 'Upload' : 'View all'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center text-zinc-500 text-sm">
                <span className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
                <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">No documents indexed</p>
                {isAgent && (
                  <Link
                    to="/documents"
                    className="mt-2 inline-block text-xs text-brand-400 hover:underline"
                  >
                    Upload knowledge PDF
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {documents.slice(0, 4).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                      <span className="text-xs font-medium text-zinc-200 truncate">
                        {doc.filename}
                      </span>
                    </div>
                    <Badge status={doc.status} className="text-[10px] py-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Embeddings: MiniLM-L6 (384d)</span>
            <span className="font-mono text-emerald-400">pgvector ready</span>
          </div>
        </div>
      </div>

      {/* AI Auto-Pilot & Deflection Ticket Creation Modal */}
      <NewTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(ticket) => setTickets([ticket, ...tickets])}
      />
    </div>
  );
};

