import { NextFunction, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  getConsumerReportService,
  getDashboardDataService,
} from "../services/reportService";

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
