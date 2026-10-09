import { ConversationGraph } from '../../types/chat';
import { GroundedFinding, DecisionDriftRecord, OpenLoopItem } from '../../types/analysis';
import { detectDecisions } from './decisionDetector';
import { detectDecisionDrift } from './decisionDrift';
import { trackOpenLoops } from './openLoopTracker';
import { validateFinding, validateEvidencePointer } from '../evidence/evidenceValidator';

export interface AnalysisEngineResult {
  summaryBrief: GroundedFinding[];
  explicitDecisions: GroundedFinding[];
  decisionDrift: DecisionDriftRecord[];
  openLoops: OpenLoopItem[];
  executionTimeMs: number;
  deterministicMode: boolean;
}

export function analyzeConversation(graph: ConversationGraph): AnalysisEngineResult {
  const startTime = performance.now();

  // 1. Detect Decision Candidates
  const candidates = detectDecisions(graph);

  // Filter explicit decision findings
  const explicitDecisions: GroundedFinding[] = candidates
    .filter((c) => !c.isSuggestion && c.confidence === 'EXPLICIT_FACT')
    .map((c, idx) => {
      const rawFinding: GroundedFinding = {
        id: `finding_dec_${idx + 1}`,
        type: 'DECISION',
        title: `Decision: ${c.topic}`,
        explanation: c.statement,
        confidence: c.confidence,
        evidence: [
          {
            messageId: c.messageId,
            sender: c.sender,
            timestamp: c.timestamp,
            verbatimQuote: c.verbatimQuote,
          },
        ],
      };
      return validateFinding(rawFinding, graph);
    });

  // 2. Detect Decision Drift & Contradictions
  const rawDrift = detectDecisionDrift(graph);
  const validatedDrift = rawDrift.filter((d) => {
    const vEarlier = validateEvidencePointer(
      {
        messageId: d.earlierDecision.messageId,
        sender: d.earlierDecision.sender,
        timestamp: d.earlierDecision.timestamp,
        verbatimQuote: d.earlierDecision.verbatimQuote,
      },
      graph
    );

    const vMutated = validateEvidencePointer(
      {
        messageId: d.mutatedDecision.messageId,
        sender: d.mutatedDecision.sender,
        timestamp: d.mutatedDecision.timestamp,
        verbatimQuote: d.mutatedDecision.verbatimQuote,
      },
      graph
    );

    return vEarlier.isValid && vMutated.isValid;
  });

  // 3. Track Open Loops (Unanswered questions, action items)
  const rawOpenLoops = trackOpenLoops(graph);
  const validatedOpenLoops = rawOpenLoops.filter((loop) => {
    return loop.evidence.every((ptr) => validateEvidencePointer(ptr, graph).isValid);
  });

  // 4. Construct Summary Brief Highlights
  const summaryBrief: GroundedFinding[] = [
    ...explicitDecisions.slice(0, 3),
    ...validatedOpenLoops.slice(0, 3).map((l, idx) => ({
      id: `brief_loop_${idx + 1}`,
      type: 'OPEN_LOOP' as const,
      title: `Open Action: ${l.assignee ? l.assignee : 'Team'}`,
      explanation: l.title,
      confidence: l.confidence,
      evidence: l.evidence,
    })),
  ];

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    summaryBrief,
    explicitDecisions,
    decisionDrift: validatedDrift,
    openLoops: validatedOpenLoops,
    executionTimeMs,
    deterministicMode: true,
  };
}
