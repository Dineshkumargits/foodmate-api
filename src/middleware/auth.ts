import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../util/token";
import { verify } from "../util/jwt";
import { get } from "lodash";
import User from "../models/User";

export interface AuthRequest extends Request {
  user?: Partial<User>
  file?: any;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const bearerToken = get(req, "headers.authorization");
    let token = bearerToken;
    if (bearerToken && bearerToken.startsWith("Bearer ")) {
      token = bearerToken.substring(7);
    }
    if (!token) return res.status(401).json({ error: "missing token" });

    const { decoded, expired, valid, msg: errorMsg } = verify(token);

    if (valid && !expired) {
      req.user = decoded as Partial<User>;
      return next();
    } else {
      return res.status(403).json({
        error: true,
        errorMsg: errorMsg,
      });
    }
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}
