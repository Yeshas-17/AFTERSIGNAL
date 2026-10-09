import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ConversationGraph, ChatMessage, ChatFormat, ChatSender, ChatThread } from '../../types/chat';

export interface StoredConversationRecord {
  id: string;
  title: string;
  format: ChatFormat;
  importedAt: string;
  messages: ChatMessage[];
  timeRange: {
    start: string;
    end: string;
  };
}

export interface SavedConversationSummary {
  id: string;
  title: string;
  format: ChatFormat;
  importedAt: string;
  messageCount: number;
  timeRange: {
    start: string;
    end: string;
  };
}

interface AfterSignalDB extends DBSchema {
  conversations: {
    key: string;
    value: StoredConversationRecord;
    indexes: { 'by-imported': string };
  };
}

const DB_NAME = 'aftersignal_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AfterSignalDB>> | null = null;

function getDb(): Promise<IDBPDatabase<AfterSignalDB>> | null {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB<AfterSignalDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('conversations')) {
          const store = db.createObjectStore('conversations', { keyPath: 'id' });
          store.createIndex('by-imported', 'importedAt');
        }
      },
    }).catch((err) => {
      console.warn('IndexedDB unavailable or blocked. Falling back to in-memory storage.', err);
      return null as unknown as IDBPDatabase<AfterSignalDB>;
    });
  }
  return dbPromise;
}

/**
 * Saves or upserts a ConversationGraph into IndexedDB without duplicating records.
 */
export async function saveConversationToDb(graph: ConversationGraph): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const record: StoredConversationRecord = {
      id: graph.id,
      title: graph.title,
      format: graph.format,
      importedAt: graph.importedAt,
      messages: graph.messages,
      timeRange: graph.timeRange,
    };
    await db.put('conversations', record);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lists all saved conversation summaries ordered by imported time.
 */
export async function getSavedConversationSummaries(): Promise<SavedConversationSummary[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const records = await db.getAllFromIndex('conversations', 'by-imported');
    return records.map((rec) => ({
      id: rec.id,
      title: rec.title,
      format: rec.format,
      importedAt: rec.importedAt,
      messageCount: rec.messages.length,
      timeRange: rec.timeRange,
    })).reverse();
  } catch {
    return [];
  }
}

/**
 * Loads a full ConversationGraph from IndexedDB by ID and reconstructs maps.
 */
export async function loadConversationFromDb(id: string): Promise<ConversationGraph | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const record = await db.get('conversations', id);
    if (!record) return null;

    return reconstructConversationGraph(record);
  } catch {
    return null;
  }
}

/**
 * Deletes a single conversation from IndexedDB by ID.
 */
export async function deleteConversationFromDb(id: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db.delete('conversations', id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears all stored conversations from IndexedDB.
 */
export async function clearAllConversationsFromDb(): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db.clear('conversations');
    return true;
  } catch {
    return false;
  }
}

export function reconstructConversationGraph(record: StoredConversationRecord): ConversationGraph {
  const messageMap = new Map<string, ChatMessage>();
  const threads = new Map<string, ChatThread>();
  const senders = new Map<string, ChatSender>();

  record.messages.forEach((msg) => {
    messageMap.set(msg.id, msg);

    if (!senders.has(msg.senderId)) {
      senders.set(msg.senderId, {
        id: msg.senderId,
        name: msg.senderName,
      });
    }

    const threadId = msg.threadId || msg.replyToId || 'main_thread';
    if (!threads.has(threadId)) {
      threads.set(threadId, {
        id: threadId,
        rootMessageId: msg.id,
        messageIds: [],
        lastUpdated: msg.timestamp,
      });
    }
    const thread = threads.get(threadId)!;
    thread.messageIds.push(msg.id);
    thread.lastUpdated = msg.timestamp;
  });

  return {
    id: record.id,
    title: record.title,
    format: record.format,
    importedAt: record.importedAt,
    messages: record.messages,
    messageMap,
    threads,
    senders,
    timeRange: record.timeRange,
  };
}
