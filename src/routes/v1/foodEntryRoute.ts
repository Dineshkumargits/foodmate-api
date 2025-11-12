import { Router } from "express";
import {
  addFoodEntry,
  deleteFoodEntry,
  getFoodEntries,
  getFoodEntriesForConsumer,
} from "../../controllers/foodEntry";
import { authMiddleware } from "../../middleware/auth";
import { roleCheck } from "../../middleware/roleCheck";

const foodEntryRouter = Router();

foodEntryRouter.post("/", authMiddleware, roleCheck(["seller"]), addFoodEntry);
foodEntryRouter.get(
  "/:id",
  authMiddleware,
  roleCheck(["seller"]),
  getFoodEntries
);
foodEntryRouter.delete(
  "/:id",
  authMiddleware,
  roleCheck(["seller"]),
  deleteFoodEntry
);

foodEntryRouter.get(
  "/consumer/:id",
  authMiddleware,
  roleCheck(["seller"]),
  getFoodEntriesForConsumer
);

export default foodEntryRouter;
