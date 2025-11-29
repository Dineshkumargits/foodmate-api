import {
  getAllPaymentsService,
  getMyExpensesService,
  getMyPaymentsService,
  recordPaymentService,
} from "../services/paymentService";
import { AuthRequest } from "../middleware/auth";
import { NextFunction, Response } from "express";
import { sendPaymentReceivedNotification } from "../services/notificationService";

export const recordPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await recordPaymentService({ req, res });
    // Send push notification to consumer
    try {
      const { consumer_id, date, amount } = req.body;
      await sendPaymentReceivedNotification(
        Number(consumer_id),
        Number(amount),
        date
      );
    } catch (error) {
      console.error("Failed to send push notification:", error);
      // Don't fail the request if notification fails
    }
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

export const getMyData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const consumerId = req.user.id;
    const response = await getMyExpensesService(consumerId);
    res.json(response);
  } catch (err) {
    next(err);
  }
};
