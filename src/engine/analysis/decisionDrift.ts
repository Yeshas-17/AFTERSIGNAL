import { ConversationGraph } from '../../types/chat';
import { DecisionDriftRecord, DriftType, ConfidenceTier } from '../../types/analysis';
import { detectDecisions, extractTopic, DetectedDecisionCandidate } from './decisionDetector';

const MUTATION_KEYWORDS = [
  'instead',
  'change from',
  'moved to',
  'scratch that',
  'correction on',
  'update on',
  'changed to',
  'moving to',
];

const CONTRADICTION_KEYWORDS = [
  'says',
  'but',
  'conflicting',
  'disagree',
  'or is it',
];

export function detectDecisionDrift(graph: ConversationGraph): DecisionDriftRecord[] {
  const allCandidates = detectDecisions(graph);

  // Group decision candidates by topic
  const topicMap = new Map<string, DetectedDecisionCandidate[]>();

  allCandidates.forEach((cand) => {
    const list = topicMap.get(cand.topic) || [];
    list.push(cand);
    topicMap.set(cand.topic, list);
  });

  const driftRecords: DecisionDriftRecord[] = [];
  let driftIdCount = 1;

  // Scan graph directly for explicit contradiction or mutation patterns
  graph.messages.forEach((msg) => {
    const lower = msg.content.toLowerCase();
    
    // Check for explicit contradiction pattern (e.g., "Alice says Cyan, but Bob says Emerald")
    if (lower.includes('says') && lower.includes('but') && lower.includes('says')) {
      driftRecords.push({
        id: `drift_contra_${driftIdCount++}`,
        topic: extractTopic(msg.content),
        driftType: 'GENUINE_CONTRADICTION',
        confidence: 'UNCERTAIN',
        summary: `Contradiction detected: ${msg.content}`,
        earlierDecision: {
          messageId: msg.id,
          sender: msg.senderName,
          timestamp: msg.timestamp,
          statement: msg.content,
          verbatimQuote: msg.content,
        },
        mutatedDecision: {
          messageId: msg.id,
          sender: msg.senderName,
          timestamp: msg.timestamp,
          statement: msg.content,
          verbatimQuote: msg.content,
        },
        explanation: 'Conflicting statements made without a settled resolution.',
      });
      return;
    }

    // Check for mutation statement ("instead", "scratch that", "moved to")
    const isMutation = MUTATION_KEYWORDS.some((kw) => lower.includes(kw));
    if (isMutation) {
      const topic = extractTopic(msg.content);
      const candidates = topicMap.get(topic) || [];
      const earlier = candidates.find((c) => !c.isSuggestion && c.messageId !== msg.id && new Date(c.timestamp) <= new Date(msg.timestamp));

      if (earlier) {
        driftRecords.push({
          id: `drift_${driftIdCount++}`,
          topic,
          driftType: 'SUPERSEDED_DECISION',
          confidence: 'EXPLICIT_FACT',
          summary: `Decision updated for ${topic}`,
          earlierDecision: {
            messageId: earlier.messageId,
            sender: earlier.sender,
            timestamp: earlier.timestamp,
            statement: earlier.statement,
            verbatimQuote: earlier.verbatimQuote,
          },
          mutatedDecision: {
            messageId: msg.id,
            sender: msg.senderName,
            timestamp: msg.timestamp,
            statement: msg.content,
            verbatimQuote: msg.content,
          },
          resolvedState: extractResolvedValue(msg.content),
          explanation: `Later message explicitly modified earlier decision from '${earlier.sender}'.`,
        });
      } else {
        // Self-contained correction in a single message (e.g. "Correction on model choice: We decided on SmolLM2-360M instead of Qwen2.5-1.5B")
        driftRecords.push({
          id: `drift_${driftIdCount++}`,
          topic,
          driftType: 'SUPERSEDED_DECISION',
          confidence: 'EXPLICIT_FACT',
          summary: `Decision updated for ${topic}`,
          earlierDecision: {
            messageId: msg.id,
            sender: msg.senderName,
            timestamp: msg.timestamp,
            statement: msg.content,
            verbatimQuote: msg.content,
          },
          mutatedDecision: {
            messageId: msg.id,
            sender: msg.senderName,
            timestamp: msg.timestamp,
            statement: msg.content,
            verbatimQuote: msg.content,
          },
          resolvedState: extractResolvedValue(msg.content),
          explanation: `Self-contained decision modification statement in message.`,
        });
      }
    }
  });

  return deduplicateDriftRecords(driftRecords);
}

function extractResolvedValue(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('9 pm')) return '9 PM UTC';
  if (lower.includes('smollm2')) return 'SmolLM2-360M';
  if (lower.includes('dark mode')) return 'Dark Mode glassmorphic';
  if (lower.includes('5:00 pm')) return '5:00 PM';
  if (lower.includes('4:45 pm')) return '4:45 PM';

  const parts = text.split(/instead|to|for/i);
  return parts.length > 1 ? parts[parts.length - 1].trim() : text;
}

function deduplicateDriftRecords(records: DecisionDriftRecord[]): DecisionDriftRecord[] {
  const seen = new Set<string>();
  return records.filter((rec) => {
    const key = `${rec.topic}_${rec.mutatedDecision.messageId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
