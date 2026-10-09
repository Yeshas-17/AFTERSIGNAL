import { ConversationGraph, ChatMessage } from '../../types/chat';
import { OpenLoopItem, OpenLoopStatus, EvidencePointer } from '../../types/analysis';
import { extractDeadlinesFromText } from '../ingestion/chronoParser';

const COMPLETION_KEYWORDS = [
  'finished',
  'check complete',
  'completed',
  'is done',
  'done and uploaded',
  'added to root',
  'added to',
];

const QUESTION_STARTERS = [
  'who',
  'what',
  'where',
  'when',
  'why',
  'how',
  'can someone',
  'did we',
  'is the',
  'should we',
];

const EXPLICIT_DECISION_KEYWORDS = [
  'we decided',
  'decided to',
  'decided on',
  'we agreed',
  'agreed to',
  'agreed on',
  'final call',
  'confirmed for',
];

export function trackOpenLoops(graph: ConversationGraph): OpenLoopItem[] {
  const openLoops: OpenLoopItem[] = [];
  const completedMessageIds = new Set<string>();

  // Pass 1: Identify completion messages
  graph.messages.forEach((msg) => {
    const lower = msg.content.toLowerCase();
    if (COMPLETION_KEYWORDS.some((kw) => lower.includes(kw))) {
      completedMessageIds.add(msg.id);
    }
  });

  let loopIdCount = 1;

  // Pass 2: Detect open loops and check if resolved by later completion
  graph.messages.forEach((msg) => {
    const lower = msg.content.toLowerCase().trim();
    if (!lower) return;

    // Skip completed task reports themselves
    if (completedMessageIds.has(msg.id)) return;

    // Confirmed decisions (without questions) are settled facts, NOT open obligations
    const isExplicitDecision = EXPLICIT_DECISION_KEYWORDS.some((kw) => lower.includes(kw));

    const isQuestion = lower.includes('?') || QUESTION_STARTERS.some((qs) => lower.startsWith(qs));
    const isActionItem = 
      lower.includes('please') || 
      lower.includes('assigned to') || 
      lower.includes('will handle') || 
      lower.includes('need someone to') || 
      lower.includes('still need someone') || 
      lower.includes("i'll finish") || 
      lower.includes('will finish') ||
      lower.includes('can record');

    const deadlines = extractDeadlinesFromText(msg.content, msg.timestamp);
    const deadlineObj = deadlines.length > 0 ? deadlines[0] : undefined;

    if (isQuestion) {
      // Check if answered by a later message in same thread or topic
      const isResolved = isQuestionAnswered(msg, graph);

      if (!isResolved) {
        openLoops.push({
          id: `loop_${loopIdCount++}`,
          title: msg.content,
          status: 'UNANSWERED_QUESTION',
          confidence: 'EXPLICIT_FACT',
          evidence: [
            {
              messageId: msg.id,
              sender: msg.senderName,
              timestamp: msg.timestamp,
              verbatimQuote: msg.content,
            },
          ],
          threadId: msg.threadId,
        });
      }
      return;
    }

    // Do not classify a confirmed decision as an open action item even if it mentions a date
    if (!isExplicitDecision && (isActionItem || deadlineObj)) {
      const assignee = extractAssignee(msg.content, msg.senderName);
      
      openLoops.push({
        id: `loop_${loopIdCount++}`,
        title: msg.content,
        status: 'PENDING_ACTION_ITEM',
        confidence: 'EXPLICIT_FACT',
        assignee,
        deadline: deadlineObj?.isoString,
        deadlineText: deadlineObj?.text,
        evidence: [
          {
            messageId: msg.id,
            sender: msg.senderName,
            timestamp: msg.timestamp,
            verbatimQuote: msg.content,
          },
        ],
        threadId: msg.threadId,
      });
    }
  });

  return openLoops;
}

function isQuestionAnswered(questionMsg: ChatMessage, graph: ConversationGraph): boolean {
  const msgTime = new Date(questionMsg.timestamp).getTime();

  // Find subsequent messages in same thread or directly following
  const subsequent = graph.messages.filter((m) => {
    const mTime = new Date(m.timestamp).getTime();
    return mTime > msgTime && (m.threadId === questionMsg.threadId || m.replyToId === questionMsg.id);
  });

  return subsequent.some((m) => {
    const lower = m.content.toLowerCase();
    return !lower.includes('?') && (lower.includes('done') || lower.includes('handled') || lower.includes('yes') || lower.includes('no') || lower.includes('is at') || lower.includes('is '));
  });
}

function extractAssignee(content: string, senderName: string): string | undefined {
  const lower = content.toLowerCase();

  // "Frank, please build..." -> Frank
  const matchDirect = content.match(/^([A-Z][a-z]+)[,\:]\s*please/i);
  if (matchDirect) return matchDirect[1];

  // "Task assigned to Ophelia" -> Ophelia
  const matchAssigned = content.match(/assigned to ([A-Z][a-z]+)/i);
  if (matchAssigned) return matchAssigned[1];

  // "I will handle..." or "I'll finish..." -> Sender
  if (lower.includes('i will handle') || lower.includes('i can record') || lower.includes('i will') || lower.includes("i'll finish")) {
    return senderName;
  }

  return undefined;
}
