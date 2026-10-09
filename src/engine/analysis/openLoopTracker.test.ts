import { describe, it, expect } from 'vitest';
import { parseChatContent } from '../ingestion/chatParser';
import { trackOpenLoops } from './openLoopTracker';
import { detectDecisions } from './decisionDetector';

describe('openLoopTracker Module', () => {
  it('should detect unanswered questions as UNANSWERED_QUESTION', () => {
    const rawJson = JSON.stringify([
      { id: 'm1', sender: 'Alice', timestamp: '2026-10-09T08:30:00.000Z', content: 'What is the rollback strategy if step 3 fails?' },
    ]);
    const graph = parseChatContent(rawJson, 'CUSTOM_JSON');

    const openLoops = trackOpenLoops(graph);
    expect(openLoops.length).toBe(1);
    expect(openLoops[0].status).toBe('UNANSWERED_QUESTION');
    expect(openLoops[0].evidence[0].messageId).toBe('m1');
  });

  it('should detect pending action items with assignees and deadlines', () => {
    const rawJson = JSON.stringify([
      { id: 'm1', sender: 'Elena', timestamp: '2026-10-09T10:00:00.000Z', content: 'Frank, please build the Chat Ingestion Parser by 2 PM tomorrow.' },
    ]);
    const graph = parseChatContent(rawJson, 'CUSTOM_JSON');

    const openLoops = trackOpenLoops(graph);
    expect(openLoops.length).toBe(1);
    expect(openLoops[0].status).toBe('PENDING_ACTION_ITEM');
    expect(openLoops[0].assignee).toBe('Frank');
    expect(openLoops[0].deadline).toBeDefined();
  });

  it('should not mark completed task report messages as open loops', () => {
    const rawJson = JSON.stringify([
      { id: 'm1', sender: 'Bob', timestamp: '2026-10-09T09:15:00.000Z', content: 'I finished verifying the backup script. DB backup check complete.' },
    ]);
    const graph = parseChatContent(rawJson, 'CUSTOM_JSON');

    const openLoops = trackOpenLoops(graph);
    expect(openLoops.length).toBe(0);
  });

  it('REGRESSION TEST: should NOT classify a confirmed decision mentioning a date as an open loop', () => {
    const sampleChat = JSON.stringify([
      { id: 'm1', sender: 'Alice', timestamp: '2026-10-09T08:00:00.000Z', content: 'We decided to launch the project demo on Friday.' },
      { id: 'm2', sender: 'Bob', timestamp: '2026-10-09T08:05:00.000Z', content: "I'll finish the UI by Thursday evening." },
      { id: 'm3', sender: 'Charlie', timestamp: '2026-10-09T08:10:00.000Z', content: 'Who will prepare the presentation slides?' },
      { id: 'm4', sender: 'Dave', timestamp: '2026-10-09T08:15:00.000Z', content: 'We still need someone to confirm the final demo room.' },
    ]);

    const graph = parseChatContent(sampleChat, 'CUSTOM_JSON');
    
    // Check decisions
    const decisions = detectDecisions(graph);
    const confirmed = decisions.filter((d) => d.confidence === 'EXPLICIT_FACT');
    expect(confirmed.length).toBe(1);
    expect(confirmed[0].messageId).toBe('m1');

    // Check open loops
    const openLoops = trackOpenLoops(graph);
    const openLoopMsgIds = new Set(openLoops.map((l) => l.evidence[0].messageId));

    // Message 1 (Confirmed decision) MUST NOT be in open loops!
    expect(openLoopMsgIds.has('m1')).toBe(false);

    // Message 2, 3, 4 MUST be in open loops!
    expect(openLoopMsgIds.has('m2')).toBe(true);
    expect(openLoopMsgIds.has('m3')).toBe(true);
    expect(openLoopMsgIds.has('m4')).toBe(true);
  });
});
