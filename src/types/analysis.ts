export type ConfidenceTier = 'EXPLICIT_FACT' | 'REASONABLE_INFERENCE' | 'UNCERTAIN';

export type DriftType = 
  | 'SUGGESTION'
  | 'CLARIFICATION'
  | 'SUPERSEDED_DECISION'
  | 'GENUINE_CONTRADICTION';

export type OpenLoopStatus = 
  | 'UNANSWERED_QUESTION'
  | 'PENDING_ACTION_ITEM'
  | 'UNRESOLVED_BLOCKER'
  | 'RESOLVED';

export interface EvidencePointer {
  messageId: string;
  sender: string;
  timestamp: string;
  verbatimQuote: string;
}

export interface GroundedFinding {
  id: string;
  type: 'DECISION' | 'OPEN_LOOP' | 'DEADLINE' | 'SUMMARY_POINT';
  title: string;
  explanation: string;
  confidence: ConfidenceTier;
  evidence: EvidencePointer[];
}

export interface DecisionDriftRecord {
  id: string;
  topic: string;
  driftType: DriftType;
  confidence: ConfidenceTier;
  summary: string;
  earlierDecision: {
    messageId: string;
    sender: string;
    timestamp: string;
    statement: string;
    verbatimQuote: string;
  };
  mutatedDecision: {
    messageId: string;
    sender: string;
    timestamp: string;
    statement: string;
    verbatimQuote: string;
  };
  resolvedState?: string;
  explanation: string;
}

export interface OpenLoopItem {
  id: string;
  title: string;
  status: OpenLoopStatus;
  confidence: ConfidenceTier;
  assignee?: string;
  deadline?: string; // ISO string if parsed
  deadlineText?: string;
  evidence: EvidencePointer[];
  resolutionEvidence?: EvidencePointer;
  threadId?: string;
}

export type NetworkEventType = 
  | 'LOCAL_INFERENCE'
  | 'MODEL_DOWNLOAD'
  | 'LOCALHOST_REQUEST'
  | 'EXTERNAL_API'
  | 'STATIC_ASSET';

export interface NetworkActivityEvent {
  id: string;
  timestamp: string;
  type: NetworkEventType;
  url: string;
  method: string;
  bytesTransferred: number;
  description: string;
  isPrivacyCompliant: boolean;
}
