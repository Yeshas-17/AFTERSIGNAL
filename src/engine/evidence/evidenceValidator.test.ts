import { describe, it, expect } from 'vitest';
import { parseChatContent } from '../ingestion/chatParser';
import { validateEvidencePointer, validateFinding } from './evidenceValidator';
import { GroundedFinding } from '../../types/analysis';

describe('evidenceValidator Module', () => {
  const sampleJson = JSON.stringify([
    { id: 'm1', sender: 'Alice', content: 'We decided on React.' },
    { id: 'm2', sender: 'Bob', content: 'What about Next.js?' },
  ]);
  const graph = parseChatContent(sampleJson, 'CUSTOM_JSON');

  it('should validate a correct evidence pointer referencing existing message ID and verbatim quote', () => {
    const validPtr = {
      messageId: 'm1',
      sender: 'Alice',
      timestamp: graph.messages[0].timestamp,
      verbatimQuote: 'We decided on React.',
    };

    const res = validateEvidencePointer(validPtr, graph);
    expect(res.isValid).toBe(true);
  });

  it('should reject evidence pointer when message ID does not exist in graph', () => {
    const invalidPtr = {
      messageId: 'non_existent_id',
      sender: 'Alice',
      timestamp: new Date().toISOString(),
      verbatimQuote: 'We decided on React.',
    };

    const res = validateEvidencePointer(invalidPtr, graph);
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('not found');
  });

  it('should reject evidence pointer when quote is fabricated and not present in message text', () => {
    const fabricatedPtr = {
      messageId: 'm1',
      sender: 'Alice',
      timestamp: graph.messages[0].timestamp,
      verbatimQuote: 'We decided on Vue.js.', // Fabricated quote
    };

    const res = validateEvidencePointer(fabricatedPtr, graph);
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('was not found');
  });

  it('should mark finding as UNCERTAIN if all evidence pointers fail validation', () => {
    const invalidFinding: GroundedFinding = {
      id: 'f1',
      type: 'DECISION',
      title: 'Fabricated Finding',
      explanation: 'Fake news',
      confidence: 'EXPLICIT_FACT',
      evidence: [
        {
          messageId: 'fake_msg',
          sender: 'Nobody',
          timestamp: new Date().toISOString(),
          verbatimQuote: 'Fabricated statement',
        },
      ],
    };

    const validated = validateFinding(invalidFinding, graph);
    expect(validated.confidence).toBe('UNCERTAIN');
    expect(validated.evidence).toEqual([]);
  });
});
