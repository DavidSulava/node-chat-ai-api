import { db } from "../config/database.js";
import { chats } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { StreamChat } from "stream-chat";
import { GoogleGenAI, Content } from "@google/genai";
import type { ChatSelect } from "../db/schema.js";
import { logger } from "../utils/logger.js";
import { retry } from "../utils/retry.js";

export interface ChatMessageParams {
  message: string;
  userId: string;
}

export interface ChatMessageResult {
  reply: string;
}

export const createChatService = (chatClient: StreamChat, ai: GoogleGenAI) => {
  const fetchHistory = async (userId: string) => {
    const chatHistory = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.createdAt))
      .limit(10);

    return chatHistory;
  };

  const generateAiResponse = async (
    message: string,
    userId: string,
  ): Promise<string> => {
    const chatHistory = await fetchHistory(userId);

    const conversation = chatHistory
      .slice()
      .reverse()
      .flatMap((chat: ChatSelect) => [
        { role: "user", content: chat.message },
        { role: "assistant", content: chat.reply },
      ]);

    conversation.push({ role: "user", content: message });

    const userPartList = conversation
      .filter((chat) => chat.role === "user")
      .map((chat) => ({ text: chat.content }));
    const modelPartList = conversation
      .filter((chat) => chat.role === "assistant")
      .map((chat) => ({ text: chat.content }));

    const response = await retry(
      () =>
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            { role: "user", parts: userPartList },
            { role: "model", parts: modelPartList },
          ] as Content[],
        }),
      { maxAttempts: 3, initialDelayMs: 1000 },
    );

    return response.text ?? "No response from AI";
  };

  const saveMessage = async (
    userId: string,
    message: string,
    reply: string,
  ) => {
    await db.insert(chats).values({ userId, message, reply });
  };

  const sendStreamMessage = async (userId: string, reply: string) => {
    const channelId = `chat-${userId}`;
    let channel = chatClient.channel("messaging", channelId);

    try {
      await channel.watch();
    } catch {
      channel = chatClient.channel("messaging", channelId, {
        name: "AI Chat",
        created_by_id: "ai_bot",
      });
      await channel.create();
    }

    await channel.sendMessage({ text: reply, user_id: "ai_bot" });
  };

  const processChat = async ({
    message,
    userId,
  }: ChatMessageParams): Promise<ChatMessageResult> => {
    const aiMessage = await generateAiResponse(message, userId);

    await saveMessage(userId, message, aiMessage);
    await sendStreamMessage(userId, aiMessage);

    logger.info({ userId, messageLength: message.length }, "Chat processed");

    return { reply: aiMessage };
  };

  const getMessages = async (userId: string) => {
    const chatHistory = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.createdAt));

    return chatHistory;
  };

  return {
    processChat,
    getMessages,
    fetchHistory,
  };
};
