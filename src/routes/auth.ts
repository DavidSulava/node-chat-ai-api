import express, { Request, Response, Router } from "express";
import { StreamChat } from "stream-chat";
import { env } from "../config/env.js";
import { catchAsync } from "../utils/catchAsync.js";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/authenticate.js";
import {
  authRegisterSchema,
  authLoginSchema,
  refreshTokenSchema,
} from "../utils/validation.js";
import { createAuthService } from "../services/AuthService.js";

const router: Router = express.Router();

const chatClient = StreamChat.getInstance(
  env.STREAM_API_KEY,
  env.STREAM_API_SECRET,
);

const authService = createAuthService(chatClient);

router.post(
  "/register",
  validate(authRegisterSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { login, password } = req.body;
    const result = await authService.register({ login, password });
    res.status(201).json(result);
  }),
);

router.post(
  "/login",
  validate(authLoginSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { login, password } = req.body;
    const result = await authService.login({ login, password });
    res.status(200).json(result);
  }),
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json(result);
  }),
);

router.post(
  "/logout",
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
    await authService.logout(req.user.userId);
    res.status(200).json({ message: "Logged out successfully" });
  }),
);

export default router;
