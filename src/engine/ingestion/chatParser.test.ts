import { describe, it, expect } from 'vitest';
import { parseChatContent } from './chatParser';

describe('chatParser Module', () => {
  it('should parse Slack JSON export correctly', () => {
    const slackRaw = JSON.stringify([
      {
        type: 'message',
        ts: '1696800000.000100',
        user: 'U12345',
        text: 'Let us decide on the migration schedule.',
        user_profile: { real_name: 'Alice' }
      },
      {
        type: 'message',
        ts: '1696800300.000200',
        user: 'U67890',
        text: 'We decided on 6 PM UTC.',
        user_profile: { real_name: 'Bob' }
      }
    ]);

    const graph = parseChatContent(slackRaw, 'SLACK_JSON');
    expect(graph.messages.length).toBe(2);
    expect(graph.format).toBe('SLACK_JSON');
    expect(graph.messages[0].senderName).toBe('Alice');
    expect(graph.messages[1].content).toBe('We decided on 6 PM UTC.');
  });

  it('should parse WhatsApp text export correctly', () => {
    const whatsappRaw = `[09/10/26, 10:15:30 AM] Alice: Hello team
[09/10/26, 10:20:00 AM] Bob: We decided to deploy at 5 PM.
Multi-line message continuation line here.`;

    const graph = parseChatContent(whatsappRaw, 'WHATSAPP_TXT');
    expect(graph.messages.length).toBe(2);
    expect(graph.messages[0].senderName).toBe('Alice');
    expect(graph.messages[1].content).toContain('Multi-line message continuation line here.');
  });

  it('should parse Discord JSON export correctly', () => {
    const discordRaw = JSON.stringify([
      {
        id: 'disc_1',
        author: { id: 'usr_1', username: 'Charlie' },
        timestamp: '2026-10-09T10:00:00.000Z',
        content: 'Is the API ready?'
      }
    ]);

    const graph = parseChatContent(discordRaw, 'DISCORD_JSON');
    expect(graph.messages.length).toBe(1);
    expect(graph.messages[0].senderName).toBe('Charlie');
    expect(graph.messages[0].content).toBe('Is the API ready?');
  });

  it('should parse CSV chat exports correctly', () => {
    const csvRaw = `id,sender,timestamp,content
msg_1,Dave,2026-10-09T11:00:00.000Z,"We agree on Vite."
msg_2,Eve,2026-10-09T11:05:00.000Z,"Vite is great."`;

    const graph = parseChatContent(csvRaw, 'CSV');
    expect(graph.messages.length).toBe(2);
    expect(graph.messages[0].senderName).toBe('Dave');
    expect(graph.messages[0].content).toBe('We agree on Vite.');
  });

  it('should handle malformed JSON gracefully', () => {
    const malformedRaw = '{"invalid": json...';
    const graph = parseChatContent(malformedRaw);
    expect(graph.messages).toEqual([]);
  });

  it('should handle empty input strings gracefully', () => {
    const graph = parseChatContent('');
    expect(graph.messages).toEqual([]);
    expect(graph.senders.size).toBe(0);
  });

  it('should deduplicate duplicate message IDs', () => {
    const jsonWithDupes = JSON.stringify([
      { id: 'dup_1', sender: 'Alice', content: 'First' },
      { id: 'dup_1', sender: 'Bob', content: 'Second duplicate ID' }
    ]);
    const graph = parseChatContent(jsonWithDupes, 'CUSTOM_JSON');
    expect(graph.messages.length).toBe(2);
    expect(graph.messages[0].id).toBe('dup_1');
    expect(graph.messages[1].id).toBe('dup_1_1');
  });

  it('should handle missing timestamps by providing a fallback ISO timestamp', () => {
    const jsonNoTime = JSON.stringify([
      { id: 'm1', sender: 'Alice', content: 'No timestamp provided' }
    ]);
    const graph = parseChatContent(jsonNoTime, 'CUSTOM_JSON');
    expect(graph.messages.length).toBe(1);
    expect(graph.messages[0].timestamp).toBeDefined();
    expect(() => new Date(graph.messages[0].timestamp)).not.toThrow();
  });
});
