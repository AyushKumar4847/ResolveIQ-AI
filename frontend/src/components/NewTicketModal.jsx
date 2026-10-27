import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  Bot,
} from 'lucide-react';
import api from '../api/client';
import { Modal } from './Modal';
import { MarkdownRenderer } from './MarkdownRenderer';

export const NewTicketModal = ({ isOpen, onClose, onCreated }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [autoResolve, setAutoResolve] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Deflection state (instant answer preview)
  const [suggestedSolution, setSuggestedSolution] = useState(null);
  const [deflectionLoading, setDeflectionLoading] = useState(false);
  const [deflected, setDeflected] = useState(false);
  const debounceTimerRef = useRef(null);

  const navigate = useNavigate();

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSubject('');
      setDescription('');
      setSuggestedSolution(null);
      setDeflected(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Debounced auto-suggestion as user writes details
  useEffect(() => {
    if (!description || description.trim().length < 15) {
      setSuggestedSolution(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setDeflectionLoading(true);
        const res = await api.post('/ask/', { question: description });
        if (
          res.data.answer &&
          !res.data.answer.toLowerCase().includes("don't have enough information") &&
          !res.data.answer.toLowerCase().includes('not enough information')
        ) {
          setSuggestedSolution(res.data);
        } else {
          setSuggestedSolution(null);
        }
      } catch (err) {
        // Silently fail deflection preview
        setSuggestedSolution(null);
      } finally {
        setDeflectionLoading(false);
      }
    }, 700);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      // 1. Create ticket
      const res = await api.post('/tickets/', { subject, description });
      const newTicket = res.data;

      // 2. If Auto-Pilot is enabled, automatically resolve immediately!
      if (autoResolve) {
        try {
          await api.post(`/tickets/${newTicket.id}/resolve`);
        } catch (resolveErr) {
          console.warn('Auto-resolve failed, ticket created anyway:', resolveErr);
        }
      }

      if (onCreated) onCreated(newTicket);
      onClose();
      // Navigate straight to the ticket detail
      navigate(`/tickets/${newTicket.id}`);
    } catch (err) {
      console.error('Failed to create ticket:', err);
      alert(err.response?.data?.detail || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Technical Support Ticket" maxWidth="max-w-2xl">
      {deflected ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">Issue Resolved!</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Great! Your question was solved immediately by our knowledge base documentation without needing to wait for a support ticket.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">
              Subject
            </label>
            <input
              type="text"
              required
              minLength={3}
              placeholder="e.g. Postgres DB connection pool exhausted"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                Detailed Description
              </label>
              {deflectionLoading && (
                <span className="text-[11px] font-mono text-brand-400 flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3" /> Searching instant solutions...
                </span>
              )}
            </div>
            <textarea
              required
              rows={4}
              minLength={3}
              placeholder="Describe what happened, error logs, or inquiry details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition resize-none"
            />
          </div>

          {/* AI Instant Deflection Suggestion Box */}
          {suggestedSolution && (
            <div className="bg-brand-950/40 border border-brand-500/40 rounded-xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-brand-400" />
                  <span className="text-xs font-semibold text-brand-300">
                    Instant Knowledge Base Suggestion
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeflected(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 text-[11px] font-medium transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>This Solved My Issue!</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestedSolution(null)}
                    title="Dismiss suggestion"
                    className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-zinc-300 max-h-40 overflow-y-auto pr-1">
                <MarkdownRenderer content={suggestedSolution.answer} />
              </div>
            </div>
          )}

          {/* Auto-Pilot Checkbox */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <input
                id="auto-resolve"
                type="checkbox"
                checked={autoResolve}
                onChange={(e) => setAutoResolve(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 bg-zinc-900 border-zinc-700 focus:ring-brand-500"
              />
              <label htmlFor="auto-resolve" className="text-xs font-medium text-zinc-200 cursor-pointer">
                ⚡ Auto-Pilot: Resolve with AI immediately upon submission
              </label>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Recommended
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{autoResolve ? 'Creating & Resolving...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <span>Submit Ticket</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

