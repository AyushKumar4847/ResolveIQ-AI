import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Bot,
  Trash2,
  Cpu,
  Copy,
  Check,
  CheckCircle2,
  Mail,
  User as UserIcon,
} from "lucide-react";
import api from "../api/client";
import { Badge } from "../components/Badge";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { CitationsView } from "../components/CitationsView";

export const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [resolutions, setResolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTicketAndResolutions();
  }, [id]);

  const fetchTicketAndResolutions = async () => {
    try {
      setLoading(true);
      setError("");
      const [ticketRes, resolutionsRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/resolutions`),
      ]);
      setTicket(ticketRes.data);
      setResolutions(resolutionsRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Ticket not found or you do not have permission to view it.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveWithAI = async () => {
    setResolving(true);
    setError("");
    try {
      const res = await api.post(`/tickets/${id}/resolve`);
      setResolutions([res.data, ...resolutions]);
      // Update ticket status to resolved
      setTicket((prev) => ({ ...prev, status: "resolved" }));
    } catch (err) {
      console.error("Resolution failed:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to generate AI resolution. Ensure relevant knowledge base documents are uploaded.",
      );
    } finally {
      setResolving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === ticket?.status) return;

    setStatusUpdating(true);
    try {
      const res = await api.patch(`/tickets/${id}/status`, {
        status: newStatus,
      });
      setTicket(res.data);
    } catch (err) {
      console.error("Status update failed:", err);
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await api.delete(`/tickets/${id}`);
      navigate("/tickets");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete ticket");
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCustomerEmail = () => {
    if (!latestResolution) return;
    const customerName = ticket?.owner?.username || "there";
    const emailDraft = `Hi ${customerName},

Thank you for reaching out regarding: "${ticket?.subject}".

Here is the recommended resolution based on our technical documentation:

${latestResolution.answer}

If you have any further questions or require additional guidance, please reply to this message and our team will be glad to assist you.

Best regards,
ResolveIQ Technical Support`;

    navigator.clipboard.writeText(emailDraft);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center text-zinc-500">
        <span className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <p className="text-rose-400 font-medium">{error}</p>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-2 text-sm text-brand-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to tickets
        </Link>
      </div>
    );
  }

  const latestResolution = resolutions[0];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Back button & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tickets</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Status Buttons */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            {["open", "resolved", "closed"].map((st) => (
              <button
                key={st}
                type="button"
                disabled={statusUpdating}
                onClick={() => handleStatusChange(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize border transition-colors outline-none ${
                  ticket?.status === st
                    ? "bg-zinc-800 text-zinc-100 border-zinc-700 shadow"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={handleDelete}
            className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded-xl transition border border-transparent hover:border-zinc-800"
            title="Delete Ticket"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ticket Header & Description Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <Badge status={ticket?.status} />
              <span className="text-xs font-mono text-zinc-500">
                Created: {new Date(ticket?.created_at).toLocaleString()}
              </span>
              {ticket?.owner && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-300">
                  <UserIcon className="w-3.5 h-3.5 text-brand-400" />
                  <span className="font-medium text-zinc-200">{ticket.owner.username}</span>
                  <span className="text-zinc-500 font-mono text-[11px]">&lt;{ticket.owner.email}&gt;</span>
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              {ticket?.subject}
            </h1>
          </div>

          {/* AI Trigger Button */}
          <button
            onClick={handleResolveWithAI}
            disabled={resolving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-medium text-sm shadow-xl shadow-brand-500/25 transition disabled:opacity-50 shrink-0"
          >
            {resolving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>RAG Retrieval & Groq...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Resolve with AI</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800/80">
          <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Description
          </h2>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {ticket?.description}
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* AI Resolution Section */}
      {latestResolution ? (
        <div className="bg-gradient-to-b from-brand-950/30 to-zinc-900/50 border border-brand-500/30 rounded-2xl p-7 shadow-2xl relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  AI Solution Generated
                  <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Grounded Answer
                  </span>
                </h2>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5 font-mono">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-zinc-500" />{" "}
                    {latestResolution.model_name || "Groq OSS LLM"}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(latestResolution.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCustomerEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
                title="Format and copy as email to customer"
              >
                {copiedEmail ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-brand-400" />
                )}
                <span>
                  {copiedEmail ? "Email Copied!" : "Copy Customer Email"}
                </span>
              </button>

              <button
                onClick={() => handleCopy(latestResolution.answer)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? "Copied" : "Copy Solution"}</span>
              </button>
            </div>
          </div>

          {/* Formatted Markdown Solution Body */}
          <div className="p-5 bg-zinc-950/80 border border-zinc-800/90 rounded-xl text-zinc-200">
            <MarkdownRenderer content={latestResolution.answer} />
          </div>

          {/* Citations & Sources rendered after text generation */}
          {latestResolution.evidence && (
            <CitationsView evidence={latestResolution.evidence} />
          )}
        </div>
      ) : (
        <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
          <Bot className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-zinc-300">
            No AI resolution generated yet
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Click the "Resolve with AI" button above to query your indexed PDF
            knowledge base via pgvector and Groq.
          </p>
        </div>
      )}
    </div>
  );
};
