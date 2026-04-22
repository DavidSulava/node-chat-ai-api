import express, { Request, Response, Router } from 'express';
import { StreamChat } from 'stream-chat';
import { Content, GoogleGenAI } from '@google/genai';
import { db } from '../config/database.js';
import { chats, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router: Router = express.Router();
// Initialize Stream Client
const chatClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!
);
// Initialize GoogleGenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
/**
 * GET endpoint to check API status
 */
router.get('/status', (req: Request, res: Response) => {
  res.status(200).json({ status: 'API is running' });
});
/**
 * POST endpoint to register a user with Stream Chat
 */
router.post('/register-user', async (req: Request, res: Response): Promise<any> => {
  const { name, email } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const userId = email.replace(/[^a-zA-Z0-9_-]/g, '_');
    // Check if user exists
    const userResponse = await chatClient.queryUsers({ id: { $eq: userId } });

    if (!userResponse.users.length) {
      // Add new user to stream
      await chatClient.upsertUser({
        id: userId,
        name: name,
        email: email,
        role: 'user',
      });
    }
    // Check for existing user in database
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId));

    if (!existingUser.length) {
      console.log(
        `User ${userId} does not exist in the database. Adding them...`
      );
      await db.insert(users).values({ userId, name, email });
    }

    res.status(200).json({ userId, name, email });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
/**
 * POST endpoint to send message to AI
 */
router.post('/chat', async (req: Request, res: Response): Promise<any> => {
  const { message, userId } = req.body || {};
  console.log('chat', message);
  if (!message || !userId) {
    return res.status(400).json({ error: 'Message and user are required' });
  }

  try {
    // Verify user exists
    const userResponse = await chatClient.queryUsers({ id: userId });

    if (!userResponse.users.length) {
      return res
        .status(404)
        .json({ error: 'user not found. Please register first' });
    }
    // Check user in database
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId));

    if (!existingUser.length) {
      return res
        .status(404)
        .json({ error: 'User not found in database, please register' });
    }
    // Fetch users past messages for context
    const chatHistory = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(chats.createdAt)
      .limit(10);
    // Format chat history for GoogleGenAI
    const conversation = chatHistory.flatMap(
      (chat) => [
        { role: 'user', content: chat.message },
        { role: 'assistant', content: chat.reply },
      ]
    );
    // Add latest user messages to the conversation
    conversation.push({ role: 'user', content: message });

    const userPartList = conversation?.filter((chat) => chat.role === 'user')?.map((chat) => ({ text: chat.content }));
    const modelPartList = conversation?.filter((chat) => chat.role === 'assistant')?.map((chat) => ({ text: chat.content }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: 'user',
          parts: userPartList,
        },
        {
          role: 'model',
          parts: modelPartList,
        },
      ] as Content[],
    });

    const aiMessage: string = response.text ?? 'No response from AI';
    // Save chat to database
    await db.insert(chats).values({ userId, message, reply: aiMessage });
    // Create or get channel
    const channel = chatClient.channel('messaging', `chat-${userId}`, {
      name: 'AI Chat',
      created_by_id: 'ai_bot',
    });

    await channel.create();
    await channel.sendMessage({ text: aiMessage, user_id: 'ai_bot' });

    res.status(200).json({ reply: aiMessage });
  } catch (error) {
    console.log('Error generating AI response', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
/**
 * POST endpoint to get chat history for a user
 */
router.post('/get-messages', async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.body || {};

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const chatHistory = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId));

    res.status(200).json({ messages: chatHistory });
  } catch (error) {
    console.log('Error fetching chat history', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;