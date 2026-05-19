import { z } from "zod";

export const authRegisterSchema = z.object({
  login: z
    .string()
    .min(3, "Login must be at least 3 characters")
    .max(30, "Login must be at most 30 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const authLoginSchema = z.object({
  login: z.string().min(1, "Login is required"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export const getMessagesSchema = z.object({});
