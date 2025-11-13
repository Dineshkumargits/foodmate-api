import { Router } from "express";
import { getAllPayments, recordPayment } from "../../controllers/payment";
import { authMiddleware } from "../../middleware/auth";
import { upload } from "../../middleware/upload";
import { roleCheck } from "../../middleware/roleCheck";

const paymentsRouter = Router();

paymentsRouter.post(
  "/",
  authMiddleware,
  roleCheck(["seller"]),
  upload.single("receipt"),
  recordPayment
);

paymentsRouter.get("/", authMiddleware, roleCheck(["seller"]), getAllPayments);

export default paymentsRouter;
