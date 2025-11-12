import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../util/token";

export interface AuthRequest extends Request {
  user?: { id: number; role: "seller" | "consumer" };
  file?: any;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "missing token" });

  const token = auth.split(" ")[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}
