import { ConversationGraph, ChatMessage } from '../../types/chat';
import { GroundedFinding, ConfidenceTier } from '../../types/analysis';

export interface DetectedDecisionCandidate {
  messageId: string;
  sender: string;
  timestamp: string;
  statement: string;
  verbatimQuote: string;
  topic: string;
  confidence: ConfidenceTier;
  isSuggestion: boolean;
}

const DECISION_KEYWORDS = [
  'we decided',
  'decided to',
  'decided on',
  'agreed to',
  'agreed on',
  'we agreed',
  'final call',
  'confirmed for',
  'let\'s go with',
  'going with',
  'moving to',
];

const SUGGESTION_KEYWORDS = [
  'what if',
  'maybe we could',
  'how about',
  'should we',
  'can we',
  'i propose',
  'suggestion:',
  'would it make sense',
  'anyone up for',
];

const CLARIFICATION_KEYWORDS = [
  'to clarify',
  'clarification:',
  'note that',
  'just to confirm',
  'meaning that',
];

export function detectDecisions(graph: ConversationGraph): DetectedDecisionCandidate[] {
  const candidates: DetectedDecisionCandidate[] = [];

  graph.messages.forEach((msg) => {
    const textLower = msg.content.toLowerCase().trim();
    if (!textLower) return;

    const isSuggestion = SUGGESTION_KEYWORDS.some((kw) => textLower.includes(kw)) || textLower.startsWith('what about');
    const isDecision = DECISION_KEYWORDS.some((kw) => textLower.includes(kw));
    const isClarification = CLARIFICATION_KEYWORDS.some((kw) => textLower.includes(kw));

    if (isSuggestion && !isDecision) {
      candidates.push({
        messageId: msg.id,
        sender: msg.senderName,
        timestamp: msg.timestamp,
        statement: msg.content,
        verbatimQuote: msg.content,
        topic: extractTopic(msg.content),
        confidence: 'UNCERTAIN',
        isSuggestion: true,
      });
      return;
    }

    if (isDecision) {
      candidates.push({
        messageId: msg.id,
        sender: msg.senderName,
        timestamp: msg.timestamp,
        statement: msg.content,
        verbatimQuote: msg.content,
        topic: extractTopic(msg.content),
        confidence: 'EXPLICIT_FACT',
        isSuggestion: false,
      });
      return;
    }

    if (isClarification) {
      candidates.push({
        messageId: msg.id,
        sender: msg.senderName,
        timestamp: msg.timestamp,
        statement: msg.content,
        verbatimQuote: msg.content,
        topic: extractTopic(msg.content),
        confidence: 'REASONABLE_INFERENCE',
        isSuggestion: false,
      });
    }
  });

  return candidates;
}

export function extractTopic(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes('migration') || lower.includes('db') || lower.includes('database') || lower.includes('utc') || lower.includes('backup')) return 'database migration time';
  if (lower.includes('vite') || lower.includes('react') || lower.includes('frontend') || lower.includes('next.js') || lower.includes('stack') || lower.includes('bundler')) return 'frontend stack';
  if (lower.includes('model') || lower.includes('smollm') || lower.includes('qwen')) return 'AI model choice';
  if (lower.includes('light mode') || lower.includes('dark mode') || lower.includes('theme') || lower.includes('glassmorphic')) return 'app theme';
  if (lower.includes('presentation') || lower.includes('demo time') || lower.includes('presentation time')) return 'presentation time';
  if (lower.includes('submit') || lower.includes('deadline') || lower.includes('submission')) return 'submission deadline';
  if (lower.includes('repo') || lower.includes('github') || lower.includes('public') || lower.includes('private')) return 'repo visibility';
  if (lower.includes('accent color') || lower.includes('cyan') || lower.includes('emerald')) return 'accent color';
  
  // Default fallback topic extracted from first 5 words
  const words = content.split(/\s+/).slice(0, 5).join(' ');
  return words || 'general discussion';
}
