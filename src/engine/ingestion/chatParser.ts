import { ChatMessage, ChatFormat, ConversationGraph, ChatSender, ChatThread } from '../../types/chat';

export function parseChatContent(rawContent: string, format?: ChatFormat): ConversationGraph {
  const detectedFormat = format || detectFormat(rawContent);
  let messages: ChatMessage[] = [];

  switch (detectedFormat) {
    case 'SLACK_JSON':
      messages = parseSlackJson(rawContent);
      break;
    case 'DISCORD_JSON':
      messages = parseDiscordJson(rawContent);
      break;
    case 'WHATSAPP_TXT':
      messages = parseWhatsAppTxt(rawContent);
      break;
    case 'CSV':
      messages = parseCsv(rawContent);
      break;
    case 'CUSTOM_JSON':
    default:
      messages = parseCustomJson(rawContent);
      break;
  }

  // Sort messages chronologically
  messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Ensure unique IDs and non-empty senders
  messages = normalizeMessages(messages);

  return buildConversationGraph(messages, detectedFormat);
}

function detectFormat(rawContent: string): ChatFormat {
  const trimmed = rawContent.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const sample = Array.isArray(parsed) ? parsed[0] : (parsed.messages ? parsed.messages[0] : parsed);
      if (!sample) return 'CUSTOM_JSON';
      
      if ('thread_ts' in sample || ('ts' in sample && 'user' in sample)) {
        return 'SLACK_JSON';
      }
      if ('author' in sample && ('username' in sample.author || 'id' in sample.author)) {
        return 'DISCORD_JSON';
      }
      return 'CUSTOM_JSON';
    } catch {
      // Not JSON
    }
  }

  // WhatsApp check
  if (/^\[?\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/m.test(trimmed)) {
    return 'WHATSAPP_TXT';
  }

  // CSV check
  if (trimmed.includes(',') && (trimmed.toLowerCase().includes('sender') || trimmed.toLowerCase().includes('content'))) {
    return 'CSV';
  }

  return 'CUSTOM_JSON';
}

function parseSlackJson(content: string): ChatMessage[] {
  const data = JSON.parse(content);
  const rawList: Record<string, unknown>[] = Array.isArray(data) ? data : (data.messages || []);
  
  return rawList
    .filter(item => item.type === 'message' || !item.type)
    .map((item, idx) => {
      const ts = String(item.ts || Date.now() / 1000);
      const dateIso = new Date(parseFloat(ts) * 1000).toISOString();
      const userProfile = item.user_profile as Record<string, unknown> | undefined;
      const sender = String(userProfile?.real_name || item.user || item.username || 'Unknown User');
      const text = String(item.text || item.content || '');

      return {
        id: String(item.client_msg_id || `slack_${ts}_${idx}`),
        senderId: String(item.user || sender.toLowerCase().replace(/\s+/g, '_')),
        senderName: sender,
        timestamp: dateIso,
        content: text,
        threadId: item.thread_ts ? String(item.thread_ts) : undefined,
        replyToId: item.parent_user_id ? String(item.parent_user_id) : undefined,
        raw: item,
      };
    });
}

function parseDiscordJson(content: string): ChatMessage[] {
  const data = JSON.parse(content);
  const rawList: Record<string, unknown>[] = Array.isArray(data) ? data : (data.messages || []);

  return rawList.map((item, idx) => {
    const author = (item.author as Record<string, unknown>) || {};
    const senderName = String(author.username || author.name || 'Discord User');
    const senderId = String(author.id || senderName.toLowerCase().replace(/\s+/g, '_'));

    return {
      id: String(item.id || `discord_${idx}`),
      senderId,
      senderName,
      timestamp: item.timestamp ? new Date(String(item.timestamp)).toISOString() : new Date().toISOString(),
      content: String(item.content || ''),
      threadId: item.thread_id ? String(item.thread_id) : undefined,
      replyToId: item.referenced_message ? String((item.referenced_message as Record<string, unknown>).id) : undefined,
      raw: item,
    };
  });
}

function parseWhatsAppTxt(content: string): ChatMessage[] {
  const lines = content.split('\n');
  const messages: ChatMessage[] = [];
  
  // Example lines:
  // [09/10/26, 10:15:30 AM] Alice: Hello team
  // 10/09/2026, 10:15 - Bob: Hey there
  const regexHeader = /^\[?(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}[, ]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]?\s*[-:]?\s*([^:]+):\s*(.*)$/i;

  let currentMsg: ChatMessage | null = null;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const match = trimmed.match(regexHeader);
    if (match) {
      if (currentMsg) {
        messages.push(currentMsg);
      }
      const [, dateStr, senderName, msgText] = match;
      const parsedDate = new Date(dateStr.replace(',', ''));
      const timestamp = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
      const cleanSender = senderName.trim();

      currentMsg = {
        id: `wa_${idx}`,
        senderId: cleanSender.toLowerCase().replace(/\s+/g, '_'),
        senderName: cleanSender,
        timestamp,
        content: msgText.trim(),
      };
    } else if (currentMsg) {
      // Append multi-line message content
      currentMsg.content += `\n${trimmed}`;
    }
  });

  if (currentMsg) {
    messages.push(currentMsg);
  }

  return messages;
}

