import { Router } from "express";
import { getMyEntries } from "../../controllers/foodEntry";
import { authMiddleware } from "../../middleware/auth";
import { roleCheck } from "../../middleware/roleCheck";
import { getMyPayments } from "../../controllers/payment";
import { getConsumerReports, getDashboardData } from "../../controllers/report";

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

export default reportRouter;
