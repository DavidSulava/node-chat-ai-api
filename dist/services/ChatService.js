import { db } from "../config/database.js";
import { chats } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { logger } from "../utils/logger.js";
export const createChatService = (chatClient, ai) => {
    const fetchHistory = async (userId) => {
        const chatHistory = await db
            .select()
            .from(chats)
            .where(eq(chats.userId, userId))
            .orderBy(desc(chats.createdAt))
            .limit(10);
        return chatHistory;
    };
    const generateAiResponse = async (message, userId) => {
        const chatHistory = await fetchHistory(userId);
        const conversation = chatHistory
            .slice()
            .reverse()
            .flatMap((chat) => [
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { role: "user", parts: userPartList },
                { role: "model", parts: modelPartList },
            ],
        });
        return response.text ?? "No response from AI";
    };
    const saveMessage = async (userId, message, reply) => {
        await db.insert(chats).values({ userId, message, reply });
    };
    const sendStreamMessage = async (userId, reply) => {
        const channel = chatClient.channel("messaging", `chat-${userId}`, {
            name: "AI Chat",
            created_by_id: "ai_bot",
        });
        await channel.create();
        await channel.sendMessage({ text: reply, user_id: "ai_bot" });
    };
    const processChat = async ({ message, userId, }) => {
        const aiMessage = await generateAiResponse(message, userId);
        await saveMessage(userId, message, aiMessage);
        await sendStreamMessage(userId, aiMessage);
        logger.info({ userId, messageLength: message.length }, "Chat processed");
        return { reply: aiMessage };
    };
    const getMessages = async (userId) => {
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