function parseCsv(content: string): ChatMessage[] {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const idIdx = headers.findIndex(h => h === 'id' || h === 'msg_id' || h === 'message_id');
  const senderIdx = headers.findIndex(h => h === 'sender' || h === 'user' || h === 'author' || h === 'name');
  const timestampIdx = headers.findIndex(h => h === 'timestamp' || h === 'time' || h === 'date');
  const contentIdx = headers.findIndex(h => h === 'content' || h === 'text' || h === 'message');

  const messages: ChatMessage[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length === 0) continue;

    const sender = senderIdx >= 0 && cols[senderIdx] ? cols[senderIdx] : 'Unknown';
    const text = contentIdx >= 0 && cols[contentIdx] ? cols[contentIdx] : cols.join(' ');
    const timeStr = timestampIdx >= 0 && cols[timestampIdx] ? cols[timestampIdx] : new Date().toISOString();
    const parsedDate = new Date(timeStr);
    const validIso = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
    const id = idIdx >= 0 && cols[idIdx] ? cols[idIdx] : `csv_${i}`;

    messages.push({
      id,
      senderId: sender.toLowerCase().replace(/\s+/g, '_'),
      senderName: sender,
      timestamp: validIso,
      content: text,
    });
  }

  return messages;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

function parseCustomJson(content: string): ChatMessage[] {
  try {
    const data = JSON.parse(content);
    const rawList: Record<string, unknown>[] = Array.isArray(data) 
      ? data 
      : (data.messages || data.data || []);

    return rawList.map((item, idx) => {
      const sender = String(item.sender || item.senderName || item.author || item.user || 'Unknown');
      const text = String(item.content || item.text || item.message || '');
      const timeStr = String(item.timestamp || item.time || item.date || new Date().toISOString());
      const parsedDate = new Date(timeStr);
      const validIso = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

      return {
        id: String(item.id || item.messageId || `msg_${idx + 1}`),
        senderId: String(item.senderId || sender.toLowerCase().replace(/\s+/g, '_')),
        senderName: sender,
        timestamp: validIso,
        content: text,
        threadId: item.threadId ? String(item.threadId) : undefined,
        replyToId: item.replyToId ? String(item.replyToId) : undefined,
        raw: item,
      };
    });
  } catch {
    return [];
  }
}

function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
  const seenIds = new Set<string>();

  return messages.map((msg, idx) => {
    let uniqueId = msg.id || `msg_${idx + 1}`;
    if (seenIds.has(uniqueId)) {
      uniqueId = `${uniqueId}_${idx}`;
    }
    seenIds.add(uniqueId);

    return {
      ...msg,
      id: uniqueId,
      senderName: msg.senderName.trim() || 'Anonymous',
      senderId: msg.senderId.trim() || 'anonymous',
      content: msg.content.trim(),
    };
  });
}

function buildConversationGraph(messages: ChatMessage[], format: ChatFormat): ConversationGraph {
  const messageMap = new Map<string, ChatMessage>();
  const threads = new Map<string, ChatThread>();
  const senders = new Map<string, ChatSender>();

  messages.forEach(msg => {
    messageMap.set(msg.id, msg);

    // Register sender
    if (!senders.has(msg.senderId)) {
      senders.set(msg.senderId, {
        id: msg.senderId,
        name: msg.senderName,
      });
    }

    // Thread grouping
    const threadId = msg.threadId || msg.replyToId || 'main_thread';
    if (!threads.has(threadId)) {
      threads.set(threadId, {
        id: threadId,
        rootMessageId: msg.id,
        messageIds: [],
        lastUpdated: msg.timestamp,
      });
    }
    const thread = threads.get(threadId)!;
    thread.messageIds.push(msg.id);
    thread.lastUpdated = msg.timestamp;
  });

  const startTime = messages.length > 0 ? messages[0].timestamp : new Date().toISOString();
  const endTime = messages.length > 0 ? messages[messages.length - 1].timestamp : new Date().toISOString();

  return {
    id: `conv_${Date.now()}`,
    title: `Chat Sync (${format})`,
    format,
    importedAt: new Date().toISOString(),
    messages,
    messageMap,
    threads,
    senders,
    timeRange: {
      start: startTime,
      end: endTime,
    },
  };
}
