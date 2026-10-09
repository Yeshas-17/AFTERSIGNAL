import React from 'react';
import { useAppStore, ActiveTab } from '../../store/useAppStore';
import { 
  Zap, 
  GitCommit, 
  ListChecks, 
  FileSearch, 
  ShieldCheck, 
  Upload, 
  Sparkles,
  Database,
  FolderOpen
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setImportModalOpen, 
    setSavedModalOpen,
    savedSummaries,
    loadDemoDataset,
    conversation
  } = useAppStore();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'CATCH_UP', label: 'Catch-Up Feed', icon: <Zap className="w-4 h-4" /> },
    { id: 'DECISION_DRIFT', label: 'Decision Drift', icon: <GitCommit className="w-4 h-4" /> },
    { id: 'OPEN_LOOPS', label: 'Open Loops', icon: <ListChecks className="w-4 h-4" /> },
    { id: 'EVIDENCE', label: 'Evidence Drawer', icon: <FileSearch className="w-4 h-4" /> },
    { id: 'PRIVACY', label: 'Privacy Inspector', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
  ];

  return (
    <header className="bg-dark-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Brand & Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wider text-white">AFTERSIGNAL</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                  ProtocolX
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {conversation.messages.length} messages indexed • {conversation.title}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-dark-800/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Saved IndexedDB Chats Button */}
          <button
            onClick={() => setSavedModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-800 border border-slate-700/60 text-xs text-slate-300 hover:bg-slate-800 transition"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Saved ({savedSummaries.length})</span>
          </button>

          {/* Demo Scenario Selector */}
          <div className="relative group">
            <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-800 border border-slate-700/60 text-xs text-slate-300 hover:bg-slate-800 transition">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Demo Datasets</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-dark-800 border border-slate-700 rounded-xl shadow-2xl p-1.5 hidden group-hover:block z-50">
              <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Select Pre-loaded Scenario
              </div>
              <button
                onClick={() => loadDemoDataset()}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-700/50"
              >
                Full Ground Truth Dataset (50 msgs)
              </button>
              <button
                onClick={() => loadDemoDataset('scenario_product_launch')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-700/50"
              >
                Product Launch Sync
              </button>
              <button
                onClick={() => loadDemoDataset('scenario_hackathon_prep')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-700/50"
              >
                Hackathon Team Prep
              </button>
              <button
                onClick={() => loadDemoDataset('scenario_design_revision')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-700/50"
              >
                Design Theme Revisions
              </button>
            </div>
          </div>

          {/* Import Custom File */}
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Chat</span>
          </button>
        </div>

      </div>
    </header>
  );
};
