import { create } from 'zustand';
import { ConversationGraph, ChatFormat } from '../types/chat';
import { GroundedFinding, DecisionDriftRecord, OpenLoopItem, NetworkActivityEvent } from '../types/analysis';
import { analyzeConversation, AnalysisEngineResult } from '../engine/analysis/analysisEngine';
import { parseChatContent } from '../engine/ingestion/chatParser';
import { localAiRunner, LocalAiStatus } from '../engine/ai/localAiRunner';
import { 
  saveConversationToDb, 
  getSavedConversationSummaries, 
  loadConversationFromDb, 
  deleteConversationFromDb, 
  clearAllConversationsFromDb,
  SavedConversationSummary 
} from '../engine/storage/indexedDb';
import benchmarkData from '../test/fixtures/benchmark_dataset.json';

export type ActiveTab = 'CATCH_UP' | 'DECISION_DRIFT' | 'OPEN_LOOPS' | 'EVIDENCE' | 'PRIVACY';

export interface AppState {
  // Active conversation & analysis
  conversation: ConversationGraph;
  analysis: AnalysisEngineResult;
  activeTab: ActiveTab;
  
  // Selected evidence for drawer
  selectedFindingId: string | null;
  selectedMessageId: string | null;
  isEvidenceDrawerOpen: boolean;

  // Local AI & Privacy state
  aiStatus: LocalAiStatus;
  observedNetworkEvents: NetworkActivityEvent[];
  
  // Modals & Storage state
  isImportModalOpen: boolean;
  isSavedModalOpen: boolean;
  savedSummaries: SavedConversationSummary[];
  importError: string | null;
  isAnalyzing: boolean;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  openEvidenceDrawer: (messageId: string, findingId?: string) => void;
  closeEvidenceDrawer: () => void;
  setImportModalOpen: (open: boolean) => void;
  setSavedModalOpen: (open: boolean) => void;
  importChatContent: (rawContent: string, format?: ChatFormat) => Promise<boolean>;
  loadDemoDataset: (scenarioId?: string) => void;
  refreshSavedSummaries: () => Promise<void>;
  loadSavedConversation: (id: string) => Promise<boolean>;
  deleteSavedConversation: (id: string) => Promise<void>;
  clearAllSavedConversations: () => Promise<void>;
  initLocalAi: () => Promise<void>;
  logNetworkEvent: (event: Omit<NetworkActivityEvent, 'id' | 'timestamp'>) => void;
}

// Initial benchmark dataset graph
const initialGraph = parseChatContent(JSON.stringify(benchmarkData.messages), 'CUSTOM_JSON');
const initialAnalysis = analyzeConversation(initialGraph);

export const useAppStore = create<AppState>((set, get) => ({
  conversation: initialGraph,
  analysis: initialAnalysis,
  activeTab: 'CATCH_UP',

  selectedFindingId: null,
  selectedMessageId: null,
  isEvidenceDrawerOpen: false,

  aiStatus: localAiRunner.getStatus(),
  observedNetworkEvents: [
    {
      id: 'net_001',
      timestamp: new Date().toISOString(),
      type: 'LOCAL_INFERENCE',
      url: 'on-device://js-memory',
      method: 'LOCAL_EXEC',
      bytesTransferred: 0,
      description: 'Deterministic Conversation Graph Analysis executed in JS memory.',
      isPrivacyCompliant: true,
    },
  ],

  isImportModalOpen: false,
  isSavedModalOpen: false,
  savedSummaries: [],
  importError: null,
  isAnalyzing: false,

  setActiveTab: (tab) => set({ activeTab: tab }),

  openEvidenceDrawer: (messageId, findingId) => set({
    selectedMessageId: messageId,
    selectedFindingId: findingId || null,
    isEvidenceDrawerOpen: true,
  }),

  closeEvidenceDrawer: () => set({
    isEvidenceDrawerOpen: false,
    selectedMessageId: null,
    selectedFindingId: null,
  }),

  setImportModalOpen: (open) => set({ isImportModalOpen: open, importError: null }),

  setSavedModalOpen: (open) => {
    set({ isSavedModalOpen: open });
    if (open) {
      get().refreshSavedSummaries();
    }
  },

  importChatContent: async (rawContent, format) => {
    if (!rawContent || !rawContent.trim()) {
      set({ importError: 'Cannot parse empty chat content.' });
      return false;
    }

    try {
      set({ isAnalyzing: true, importError: null });
      const graph = parseChatContent(rawContent, format);

      if (graph.messages.length === 0) {
        set({ importError: 'No valid messages could be parsed from the provided input.', isAnalyzing: false });
        return false;
      }

      const analysis = analyzeConversation(graph);

      set({
        conversation: graph,
        analysis,
        isAnalyzing: false,
        isImportModalOpen: false,
        importError: null,
      });

      // Auto-save to IndexedDB asynchronously
      await saveConversationToDb(graph);
      await get().refreshSavedSummaries();

      get().logNetworkEvent({
        type: 'LOCAL_INFERENCE',
        url: 'on-device://analysis-engine',
        method: 'DETERMINISTIC_PARSE',
        bytesTransferred: 0,
        description: `Parsed ${graph.messages.length} messages locally and saved to IndexedDB. 0 network packets sent.`,
        isPrivacyCompliant: true,
      });

      return true;
    } catch (err) {
      set({
        importError: `Import failed: ${err instanceof Error ? err.message : String(err)}`,
        isAnalyzing: false,
      });
      return false;
    }
  },

  loadDemoDataset: (scenarioId) => {
    let filteredMessages = benchmarkData.messages;
    if (scenarioId) {
      filteredMessages = benchmarkData.messages.filter((m) => m.scenarioId === scenarioId);
    }

    const graph = parseChatContent(JSON.stringify(filteredMessages), 'CUSTOM_JSON');
    const analysis = analyzeConversation(graph);

    set({
      conversation: graph,
      analysis,
      importError: null,
    });
  },

  refreshSavedSummaries: async () => {
    const summaries = await getSavedConversationSummaries();
    set({ savedSummaries: summaries });
  },

  loadSavedConversation: async (id) => {
    const graph = await loadConversationFromDb(id);
    if (!graph) return false;

    const analysis = analyzeConversation(graph);
    set({
      conversation: graph,
      analysis,
    });

    get().logNetworkEvent({
      type: 'LOCAL_INFERENCE',
      url: `idb://conversations/${id}`,
      method: 'RESTORE_INDEXEDDB',
      bytesTransferred: 0,
      description: `Restored conversation '${graph.title}' from IndexedDB. 0 network calls.`,
      isPrivacyCompliant: true,
    });

    return true;
  },

  deleteSavedConversation: async (id) => {
    await deleteConversationFromDb(id);
    await get().refreshSavedSummaries();
  },

  clearAllSavedConversations: async () => {
    await clearAllConversationsFromDb();
    await get().refreshSavedSummaries();
  },

  initLocalAi: async () => {
    await localAiRunner.initializeLocalAi();
    set({ aiStatus: localAiRunner.getStatus() });
  },

  logNetworkEvent: (event) => set((state) => ({
    observedNetworkEvents: [
      {
        ...event,
        id: `net_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
      },
      ...state.observedNetworkEvents,
    ].slice(0, 50),
  })),
}));
