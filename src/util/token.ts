import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

export const createToken = (user: { id: number; role: string }) =>
  jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string) =>
  jwt.verify(token, JWT_SECRET) as { id: number; role: "seller" | "consumer" };
