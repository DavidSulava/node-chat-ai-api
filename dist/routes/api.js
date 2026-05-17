import express from "express";
import { StreamChat } from "stream-chat";
import { GoogleGenAI } from "@google/genai";
import { db } from "../config/database.js";
import { chats, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { catchAsync } from "../utils/catchAsync.js";
import { logger } from "../utils/logger.js";
const router = express.Router();
// Initialize Stream Client
const chatClient = StreamChat.getInstance(env.STREAM_API_KEY, env.STREAM_API_SECRET);
// Initialize GoogleGenAI
const ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
});
/**
 * check API status
 */
router.get("/status", (_req, res) => {
    res.status(200).json({ status: "API is running" });
});
/**
 * register a user with Stream Chat
 */
router.post("/register-user", catchAsync(async (req, res) => {
    const { name, email } = req.body || {};
    if (!name || !email) {
        throw new AppError(400, "Name and email are required");
    }
    const userId = email.replace(/[^a-zA-Z0-9_-]/g, "_");
    // Check if user exists in Stream
    const userResponse = await chatClient.queryUsers({ id: { $eq: userId } });
    if (!userResponse.users.length) {
        // Add new user to stream
        await chatClient.upsertUser({
            id: userId,
            name: name,
            email: email,
            role: "user",
        });
    }
    // Check for existing user in database
    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.userId, userId));
    if (!existingUser.length) {
        logger.info(`User ${userId} does not exist in the database. Adding them...`);
        await db.insert(users).values({ userId, name, email });
    }
    res.status(200).json({ userId, name, email });
}));
/**
 * send message to AI
 */
router.post("/chat", catchAsync(async (req, res) => {
    const { message, userId } = req.body || {};
    if (!message || !userId) {
        throw new AppError(400, "Message and user are required");
    }
    // Verify user exists in Stream
    const userResponse = await chatClient.queryUsers({ id: userId });
    if (!userResponse.users.length) {
        throw new AppError(404, "User not found. Please register first");
    }
    // Check user in database
    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.userId, userId));
    if (!existingUser.length) {
        throw new AppError(404, "User not found in database, please register");
    }
    // Fetch user's past messages for context
    const chatHistory = await db
        .select()
        .from(chats)
        .where(eq(chats.userId, userId))
        .orderBy(chats.createdAt)
        .limit(10);
    // Format chat history for GoogleGenAI
    const conversation = chatHistory.flatMap((chat) => [
        { role: "user", content: chat.message },
        { role: "assistant", content: chat.reply },
    ]);
    // Add latest user message to the conversation
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
            {
                role: "user",
                parts: userPartList,
            },
            {
                role: "model",
                parts: modelPartList,
            },
        ],
    });
    const aiMessage = response.text ?? "No response from AI";
    // Save chat to database
    await db.insert(chats).values({ userId, message, reply: aiMessage });
    // Get or create Stream channel for this user
    const channel = chatClient.channel("messaging", `chat-${userId}`, {
        name: "AI Chat",
        created_by_id: "ai_bot",
    });
    await channel.create();
    await channel.sendMessage({ text: aiMessage, user_id: "ai_bot" });
    res.status(200).json({ reply: aiMessage });
}));
/**
 * get chat history for a user
 */
router.post("/get-messages", catchAsync(async (req, res) => {
    const { userId } = req.body || {};
    if (!userId) {
        throw new AppError(400, "User ID is required");
    }
    const chatHistory = await db
        .select()
        .from(chats)
        .where(eq(chats.userId, userId));
    res.status(200).json({ messages: chatHistory });
}));
export default router;
