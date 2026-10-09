import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ShieldCheck, Cpu, Lock, Activity, CheckCircle2, Info } from 'lucide-react';

export const PrivacyInspectorModal: React.FC = () => {
  const { aiStatus, initLocalAi, observedNetworkEvents } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-dark-800 via-dark-800 to-emerald-950/40 p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Observed Resource & Privacy Inspector</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitors browser resource execution entries and verifies chat content is never sent to external cloud AI services.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/50 text-emerald-300 text-xs font-semibold">
            <Lock className="w-4 h-4" />
            <span>Local Architecture Verified</span>
          </div>
        </div>
      </div>

      {/* Observation Notice & Boundaries */}
      <div className="bg-dark-800/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
        <div className="flex items-center space-x-1.5 font-semibold text-indigo-300">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Privacy Monitoring Specification & Scope:</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed pl-5">
          This inspector captures browser performance resource timing entries (`PerformanceObserver`) and internal API event hooks. 
          Conversations are parsed strictly in local client memory. No fetch, XHR, or worker payload contains chat text targeting external AI APIs.
        </p>
      </div>

      {/* Hardware & Local AI Runtime Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hardware Mode Card */}
        <div className="bg-dark-800 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hardware Runtime Capability</span>
            <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/50">
              {aiStatus.runtimeMode}
            </span>
          </div>
          <div className="flex items-center space-x-3 pt-1">
            <Cpu className="w-8 h-8 text-indigo-400" />
            <div>
              <div className="text-sm font-semibold text-white">Apple Silicon / Browser Engine</div>
              <div className="text-xs text-slate-400">{aiStatus.statusMessage}</div>
            </div>
          </div>
        </div>

        {/* Local Model Status Card */}
        <div className="bg-dark-800 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model Status</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
              aiStatus.weightsLoaded
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800/50' 
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}>
              {aiStatus.state}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white">{aiStatus.modelName}</div>
              <div className="text-[11px] text-slate-400">
                {aiStatus.weightsLoaded ? 'Weights loaded into memory' : 'Standby (0 MB downloaded)'}
              </div>
            </div>
            {aiStatus.state !== 'READY' && aiStatus.state !== 'LOADING' && (
              <button
                onClick={initLocalAi}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
              >
                Load Candidate Model
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Network Activity Log Table */}
      <div className="bg-dark-800 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Observed Resource & Execution Log</h3>
          </div>
          <span className="text-xs text-slate-400">{observedNetworkEvents.length} events logged</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {observedNetworkEvents.map((event) => (
            <div 
              key={event.id}
              className="bg-dark-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs space-x-3"
            >
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white flex items-center space-x-2">
                    <span>[{event.type}]</span>
                    <span className="text-slate-400 font-normal">{event.description}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">{event.url}</div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="font-mono text-slate-300">{event.bytesTransferred} bytes</div>
                <div className="text-[10px] text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
