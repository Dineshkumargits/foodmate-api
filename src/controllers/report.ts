import { NextFunction, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  getConsumerReportService,
  getDashboardDataService,
  getMonthlySummaryService,
} from "../services/reportService";
import { parseMonthName } from "../util/util";

export const getConsumerReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const consumerId = req.params.id;
    const { month } = req?.query as any;
    const response = await getConsumerReportService(Number(consumerId), month);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getDashboardData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await getDashboardDataService();
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getMonthlySummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const monthName = req.query.month as string;
    const consumerId = req.query.consumerId
      ? Number(req.query.consumerId)
      : null;
    const monthNum = parseMonthName(monthName);
    if (!monthNum) return res.status(400).json({ error: "Invalid month name" });
    const response = await getMonthlySummaryService({
      consumerId,
      monthNum,
      monthName,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
};
