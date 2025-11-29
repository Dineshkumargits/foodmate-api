import { Device, User } from "../models";
import { ApiError } from "../util/ApiError";

interface DeviceInfo {
  platform: "ios" | "android";
  model?: string;
  osVersion?: string;
}

export const updatePushToken = async (
  userId: number,
  pushToken: string,
  oldToken: string | undefined,
  deviceInfo: DeviceInfo
) => {
  try {
    // Validate push token format (basic validation)
    if (!pushToken || !pushToken.startsWith("ExponentPushToken[")) {
      throw new ApiError(400, "Invalid push token format");
    }

    // Start a transaction
    const result = await Device.sequelize!.transaction(async transaction => {
      // 1. Deactivate old token if provided
      if (oldToken) {
        await Device.update(
          { is_active: false },
          {
            where: {
              user_id: userId,
              push_token: oldToken,
            },
            transaction,
          }
        );
      }

      // 2. Check if this token already exists for this user
      const existingDevice = await Device.findOne({
        where: {
          user_id: userId,
          push_token: pushToken,
        },
        transaction,
      });

      if (existingDevice) {
        // Update existing device
        await existingDevice.update(
          {
            platform: deviceInfo.platform,
            model: deviceInfo.model,
            os_version: deviceInfo.osVersion,
            is_active: true,
            updated_at: new Date(),
          },
          { transaction }
        );

        return existingDevice;
      } else {
        // Create new device
        const newDevice = await Device.create(
          {
            user_id: userId,
            push_token: pushToken,
            platform: deviceInfo.platform,
            model: deviceInfo.model,
            os_version: deviceInfo.osVersion,
            is_active: true,
          },
          { transaction }
        );

        return newDevice;
      }
    });

    // 3. Update user's primary push_token (for backward compatibility)
    await User.update({ push_token: pushToken }, { where: { id: userId } });

    return {
      success: true,
      message: "Push token updated successfully",
      device: {
        id: result.id,
        platform: result.platform,
        model: result.model,
        os_version: result.os_version,
      },
    };
  } catch (error) {
    console.error("Error updating push token:", error);
    throw error;
  }
};

export const getUserDevices = async (userId: number) => {
  const devices = await Device.findAll({
    where: {
      user_id: userId,
      is_active: true,
    },
    attributes: [
      "id",
      "push_token",
      "platform",
      "model",
      "os_version",
      "created_at",
    ],
    order: [["created_at", "DESC"]],
  });

  return devices;
};

export const deactivateDevice = async (userId: number, deviceId: number) => {
  const device = await Device.findOne({
    where: {
      id: deviceId,
      user_id: userId,
    },
  });

  if (!device) {
    throw new ApiError(404, "Device not found");
  }

  await device.update({ is_active: false });

  return {
    success: true,
    message: "Device deactivated successfully",
  };
};

export const getActiveDeviceTokens = async (
  userId: number
): Promise<string[]> => {
  const devices = await Device.findAll({
    where: {
      user_id: userId,
      is_active: true,
    },
    attributes: ["push_token"],
  });

  return devices.map(device => device.push_token);
};
