import { Router } from "express";
import { recordPayment } from "../../controllers/payment";
import { authMiddleware } from "../../middleware/auth";
import { upload } from "../../middleware/upload";

const paymentsRouter = Router();

paymentsRouter.post(
  "/",
  authMiddleware,
  upload.single("receipt"),
  recordPayment
);

export default paymentsRouter;
