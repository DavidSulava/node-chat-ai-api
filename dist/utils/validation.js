import { z } from "zod";
export const registerUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
});
export const chatMessageSchema = z.object({
    message: z.string().min(1, "Message is required"),
    userId: z.string().min(1, "User ID is required"),
});
export const getMessagesSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
});
