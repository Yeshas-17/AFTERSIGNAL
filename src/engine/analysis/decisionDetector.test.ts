import { describe, it, expect } from 'vitest';
import { parseChatContent } from '../ingestion/chatParser';
import { detectDecisions } from './decisionDetector';

describe('decisionDetector Module', () => {
  it('should detect explicit decision statements', () => {
    const rawJson = JSON.stringify([
      { id: 'm1', sender: 'Alice', content: 'We decided on Vite.' },
      { id: 'm2', sender: 'Bob', content: 'We agreed to use TypeScript.' },
    ]);
    const graph = parseChatContent(rawJson, 'CUSTOM_JSON');

    const decisions = detectDecisions(graph);
    expect(decisions.length).toBe(2);
    expect(decisions[0].confidence).toBe('EXPLICIT_FACT');
    expect(decisions[0].isSuggestion).toBe(false);
  });

  it('should classify suggestions as UNCERTAIN rather than confirmed decisions', () => {
    const rawJson = JSON.stringify([
      { id: 'm1', sender: 'Charlie', content: 'What if we delay the migration to 6 PM UTC?' },
      { id: 'm2', sender: 'Dave', content: 'Maybe we could use Next.js instead?' },
    ]);
    const graph = parseChatContent(rawJson, 'CUSTOM_JSON');

    const candidates = detectDecisions(graph);
    expect(candidates.length).toBe(2);
    expect(candidates[0].isSuggestion).toBe(true);
    expect(candidates[0].confidence).toBe('UNCERTAIN');
  });

  it('should classify clarifying statements as REASONABLE_INFERENCE', () => {
    const rawJson = JSON.stringify([
      { id: 'm1', sender: 'Eve', content: 'To clarify, the font hierarchy uses Inter for UI.' },
    ]);
    const graph = parseChatContent(rawJson, 'CUSTOM_JSON');

    const candidates = detectDecisions(graph);
    expect(candidates.length).toBe(1);
    expect(candidates[0].confidence).toBe('REASONABLE_INFERENCE');
  });

  it('should not confuse casual questions with confirmed decisions', () => {
    const rawJson = JSON.stringify([
      { id: 'm1', sender: 'Frank', content: 'Anyone up for coffee later?' },
    ]);
    const graph = parseChatContent(rawJson, 'CUSTOM_JSON');

    const candidates = detectDecisions(graph);
    const confirmed = candidates.filter((c) => c.confidence === 'EXPLICIT_FACT');
    expect(confirmed.length).toBe(0);
  });
});
