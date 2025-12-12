import {
  getAllPaymentsService,
  getMyExpensesService,
  getMyPaymentsService,
  recordPaymentService,
  getMonthlyBillService,
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

export const getMonthlyBill = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const consumerId =
      req.user.role === "consumer"
        ? req.user.id
        : Number(req.params.consumerId);
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ error: "Invalid month or year" });
    }

    const response = await getMonthlyBillService(consumerId, month, year);
    res.json(response);
  } catch (err) {
    next(err);
  }
};
