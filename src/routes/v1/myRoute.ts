import { Router } from "express";
import { getMyEntries } from "../../controllers/foodEntry";
import { authMiddleware } from "../../middleware/auth";
import { roleCheck } from "../../middleware/roleCheck";
import { getMyData, getMyPayments } from "../../controllers/payment";

const myRouter = Router();

myRouter.get(
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

myRouter.get(
  "/data",
  authMiddleware,
  roleCheck(["consumer"]),
  getMyData
);


export default myRouter;
