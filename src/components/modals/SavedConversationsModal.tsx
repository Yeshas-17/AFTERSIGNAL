import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { SavedConversationSummary } from '../../engine/storage/indexedDb';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Database, FolderOpen, Trash2, X, Clock, MessageSquare, AlertTriangle } from 'lucide-react';

interface SavedConversationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavedConversationsModal: React.FC<SavedConversationsModalProps> = ({ isOpen, onClose }) => {
  const { 
    savedSummaries, 
    loadSavedConversation, 
    deleteSavedConversation, 
    clearAllSavedConversations 
  } = useAppStore();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Saved Local Conversations</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear All Header Button */}
        {savedSummaries.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={() => setIsClearAllConfirmOpen(true)}
              className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Saved Chats</span>
            </button>
          </div>
        )}

        {/* Summaries List */}
        {savedSummaries.length === 0 ? (
          <div className="bg-dark-900/60 p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-xs space-y-1">
            <Database className="w-6 h-6 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No conversations stored in IndexedDB.</p>
            <p>Imported chat exports will be automatically saved locally for instant offline restore.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {savedSummaries.map((item) => (
              <div
                key={item.id}
                className="bg-dark-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs space-x-3 hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-white flex items-center space-x-2">
                    <span>{item.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-800 text-indigo-300 border border-indigo-900/50">
                      {item.format}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3 text-indigo-400" />
                      <span>{item.messageCount} messages</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Saved {new Date(item.importedAt).toLocaleTimeString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      loadSavedConversation(item.id);
                      onClose();
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(item.id)}
                    className="p-1.5 rounded-lg bg-dark-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Single Item Deletion Confirmation */}
        <ConfirmDeleteModal
          isOpen={deleteTargetId !== null}
          title="Delete Saved Conversation"
          description="Are you sure you want to delete this saved conversation from IndexedDB? This action cannot be undone."
          confirmLabel="Delete Conversation"
          onConfirm={() => {
            if (deleteTargetId) {
              deleteSavedConversation(deleteTargetId);
              setDeleteTargetId(null);
            }
          }}
          onCancel={() => setDeleteTargetId(null)}
        />

        {/* Clear All Confirmation */}
        <ConfirmDeleteModal
          isOpen={isClearAllConfirmOpen}
          title="Clear All Saved Conversations"
          description="Are you sure you want to permanently clear all saved chat conversations from browser IndexedDB storage?"
          confirmLabel="Clear All Storage"
          onConfirm={() => {
            clearAllSavedConversations();
            setIsClearAllConfirmOpen(false);
          }}
          onCancel={() => setIsClearAllConfirmOpen(false)}
        />

      </div>
    </div>
  );
};
