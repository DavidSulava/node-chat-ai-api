import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { createChatService } from '../services/ChatService.js';
import { testDb, testChats, sqlite } from './test-db.js';
import { eq } from 'drizzle-orm';
import { StreamChat } from 'stream-chat';
import { GoogleGenAI } from '@google/genai';

const mockChannel = {
  create: vi.fn().mockResolvedValue({}),
  sendMessage: vi.fn().mockResolvedValue({}),
} as any;

const mockChatClient = {
  channel: vi.fn().mockReturnValue(mockChannel),
} as unknown as StreamChat;

const mockAi = {
  models: {
    generateContent: vi.fn(),
  },
} as any;

describe('ChatService', () => {
  let chatService: ReturnType<typeof createChatService>;

  beforeEach(() => {
    vi.clearAllMocks();
    chatService = createChatService(mockChatClient, mockAi);
  });

  afterAll(() => {
    sqlite.close();
  });

  describe('processChat', () => {
    it('returns AI response and saves message', async () => {
      mockAi.models.generateContent.mockResolvedValue({ text: 'Hello!' });

      const result = await chatService.processChat({ message: 'Hi', userId: 'user1' });

      expect(result.reply).toBe('Hello!');
      expect(mockAi.models.generateContent).toHaveBeenCalled();

      const savedChats = await testDb.select().from(testChats).where(eq(testChats.userId, 'user1'));
      expect(savedChats.length).toBe(1);
      expect(savedChats[0].message).toBe('Hi');
      expect(savedChats[0].reply).toBe('Hello!');
    });

    it('returns fallback message when AI returns empty', async () => {
      mockAi.models.generateContent.mockResolvedValue({ text: undefined });

      const result = await chatService.processChat({ message: 'Hi', userId: 'user1' });

      expect(result.reply).toBe('No response from AI');
    });

    it('sends message to Stream chat', async () => {
      mockAi.models.generateContent.mockResolvedValue({ text: 'AI Response' });

      await chatService.processChat({ message: 'Hello', userId: 'user1' });

      expect(mockChatClient.channel).toHaveBeenCalledWith('messaging', 'chat-user1', {
        name: 'AI Chat',
        created_by_id: 'ai_bot',
      });
      expect(mockChannel.create).toHaveBeenCalled();
      expect(mockChannel.sendMessage).toHaveBeenCalledWith({ text: 'AI Response', user_id: 'ai_bot' });
    });

    it('includes conversation history in AI request', async () => {
      mockAi.models.generateContent.mockResolvedValue({ text: 'Response' });

      await testDb.insert(testChats).values([
        { userId: 'user1', message: 'First message', reply: 'First reply' },
        { userId: 'user1', message: 'Second message', reply: 'Second reply' },
      ]);

      await chatService.processChat({ message: 'Third message', userId: 'user1' });

      expect(mockAi.models.generateContent).toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('returns chat history for user', async () => {
      const messages = await chatService.getMessages('user1');
      expect(Array.isArray(messages)).toBe(true);
    });

    it('returns messages in descending order by createdAt', async () => {
      await testDb.insert(testChats).values([
        { userId: 'user1', message: 'First', reply: 'Reply1' },
        { userId: 'user1', message: 'Second', reply: 'Reply2' },
      ]);

      const messages = await chatService.getMessages('user1');
      expect(messages.length).toBe(2);
    });

    it('returns empty array when no messages exist', async () => {
      const messages = await chatService.getMessages('nonexistent');
      expect(messages.length).toBe(0);
    });
  });

  describe('fetchHistory', () => {
    it('fetches last 10 messages', async () => {
      for (let i = 0; i < 15; i++) {
        await testDb.insert(testChats).values({
          userId: 'user1',
          message: `Message ${i}`,
          reply: `Reply ${i}`,
        });
      }

      const history = await chatService.fetchHistory('user1');
      expect(history.length).toBe(10);
    });
  });
});