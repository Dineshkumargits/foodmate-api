import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const roleCheck = (roles: ("seller" | "consumer")[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  };
};
