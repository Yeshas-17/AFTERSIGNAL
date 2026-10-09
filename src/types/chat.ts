export type ChatFormat = 'SLACK_JSON' | 'WHATSAPP_TXT' | 'DISCORD_JSON' | 'CUSTOM_JSON' | 'CSV';

export interface ChatSender {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  timestamp: string; // ISO string
  content: string;
  threadId?: string;
  replyToId?: string;
  reactions?: Record<string, number>;
  raw?: Record<string, unknown>;
}

export interface ChatThread {
  id: string;
  title?: string;
  rootMessageId: string;
  messageIds: string[];
  lastUpdated: string;
}

export interface ConversationGraph {
  id: string;
  title: string;
  format: ChatFormat;
  importedAt: string;
  messages: ChatMessage[];
  messageMap: Map<string, ChatMessage>;
  threads: Map<string, ChatThread>;
  senders: Map<string, ChatSender>;
  timeRange: {
    start: string;
    end: string;
  };
}
