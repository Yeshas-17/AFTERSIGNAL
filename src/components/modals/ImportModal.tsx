import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ChatFormat } from '../../types/chat';
import { X, Upload, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export const ImportModal: React.FC = () => {
  const { isImportModalOpen, setImportModalOpen, importChatContent, importError } = useAppStore();
  const [pastedText, setPastedText] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ChatFormat | 'AUTO'>('AUTO');
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isImportModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = () => {
    const formatParam = selectedFormat === 'AUTO' ? undefined : selectedFormat;
    importChatContent(pastedText, formatParam);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Import Conversation Export</h2>
          </div>
          <button 
            onClick={() => setImportModalOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {importError && (
          <div className="bg-rose-950/80 border border-rose-800/80 p-3.5 rounded-xl text-xs text-rose-200 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Import Error: </span>
              <span>{importError}</span>
            </div>
          </div>
        )}

        {/* Upload File Box */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Option 1: Upload Export File</label>
          <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer transition bg-dark-900/50">
            <input 
              type="file" 
              accept=".json,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden" 
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
              <FileText className="w-8 h-8 text-indigo-400 mx-auto" />
              <div className="text-xs text-slate-300">
                {fileName ? (
                  <span className="text-emerald-400 font-semibold flex items-center justify-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Loaded {fileName}</span>
                  </span>
                ) : (
                  <span>Click to browse or drop Slack JSON, WhatsApp TXT, Discord JSON, or CSV file</span>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Format Selection</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as ChatFormat | 'AUTO')}
            className="w-full bg-dark-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="AUTO">Auto-Detect Format</option>
            <option value="SLACK_JSON">Slack JSON Export</option>
            <option value="WHATSAPP_TXT">WhatsApp TXT Log</option>
            <option value="DISCORD_JSON">Discord JSON Export</option>
            <option value="CSV">CSV File</option>
            <option value="CUSTOM_JSON">Custom JSON Array</option>
          </select>
        </div>

        {/* Direct Text Area Paste */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Option 2: Paste Raw Chat Content</label>
          <textarea
            rows={5}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste Slack JSON, WhatsApp lines, or CSV rows here..."
            className="w-full bg-dark-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-700/80">
          <button
            onClick={() => setImportModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-dark-900 border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleImportSubmit}
            disabled={!pastedText.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Process & Analyze
          </button>
        </div>

      </div>
    </div>
  );
};
