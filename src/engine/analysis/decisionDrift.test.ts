import { describe, it, expect } from 'vitest';
import { parseChatContent } from '../ingestion/chatParser';
import { detectDecisionDrift } from './decisionDrift';

describe('decisionDrift Module', () => {
  it('should detect when a later message supersedes an earlier decision', () => {
    const rawJson = JSON.stringify([
      { id: 'm1', sender: 'Alice', timestamp: '2026-10-09T08:00:00.000Z', content: 'We decided to execute the DB migration at 6 PM UTC.' },
      { id: 'm2', sender: 'Dave', timestamp: '2026-10-09T09:00:00.000Z', content: 'Emergency update! Change from 6 PM to 9 PM UTC instead.' },
    ]);
    const graph = parseChatContent(rawJson, 'CUSTOM_JSON');

    const driftRecords = detectDecisionDrift(graph);
    expect(driftRecords.length).toBeGreaterThan(0);
    expect(driftRecords[0].driftType).toBe('SUPERSEDED_DECISION');
    expect(driftRecords[0].earlierDecision.messageId).toBe('m1');
    expect(driftRecords[0].mutatedDecision.messageId).toBe('m2');
  });

  it('should detect explicit contradictions and classify them as GENUINE_CONTRADICTION with UNCERTAIN confidence', () => {
    const rawJson = JSON.stringify([
      { id: 'm1', sender: 'Kevin', timestamp: '2026-10-09T13:00:00.000Z', content: 'Alice says accent color is Cyan, but Bob says accent color is Emerald.' },
    ]);
    const graph = parseChatContent(rawJson, 'CUSTOM_JSON');

    const driftRecords = detectDecisionDrift(graph);
    expect(driftRecords.length).toBe(1);
    expect(driftRecords[0].driftType).toBe('GENUINE_CONTRADICTION');
    expect(driftRecords[0].confidence).toBe('UNCERTAIN');
  });
});
