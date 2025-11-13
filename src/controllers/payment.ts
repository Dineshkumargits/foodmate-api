import {
  getAllPaymentsService,
  getMyPaymentsService,
  recordPaymentService,
} from "../services/paymentService";
import { AuthRequest } from "../middleware/auth";
import { NextFunction, Response } from "express";

export const recordPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await recordPaymentService({ req, res });
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getMyPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const consumerId = req.user.id;
    const response = await getMyPaymentsService(consumerId);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getAllPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await getAllPaymentsService();
    res.json(response);
  } catch (err) {
    next(err);
  }
};
