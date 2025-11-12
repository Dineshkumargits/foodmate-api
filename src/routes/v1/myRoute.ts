import { Router } from "express";
import { getMyEntries } from "../../controllers/foodEntry";
import { authMiddleware } from "../../middleware/auth";
import { roleCheck } from "../../middleware/roleCheck";
import { getMyPayments } from "../../controllers/payment";

const myRouter = Router();

myRouter.post(
  "/entries",
  authMiddleware,
  roleCheck(["consumer"]),
  getMyEntries
);

myRouter.get(
  "/payments",
  authMiddleware,
  roleCheck(["consumer"]),
  getMyPayments
);

export default myRouter;
