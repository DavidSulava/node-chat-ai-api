import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/database.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { StreamChat } from "stream-chat";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

export interface RegisterParams {
  login: string;
  password: string;
}

export interface LoginParams {
  login: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  userId: string;
  login: string;
}

const SALT_ROUNDS = 10;

const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const createAuthService = (chatClient: StreamChat) => {
  const register = async ({
    login,
    password,
  }: RegisterParams): Promise<AuthUser> => {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.login, login));

    if (existingUser.length > 0) {
      throw new AppError(409, "Login already exists");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = randomUUID();

    await chatClient.upsertUser({
      id: userId,
      name: login,
      role: "user",
    });

    await db.insert(users).values({
      userId,
      login,
      passwordHash,
    });

    logger.info({ userId, login }, "User registered");

    return { userId, login };
  };

  const login = async ({
    login: loginInput,
    password,
  }: LoginParams): Promise<AuthUser & AuthTokens> => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.login, loginInput));

    if (!user) {
      throw new AppError(401, "Invalid login or password");
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new AppError(401, "Invalid login or password");
    }

    const accessToken = generateAccessToken(user.userId);
    const refreshToken = generateRefreshToken(user.userId);

    await db
      .update(users)
      .set({ refreshToken })
      .where(eq(users.userId, user.userId));

    logger.info({ userId: user.userId }, "User logged in");

    return {
      userId: user.userId,
      login: user.login,
      accessToken,
      refreshToken,
    };
  };

  const refreshToken = async (token: string): Promise<AuthTokens> => {
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      throw new AppError(401, "Invalid refresh token");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.userId, decoded.userId));

    if (!user || user.refreshToken !== token) {
      throw new AppError(401, "Invalid refresh token");
    }

    const newAccessToken = generateAccessToken(user.userId);
    const newRefreshToken = generateRefreshToken(user.userId);

    await db
      .update(users)
      .set({ refreshToken: newRefreshToken })
      .where(eq(users.userId, user.userId));

    logger.info({ userId: user.userId }, "Token refreshed");

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  };

  const logout = async (userId: string): Promise<void> => {
    await db
      .update(users)
      .set({ refreshToken: null })
      .where(eq(users.userId, userId));

    logger.info({ userId }, "User logged out");
  };

  return {
    register,
    login,
    refreshToken,
    logout,
  };
};
