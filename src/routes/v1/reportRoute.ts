import { Router } from "express";
import {
  getConsumerReports,
  getDashboardData,
  getMonthlySummary,
  generateBill,
} from "../../controllers/report";
import { authMiddleware } from "../../middleware/auth";
import { roleCheck } from "../../middleware/roleCheck";

const reportRouter = Router();

reportRouter.get(
  "/consumer/:id",
  authMiddleware,
  roleCheck(["seller"]),
  getConsumerReports
);

reportRouter.get(
  "/dashboard",
  authMiddleware,
  roleCheck(["seller"]),
  getDashboardData
);

reportRouter.get(
  "/seller/monthly-stats",
  authMiddleware,
  roleCheck(["seller"]),
  getMonthlySummary
);

reportRouter.get(
  "/generate-bill",
  authMiddleware,
  roleCheck(["seller"]),
  generateBill
);

export default reportRouter;
