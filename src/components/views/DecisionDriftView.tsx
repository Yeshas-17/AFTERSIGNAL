import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GitCommit, ArrowRight, ArrowUpRight, AlertOctagon, CheckCircle2, History } from 'lucide-react';

export const DecisionDriftView: React.FC = () => {
  const { analysis, openEvidenceDrawer } = useAppStore();
  const driftRecords = analysis.decisionDrift;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-dark-800 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Decision Drift Timeline</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks how earlier decisions were mutated, overridden, or conflicted in subsequent conversation messages.
            </p>
          </div>
        </div>
      </div>

      {/* Drift Record Cards */}
      {driftRecords.length === 0 ? (
        <div className="bg-dark-800 p-8 rounded-xl border border-slate-800 text-center text-slate-400">
          No decision changes or drift detected in this conversation.
        </div>
      ) : (
        <div className="space-y-4">
          {driftRecords.map((record) => {
            const isContradiction = record.driftType === 'GENUINE_CONTRADICTION';

            return (
              <div 
                key={record.id}
                className="bg-dark-800 p-5 rounded-xl border border-slate-800 hover:border-amber-500/30 transition shadow-lg space-y-4"
              >
                {/* Topic Header & Classification */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">{record.topic}</span>
                    {isContradiction ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-800/50">
                        <AlertOctagon className="w-3 h-3" />
                        <span>Genuine Contradiction</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/50">
                        <History className="w-3 h-3" />
                        <span>Superseded Decision</span>
                      </span>
                    )}
                  </div>
                  {record.resolvedState && (
                    <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/50 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Settled: {record.resolvedState}</span>
                    </div>
                  )}
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Earlier Decision */}
                  <div className="bg-dark-900/90 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Earlier Statement</span>
                      <span>{new Date(record.earlierDecision.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-200 bg-dark-800 p-2.5 rounded-lg border border-slate-700/50 font-mono">
                      "{record.earlierDecision.verbatimQuote}"
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-400">Sender: <strong className="text-slate-300">{record.earlierDecision.sender}</strong></span>
                      <button
                        onClick={() => openEvidenceDrawer(record.earlierDecision.messageId)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
                      >
                        <span>Evidence</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Mutated / Later Decision */}
                  <div className="bg-dark-900/90 p-4 rounded-xl border border-amber-900/40 space-y-2">
                    <div className="flex items-center justify-between text-xs text-amber-300">
                      <span className="font-semibold">Updated Mutation Statement</span>
                      <span>{new Date(record.mutatedDecision.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-amber-100 bg-dark-800 p-2.5 rounded-lg border border-amber-900/50 font-mono">
                      "{record.mutatedDecision.verbatimQuote}"
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-400">Sender: <strong className="text-slate-300">{record.mutatedDecision.sender}</strong></span>
                      <button
                        onClick={() => openEvidenceDrawer(record.mutatedDecision.messageId)}
                        className="text-amber-400 hover:text-amber-300 font-medium flex items-center space-x-1"
                      >
                        <span>Evidence</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic pt-1 border-t border-slate-800/80">
                  Explanation: {record.explanation}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
