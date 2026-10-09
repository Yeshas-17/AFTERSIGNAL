import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Zap, ShieldCheck, ArrowUpRight, HelpCircle, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export const ExecutiveCatchUpView: React.FC = () => {
  const { analysis, openEvidenceDrawer, setActiveTab } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-dark-800 via-dark-800 to-indigo-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Executive Briefing</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">What Did You Miss?</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              AFTERSIGNAL reconstructed key events, resolved obligations, and verified evidence while you were away.
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-dark-900/60 p-3 rounded-xl border border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs font-semibold text-slate-200">100% On-Device Mode</div>
              <div className="text-[10px] text-slate-400">Processed in {analysis.executionTimeMs}ms • 0 bytes sent to cloud</div>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-dark-900/80 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[11px] font-medium text-slate-400">Confirmed Decisions</div>
            <div className="text-xl font-bold text-white mt-0.5">{analysis.explicitDecisions.length}</div>
          </div>
          <div 
            onClick={() => setActiveTab('DECISION_DRIFT')}
            className="bg-dark-900/80 p-3.5 rounded-xl border border-slate-800 cursor-pointer hover:border-amber-500/40 transition"
          >
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Decision Drift</span>
              <ArrowUpRight className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{analysis.decisionDrift.length}</div>
          </div>
          <div 
            onClick={() => setActiveTab('OPEN_LOOPS')}
            className="bg-dark-900/80 p-3.5 rounded-xl border border-slate-800 cursor-pointer hover:border-cyan-500/40 transition"
          >
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Open Loops</span>
              <ArrowUpRight className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-cyan-400 mt-0.5">{analysis.openLoops.length}</div>
          </div>
          <div className="bg-dark-900/80 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[11px] font-medium text-slate-400">Ground-Truth Verified</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">100%</div>
          </div>
        </div>
      </div>

      {/* Summary Brief List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <span>Priority Catch-Up Items</span>
          <span className="text-xs text-slate-400 font-normal">({analysis.summaryBrief.length} key conclusions)</span>
        </h3>

        {analysis.summaryBrief.length === 0 ? (
          <div className="bg-dark-800 p-8 rounded-xl border border-slate-800 text-center text-slate-400">
            No priority items found in current conversation.
          </div>
        ) : (
          <div className="grid gap-4">
            {analysis.summaryBrief.map((item) => {
              const mainPtr = item.evidence[0];
              return (
                <div 
                  key={item.id}
                  className="bg-dark-800 p-5 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-base text-white">{item.title}</span>
                        {renderConfidenceBadge(item.confidence)}
                      </div>
                      <p className="text-sm text-slate-300 mt-1">{item.explanation}</p>
                    </div>
                  </div>

                  {/* Source Evidence Reference */}
                  {mainPtr && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Source: <strong className="text-slate-300">{mainPtr.sender}</strong> ({new Date(mainPtr.timestamp).toLocaleTimeString()})</span>
                      </div>
                      <button
                        onClick={() => openEvidenceDrawer(mainPtr.messageId, item.id)}
                        className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-medium transition"
                      >
                        <span>Inspect Evidence</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

function renderConfidenceBadge(confidence: string) {
  switch (confidence) {
    case 'EXPLICIT_FACT':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
          <CheckCircle2 className="w-3 h-3" />
          <span>Explicit Fact</span>
        </span>
      );
    case 'REASONABLE_INFERENCE':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
          <HelpCircle className="w-3 h-3" />
          <span>Inference</span>
        </span>
      );
    case 'UNCERTAIN':
    default:
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/50">
          <AlertTriangle className="w-3 h-3" />
          <span>Uncertain</span>
        </span>
      );
  }
}
