import express from "express";
import { StreamChat } from "stream-chat";
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { catchAsync } from "../utils/catchAsync.js";
import { validate } from "../middlewares/validate.js";
import { registerUserSchema, chatMessageSchema, getMessagesSchema, } from "../utils/validation.js";
import { createUserService } from "../services/UserService.js";
import { createChatService } from "../services/ChatService.js";
const router = express.Router();
// Initialize Stream Client
const chatClient = StreamChat.getInstance(env.STREAM_API_KEY, env.STREAM_API_SECRET);
// Initialize GoogleGenAI
const ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
});
// Initialize services
const userService = createUserService(chatClient);
const chatService = createChatService(chatClient, ai);
/**
 * check API status
 */
router.get("/status", (_req, res) => {
    res.status(200).json({ status: "API is running" });
});
/**
 * register a user with Stream Chat
 */
router.post("/register-user", validate(registerUserSchema), catchAsync(async (req, res) => {
    const { name, email } = req.body;
    const result = await userService.registerUser({ name, email });
    res.status(200).json(result);
}));
/**
 * send message to AI
 */
router.post("/chat", validate(chatMessageSchema), catchAsync(async (req, res) => {
    const { message, userId } = req.body;
    await userService.ensureUserExists(userId);
    const result = await chatService.processChat({ message, userId });
    res.status(200).json(result);
}));
/**
 * get chat history for a user
 */
router.post("/get-messages", validate(getMessagesSchema), catchAsync(async (req, res) => {
    const { userId } = req.body;
    const messages = await chatService.getMessages(userId);
    res.status(200).json({ messages });
}));
export default router;
