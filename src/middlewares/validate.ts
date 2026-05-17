import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/errors.js";

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues
        .map((issue) => issue.message)
        .join(", ");
      throw new AppError(400, errors);
    }
    next();
  };
};
