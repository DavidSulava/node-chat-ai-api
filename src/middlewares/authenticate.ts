import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

declare global {
  namespace Express {
    interface Request {
      user: { userId: string };
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "Authorization header with Bearer token required");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      userId: string;
    };
    req.user = { userId: decoded.userId };
    next();
  } catch {
    throw new AppError(401, "Invalid or expired access token");
  }
};
