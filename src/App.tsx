import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Navbar } from './components/layout/Navbar';
import { ExecutiveCatchUpView } from './components/views/ExecutiveCatchUpView';
import { DecisionDriftView } from './components/views/DecisionDriftView';
import { OpenLoopMatrixView } from './components/views/OpenLoopMatrixView';
import { EvidenceDrawer } from './components/views/EvidenceDrawer';
import { PrivacyInspectorModal } from './components/views/PrivacyInspectorModal';
import { ImportModal } from './components/modals/ImportModal';
import { SavedConversationsModal } from './components/modals/SavedConversationsModal';

export default function App() {
  const { activeTab, isSavedModalOpen, setSavedModalOpen, refreshSavedSummaries } = useAppStore();

  // Hydrate saved conversations counter from IndexedDB immediately on app load
  useEffect(() => {
    refreshSavedSummaries();
  }, [refreshSavedSummaries]);

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar />

      {/* Main View Shell */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'CATCH_UP' && <ExecutiveCatchUpView />}
        {activeTab === 'DECISION_DRIFT' && <DecisionDriftView />}
        {activeTab === 'OPEN_LOOPS' && <OpenLoopMatrixView />}
        {activeTab === 'EVIDENCE' && <EvidenceDrawer />}
        {activeTab === 'PRIVACY' && <PrivacyInspectorModal />}
      </main>

      {/* Modals */}
      <ImportModal />
      <SavedConversationsModal 
        isOpen={isSavedModalOpen} 
        onClose={() => setSavedModalOpen(false)} 
      />
    </div>
  );
}
