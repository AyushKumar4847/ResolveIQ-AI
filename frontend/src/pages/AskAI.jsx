import React, { useState } from 'react';
import { Bot, Send, Sparkles, Copy, Check } from 'lucide-react';
import api from '../api/client';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { CitationsView } from '../components/CitationsView';

export const AskAI = () => {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const q = question.trim();
    setQuestion('');
    setLoading(true);

    try {
      const res = await api.post('/ask/', { question: q });
      setHistory([
        {
          id: Date.now(),
          question: q,
          answer: res.data.answer,
          evidence: res.data.evidence,
          timestamp: new Date(),
        },
        ...history,
      ]);
    } catch (err) {
      console.error(err);
      setHistory([
        {
          id: Date.now(),
          question: q,
          answer:
            err.response?.data?.detail ||
            'Could not retrieve an answer. Ensure documents are uploaded to the Knowledge Base.',
          evidence: null,
          error: true,
          timestamp: new Date(),
        },
        ...history,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Ask Assistant</h1>
        </div>
        <p className="text-sm text-zinc-400 mt-1">
          Query your indexed knowledge base directly in real-time. Responses cite grounded documentation context.
        </p>
      </div>

      {/* Query Input Box */}
      <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 shadow-xl">
        <form onSubmit={handleAsk} className="space-y-3">
          <textarea
            rows={3}
            required
            minLength={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask any technical question (e.g. 'How does authentication token rotation work in ResolveIQ?')..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-zinc-500">Press submit to run vector similarity & Groq generation</span>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Searching Chunks...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask Assistant</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Query History */}
      <div className="space-y-6">
        {history.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
            <Bot className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h2 className="text-sm font-semibold text-zinc-300">No queries yet</h2>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Type a question above to test the RAG engine against your knowledge base.
            </p>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-6 space-y-4 shadow-xl ${
                item.error
                  ? 'bg-rose-500/5 border-rose-500/20'
                  : 'bg-zinc-900/60 border-zinc-800/80'
              }`}
            >
              {/* Question */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 mt-0.5 text-xs text-zinc-300 font-mono">
                    Q
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{item.question}</h3>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {!item.error && (
                  <button
                    onClick={() => handleCopy(item.id, item.answer)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
                    title="Copy Answer"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Formatted Answer */}
              <div className="p-5 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-zinc-200">
                {item.error ? (
                  <p className="text-rose-400 text-sm">{item.answer}</p>
                ) : (
                  <MarkdownRenderer content={item.answer} />
                )}
              </div>

              {/* Citations & Sources rendered after text generation */}
              {item.evidence && (
                <CitationsView evidence={item.evidence} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
