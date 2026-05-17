import { db } from "../config/database.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { StreamChat } from "stream-chat";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export interface RegisterUserParams {
  name: string;
  email: string;
}

export interface RegisterUserResult {
  userId: string;
  name: string;
  email: string;
}

export const createUserService = (chatClient: StreamChat) => {
  const registerUser = async ({
    name,
    email,
  }: RegisterUserParams): Promise<RegisterUserResult> => {
    const userId = email.replace(/[^a-zA-Z0-9_-]/g, "_");

    const userResponse = await chatClient.queryUsers({ id: { $eq: userId } });
    if (!userResponse.users.length) {
      await chatClient.upsertUser({
        id: userId,
        name,
        email,
        role: "user",
      });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId));

    if (!existingUser.length) {
      logger.info(
        `User ${userId} does not exist in the database. Adding them...`,
      );
      await db.insert(users).values({ userId, name, email });
    }

    return { userId, name, email };
  };

  const ensureUserExists = async (userId: string): Promise<void> => {
    const userResponse = await chatClient.queryUsers({ id: userId });
    if (!userResponse.users.length) {
      throw new AppError(404, "User not found. Please register first");
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId));
    if (!existingUser.length) {
      throw new AppError(404, "User not found in database, please register");
    }
  };

  return {
    registerUser,
    ensureUserExists,
  };
};
