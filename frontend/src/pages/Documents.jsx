import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, CheckCircle2, AlertTriangle, FileUp, BookOpen } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';

export const Documents = () => {
  const { isAgent } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents/');
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF documents are supported for RAG ingestion.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`Successfully ingested "${file.name}" with ${res.data.chunk_count || 'multiple'} chunks!`);
      fetchDocuments();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || 'Failed to ingest document. Check backend logs.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Delete document "${filename}" and its vector embeddings?`)) return;

    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('Delete document failed:', err);
      alert('Failed to delete document');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Knowledge Base Documents</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {isAgent
            ? 'Upload technical manuals, runbooks, and product documentation into the vector knowledge base.'
            : 'Explore company-wide technical documentation indexed for ResolveIQ AI assistant queries and ticket deflection.'}
        </p>
      </div>

      {/* Upload Zone (Visible ONLY to Support Agents and Admins) */}
      {isAgent ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
            dragActive
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-300">
              {uploading ? (
                <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileUp className="w-6 h-6 text-brand-400" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-200">
                {uploading ? 'Ingesting, Chunking & Embedding...' : 'Drag and drop your PDF here'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Supports PDF knowledge files up to 10MB</p>
            </div>

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select PDF File</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Verified Technical Reference</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              These knowledge documents are maintained by support engineers. Our AI references these files to answer your questions and tickets.
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">Indexed Knowledge Files</h2>
          <span className="text-xs text-zinc-500 font-mono">{documents.length} Files</span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-zinc-500">
            <span className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400 font-medium">No documents uploaded yet</p>
            <p className="text-xs text-zinc-500 mt-1">
              {isAgent
                ? 'Upload a PDF above to enable AI-powered ticket resolution'
                : 'Technical documentation will appear here once indexed by support engineers.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 px-6 flex items-center justify-between hover:bg-zinc-800/30 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{doc.filename}</p>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      Uploaded {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <Badge status={doc.status} />
                  {isAgent && (
                    <button
                      onClick={() => handleDelete(doc.id, doc.filename)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

