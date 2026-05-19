import express, { Request, Response, Router } from "express";
import { StreamChat } from "stream-chat";
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { db } from "../config/database.js";
import { users } from "../db/schema.js";
import { catchAsync } from "../utils/catchAsync.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/authenticate.js";
import { chatMessageSchema } from "../utils/validation.js";
import { createChatService } from "../services/ChatService.js";
import authRouter from "./auth.js";

const router: Router = express.Router();

// Initialize Stream Client
const chatClient = StreamChat.getInstance(
  env.STREAM_API_KEY,
  env.STREAM_API_SECRET,
);

// Initialize GoogleGenAI
const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

// Initialize services
const chatService = createChatService(chatClient, ai);

// Mount auth routes
router.use("/auth", authRouter);

/**
 * check API status
 */
router.get("/status", (_req: Request, res: Response) => {
  res.status(200).json({ status: "API is running" });
});

router.get(
  "/health",
  catchAsync(async (_req: Request, res: Response) => {
    await db.select().from(users).limit(1);
    res.status(200).json({ status: "healthy", database: "connected" });
  }),
);

/**
 * send message to AI (protected)
 */
router.post(
  "/chat",
  authenticate,
  validate(chatMessageSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { message } = req.body;
    const result = await chatService.processChat({
      message,
      userId: req.user.userId,
    });
    res.status(200).json(result);
  }),
);

/**
 * get chat history for a user (protected)
 */
router.get(
  "/messages",
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
    const messages = await chatService.getMessages(req.user.userId);
    res.status(200).json({ messages });
  }),
);

export default router;
