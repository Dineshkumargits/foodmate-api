import {
  createUser,
  findOneUser,
  getUsers,
  updateUserById,
  userExists,
  validatePassword,
} from "../services/userService";
import { NextFunction, Response, Request } from "express";
import { omit } from "lodash";
import { customRequest } from "../types/customDefinition";
import { ApiError } from "../util/ApiError";
import { encryptSync } from "../util/encrypt";
import { User } from "../models";
import {
  deactivateDevice,
  deactivateDeviceToken,
  getUserDevices,
  updatePushToken,
} from "../services/deviceService";
const omitData = ["password"];
export const updateUser = async (
  req: customRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: userId } = req.user;

    let body = req.body;
    body = omit(body, omitData);

    const user = await findOneUser({ id: userId });

    if (!user) {
      throw new ApiError(400, "User not found");
    }

    const updated = await updateUserById(body, parseInt(userId, 10));

    return res.status(200).json({
      updated: updated[0],
      msg: updated[0] ? "Data updated successfully" : "failed to update",
      error: false,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserData = async (
  req: customRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    return res.status(200).json({
      data: req.user,
      error: false,
    });
  } catch (err) {
    next(err);
  }
};

export const getConsumers = async (
  req: customRequest,
  res: Response,
  next: NextFunction
) => {
  const users = await getUsers({ where: { role: "consumer" } });
  try {
    res.status(200).json({
      data: users,
      error: false,
    });
  } catch (err) {
    next(err);
  }
};

export const addUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let user = req.body;
    const userExist = await userExists({
      email: user.email,
      phone: user.phone,
    });
    if (userExist) {
      throw new ApiError(400, "Email or Mobile is already used");
    }
    user = await createUser({
      ...user,
      password: user.password || "changethispassword123",
      role: "consumer",
    });
    const userData = omit(user?.toJSON(), omitData);

    return res.status(200).json({
      data: userData,
      error: false,
      msg: "User added successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const updateConsumer = async (
  req: customRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let body = req.body;
    body = omit(body, omitData);

    const user = await findOneUser({ id: req.params.id });

    if (!user) {
      throw new ApiError(400, "User not found");
    }

    const updated = await updateUserById(body, parseInt(req.params.id, 10));

    return res.status(200).json({
      updated: updated[0],
      msg: updated[0] ? "Data updated successfully" : "failed to update",
      error: false,
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (
  req: customRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: userId } = req.user;
    const { current_password, new_password } = req.body;

    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      throw new ApiError(400, "User not found");
    }

    const validPassword = User.validPassword(
      current_password,
      user.password_hash
    );
    if (!validPassword) {
      throw new ApiError(400, "Old password is incorrect");
    }

    const updated = await updateUserById(
      { password_hash: encryptSync(new_password) },
      parseInt(userId, 10)
    );

    return res.status(200).json({
      updated: updated[0],
      msg: updated[0]
        ? "Password changed successfully"
        : "failed to change password",
      error: false,
    });
  } catch (err) {
    next(err);
  }
};

export const savePushToken = async (
  req: customRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: userId } = req.user;
    const { pushToken, oldToken, deviceInfo } = req.body;

    if (!pushToken) {
      throw new ApiError(400, "Push token is required");
    }

    if (!deviceInfo || !deviceInfo.platform) {
      throw new ApiError(400, "Device info with platform is required");
    }

    const result = await updatePushToken(userId, pushToken, oldToken, {
      platform: deviceInfo.platform,
      model: deviceInfo.model,
      osVersion: deviceInfo.osVersion,
    });

    return res.status(200).json({
      success: true,
      data: result,
      error: false,
    });
  } catch (err) {
    next(err);
  }
};

export const deactivatePushToken = async(
  req: customRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: userId } = req.user;
    const { pushToken } = req.body;

    if (!pushToken) {
      throw new ApiError(400, "Push token is required");
    }

    const result = await deactivateDeviceToken(pushToken);

    return res.status(200).json({
      success: true,
      data: result,
      error: false,
    });
  } catch (err) {
    next(err);
  }
};

export const getDevices = async (
  req: customRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: userId } = req.user;
    const devices = await getUserDevices(userId);

    return res.status(200).json({
      success: true,
      data: devices,
      error: false,
    });
  } catch (err) {
    next(err);
  }
};

export const removeDevice = async (
  req: customRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: userId } = req.user;
    const { deviceId } = req.params;

    const result = await deactivateDevice(userId, Number(deviceId));

    return res.status(200).json({
      success: true,
      data: result,
      error: false,
    });
  } catch (err) {
    next(err);
  }
};
