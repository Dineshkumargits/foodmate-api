import {
  deactivatePushToken,
  getDevices,
  removeDevice,
  savePushToken,
} from "./../../controllers/user";
import { Router } from "express";
import { requireUser, validateRequest } from "../../middleware";
import {
  addUser,
  changePassword,
  getConsumers,
  getUserData,
  updateConsumer,
  updateUser,
} from "../../controllers/user";
import { addUserSchema, updateSchema } from "../../validation/user";
import { roleCheck } from "../../middleware/roleCheck";

const userRouter = Router();

userRouter.patch("/", requireUser, validateRequest(updateSchema), updateUser);
userRouter.get("/", requireUser, getUserData);
userRouter.post("/change-password", requireUser, changePassword);
userRouter.get("/consumers", roleCheck(["seller"]), getConsumers);
userRouter.post("/add", validateRequest(addUserSchema), addUser);
userRouter.patch(
  "/updateConsumer/:id",
  validateRequest(addUserSchema),
  updateConsumer
);
// Push notification routes
userRouter.post("/push-token", requireUser, savePushToken);
userRouter.get("/devices", requireUser, getDevices);
userRouter.delete("/devices/:deviceId", requireUser, removeDevice);
userRouter.post("/deactivate-push-token", requireUser, deactivatePushToken);

export default userRouter;

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User
 */

/**
 * @swagger
 * /v1/user:
 *   get:
 *     summary: Get user information
 *     description: Logged in users can fetch only their own user information.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *
 *   patch:
 *     summary: Update  user
 *     description: Logged in users can only update their own information.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *             example:
 *               name: fake name
 *     responses:
 *       "200":
 *         description: OK
 *
 */
