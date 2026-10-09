import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { FileSearch, X, CheckCircle2, AlertTriangle, User, Clock, MessageSquare, Copy, Check } from 'lucide-react';

export const EvidenceDrawer: React.FC = () => {
  const { 
    conversation, 
    selectedMessageId, 
    isEvidenceDrawerOpen, 
    closeEvidenceDrawer,
    openEvidenceDrawer
  } = useAppStore();

  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const selectedMsg = selectedMessageId ? conversation.messageMap.get(selectedMessageId) : null;
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected message into view when selectedMessageId changes
  useEffect(() => {
    if (selectedMessageId) {
      const el = document.getElementById(`msg_${selectedMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedMessageId]);

  const handleCopyQuote = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-dark-800 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileSearch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Evidence Explorer & Transcript</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect verbatim original message quotes, sender metadata, and surrounding thread context.
            </p>
          </div>
        </div>

        {isEvidenceDrawerOpen && (
          <button
            onClick={closeEvidenceDrawer}
            className="p-1.5 rounded-lg bg-dark-900 border border-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Inspected Evidence Highlight Box */}
      {selectedMsg ? (
        <div className="bg-indigo-950/40 p-5 rounded-2xl border border-indigo-800/60 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-indigo-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ground-Truth Verified Evidence Reference</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopyQuote(selectedMsg.content, selectedMsg.id)}
                className="flex items-center space-x-1 text-[11px] text-indigo-300 hover:text-white px-2.5 py-1 rounded bg-dark-900 border border-slate-700 transition"
              >
                {copiedId === selectedMsg.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-indigo-400" />
                    <span>Copy Quote</span>
                  </>
                )}
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-dark-900 border border-slate-800">
                ID: {selectedMsg.id}
              </span>
            </div>
          </div>

          <div className="bg-dark-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-1.5 text-slate-200">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold">{selectedMsg.senderName}</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(selectedMsg.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-sm font-mono text-indigo-100 bg-dark-800 p-3 rounded-lg border border-indigo-900/50">
              "{selectedMsg.content}"
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-dark-800/50 p-4 rounded-xl border border-slate-800/60 text-xs text-slate-400 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Click on any message below or an insight link to highlight its exact source context.</span>
        </div>
      )}

      {/* Full Conversation Thread Transcript */}
      <div className="bg-dark-800 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-semibold text-white flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Full Transcript ({conversation.messages.length} Messages)</span>
          </h3>
          <span className="text-xs text-slate-400">Format: {conversation.format}</span>
        </div>

        <div ref={transcriptContainerRef} className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {conversation.messages.map((msg) => {
            const isSelected = selectedMessageId === msg.id;

            return (
              <div
                key={msg.id}
                id={`msg_${msg.id}`}
                onClick={() => openEvidenceDrawer(msg.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500'
                    : 'bg-dark-900/70 border-slate-800 hover:border-slate-700 hover:bg-dark-900'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-200">{msg.senderName}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-slate-500">{msg.id}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{msg.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
