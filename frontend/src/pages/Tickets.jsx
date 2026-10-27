import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket as TicketIcon, Plus, Search, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { NewTicketModal } from '../components/NewTicketModal';

export const Tickets = () => {
  const { isAgent } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets/');
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.owner?.username && t.owner.username.toLowerCase().includes(search.toLowerCase())) ||
      (t.owner?.email && t.owner.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Support Tickets</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isAgent
              ? 'Agent Mode: Viewing and managing all incoming tickets across all users.'
              : 'Track, view, and manage your technical support requests.'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-medium shadow-lg shadow-brand-500/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search tickets by subject, details, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'open', 'resolved', 'closed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize border transition-colors outline-none shrink-0 ${
                statusFilter === filter
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center text-zinc-500">
            <span className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-20 px-4">
            <TicketIcon className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No tickets found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Get started by creating your first technical support ticket.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/70">
            {filteredTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-800/30 transition group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-zinc-100 group-hover:text-brand-400 transition truncate">
                      {ticket.subject}
                    </h2>
                    <Badge status={ticket.status} />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 max-w-3xl leading-relaxed">
                    {ticket.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-500 font-mono flex-wrap">
                    <span>ID: {ticket.id.slice(0, 8)}</span>
                    <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                    {ticket.owner && (
                      <span className="text-zinc-400">
                        By: <strong className="text-zinc-300 font-sans">{ticket.owner.username}</strong> ({ticket.owner.email})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <span className="text-xs text-zinc-400 group-hover:text-brand-400 font-medium flex items-center gap-1 transition">
                    View & Resolve
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Ticket Modal with Auto-Pilot & Deflection */}
      <NewTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(ticket) => setTickets([ticket, ...tickets])}
      />
    </div>
  );
};

