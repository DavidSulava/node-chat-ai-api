import { db } from "../config/database.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { StreamChat } from "stream-chat";
import { AppError } from "../utils/errors.js";

export const createUserService = (chatClient: StreamChat) => {
  const ensureUserExists = async (userId: string): Promise<void> => {
    const [userResponse, existingUser] = await Promise.all([
      chatClient.queryUsers({ id: userId }),
      db.select().from(users).where(eq(users.userId, userId)),
    ]);

    if (!userResponse.users.length) {
      throw new AppError(404, "User not found. Please register first");
    }

    if (!existingUser.length) {
      throw new AppError(404, "User not found in database, please register");
    }
  };

  return {
    ensureUserExists,
  };
};
