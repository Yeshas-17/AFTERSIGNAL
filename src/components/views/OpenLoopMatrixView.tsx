import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { OpenLoopStatus } from '../../types/analysis';
import { ListChecks, HelpCircle, Clock, UserCheck, CheckCircle2, ArrowUpRight, Filter } from 'lucide-react';

export const OpenLoopMatrixView: React.FC = () => {
  const { analysis, openEvidenceDrawer } = useAppStore();
  const [filter, setFilter] = useState<'ALL' | OpenLoopStatus>('ALL');

  const allLoops = analysis.openLoops;

  const filteredLoops = allLoops.filter((loop) => {
    if (filter === 'ALL') return true;
    return loop.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-dark-800 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Open Loop Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks unanswered questions, pending obligations, assignees, and extracted deadlines.
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-1 bg-dark-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filter === 'ALL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({allLoops.length})
          </button>
          <button
            onClick={() => setFilter('UNANSWERED_QUESTION')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filter === 'UNANSWERED_QUESTION' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Unanswered ({allLoops.filter((l) => l.status === 'UNANSWERED_QUESTION').length})
          </button>
          <button
            onClick={() => setFilter('PENDING_ACTION_ITEM')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filter === 'PENDING_ACTION_ITEM' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Actions ({allLoops.filter((l) => l.status === 'PENDING_ACTION_ITEM').length})
          </button>
        </div>
      </div>

      {/* Loop Cards */}
      {filteredLoops.length === 0 ? (
        <div className="bg-dark-800 p-8 rounded-xl border border-slate-800 text-center text-slate-400">
          No open loop items match the selected filter.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLoops.map((loop) => {
            const mainPtr = loop.evidence[0];

            return (
              <div 
                key={loop.id}
                className="bg-dark-800 p-5 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition shadow-lg space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {renderStatusBadge(loop.status)}
                      {loop.assignee && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-700">
                          <UserCheck className="w-3 h-3 text-cyan-400" />
                          <span>Assignee: {loop.assignee}</span>
                        </span>
                      )}
                      {loop.deadlineText && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800/50">
                          <Clock className="w-3 h-3 text-purple-400" />
                          <span>Deadline: {loop.deadlineText}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white pt-1">{loop.title}</p>
                  </div>

                  {mainPtr && (
                    <button
                      onClick={() => openEvidenceDrawer(mainPtr.messageId, loop.id)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 whitespace-nowrap bg-dark-900 px-3 py-1.5 rounded-lg border border-slate-700/60"
                    >
                      <span>Evidence</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {mainPtr && (
                  <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                    <span>Source message from <strong className="text-slate-300">{mainPtr.sender}</strong></span>
                    <span>{new Date(mainPtr.timestamp).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function renderStatusBadge(status: OpenLoopStatus) {
  switch (status) {
    case 'UNANSWERED_QUESTION':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-800/50">
          <HelpCircle className="w-3 h-3" />
          <span>Unanswered Question</span>
        </span>
      );
    case 'PENDING_ACTION_ITEM':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/50">
          <Clock className="w-3 h-3" />
          <span>Pending Action</span>
        </span>
      );
    case 'RESOLVED':
    default:
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
          <CheckCircle2 className="w-3 h-3" />
          <span>Resolved</span>
        </span>
      );
  }
}
