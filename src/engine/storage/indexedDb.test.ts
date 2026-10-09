import { describe, it, expect } from 'vitest';
import { reconstructConversationGraph, StoredConversationRecord } from './indexedDb';

describe('IndexedDB Storage Module', () => {
  it('should reconstruct ConversationGraph maps correctly from stored record', () => {
    const record: StoredConversationRecord = {
      id: 'conv_test_1',
      title: 'Test Storage Graph',
      format: 'CUSTOM_JSON',
      importedAt: '2026-10-09T12:00:00.000Z',
      messages: [
        { id: 'm1', senderId: 'alice', senderName: 'Alice', timestamp: '2026-10-09T12:00:00.000Z', content: 'We decided on React.' },
        { id: 'm2', senderId: 'bob', senderName: 'Bob', timestamp: '2026-10-09T12:05:00.000Z', content: 'Sounds great.' },
      ],
      timeRange: { start: '2026-10-09T12:00:00.000Z', end: '2026-10-09T12:05:00.000Z' },
    };

    const graph = reconstructConversationGraph(record);
    expect(graph.id).toBe('conv_test_1');
    expect(graph.messages.length).toBe(2);
    expect(graph.messageMap.get('m1')?.content).toBe('We decided on React.');
    expect(graph.senders.has('alice')).toBe(true);
    expect(graph.senders.has('bob')).toBe(true);
    expect(graph.threads.has('main_thread')).toBe(true);
  });
});
