import { ConversationGraph } from '../../types/chat';
import { GroundedFinding, EvidencePointer } from '../../types/analysis';

export interface ValidationResult {
  isValid: boolean;
  validEvidence: EvidencePointer[];
  rejectedEvidence: EvidencePointer[];
  reasons: string[];
}

/**
 * Validates that an EvidencePointer references a real message ID in the conversation
 * and that the verbatim quote exists as a substring of the original message text.
 */
export function validateEvidencePointer(pointer: EvidencePointer, graph: ConversationGraph): { isValid: boolean; reason?: string } {
  const message = graph.messageMap.get(pointer.messageId);
  if (!message) {
    return { isValid: false, reason: `Message ID '${pointer.messageId}' not found in conversation graph.` };
  }

  // Normalize quotes for comparison
  const normQuote = pointer.verbatimQuote.trim().toLowerCase();
  const normContent = message.content.trim().toLowerCase();

  if (!normQuote) {
    return { isValid: false, reason: 'Verbatim quote is empty.' };
  }

  if (!normContent.includes(normQuote)) {
    return { 
      isValid: false, 
      reason: `Verbatim quote "${pointer.verbatimQuote}" was not found in message '${pointer.messageId}' content.` 
    };
  }

  return { isValid: true };
}

/**
 * Filters and validates all evidence pointers for a grounded finding.
 * Returns a validated finding or marks it as UNCERTAIN if evidence is missing/invalid.
 */
export function validateFinding(finding: GroundedFinding, graph: ConversationGraph): GroundedFinding {
  const validPointers: EvidencePointer[] = [];

  for (const ptr of finding.evidence) {
    const check = validateEvidencePointer(ptr, graph);
    if (check.isValid) {
      validPointers.push(ptr);
    }
  }

  if (validPointers.length === 0) {
    return {
      ...finding,
      confidence: 'UNCERTAIN',
      evidence: [],
      explanation: `${finding.explanation} [WARNING: Evidence quote validation failed]`,
    };
  }

  return {
    ...finding,
    evidence: validPointers,
  };
}
