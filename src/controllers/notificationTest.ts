import { Request, Response } from "express";
import User from "../models/User";
import FoodEntry from "../models/FoodEntry";
import Payment from "../models/Payment";
import { Op } from "sequelize";
import {
  sendDailyFoodEntryReminderToSeller,
  sendMonthEndPaymentReminderToSeller,
  sendMonthEndPaymentReminderToConsumer,
  sendPushNotification,
} from "../services/notificationService";
import { customRequest } from "../types/customDefinition";
import { getActiveDeviceTokens } from "../services/deviceService";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

// Check notification receipt status
export const checkNotificationReceipt = async (req: Request, res: Response) => {
  try {
    const { receiptId } = req.params;

    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID is required",
      });
    }

    console.log("Checking receipt for:", receiptId);

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds([receiptId]);

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        console.log("Receipts:", JSON.stringify(receipts, null, 2));

        const receipt = receipts[receiptId];

        if (receipt) {
          if (receipt.status === "ok") {
            return res.json({
              success: true,
              message: "Notification delivered successfully",
              receipt,
            });
          } else if (receipt.status === "error") {
            return res.status(400).json({
              success: false,
              message: "Notification delivery failed",
              error: receipt.message,
              details: receipt.details,
              receipt,
            });
          }
        } else {
          return res.status(404).json({
            success: false,
            message:
              "Receipt not found - notification might still be processing",
          });
        }
      } catch (error) {
        console.error("Error fetching receipts:", error);
        throw error;
      }
    }
  } catch (error: any) {
    console.error("Exception in checkNotificationReceipt:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Test notification to static push token
export const testStaticToken = async (req: Request, res: Response) => {
  try {
    const staticToken = "ExponentPushToken[9ZDQ4QORHihyaQt8pnhRY1]";

    if (!Expo.isExpoPushToken(staticToken)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Expo push token format",
        token: staticToken,
      });
    }

    const message: ExpoPushMessage = {
      to: staticToken,
      sound: "default",
      title: "🎯 Static Token Test",
      body: "This is a direct test notification to your device!",
      data: { type: "static_test", timestamp: new Date().toISOString() },
      priority: "high",
      channelId: "high-priority",
    };

    console.log("Sending test notification to static token:", staticToken);

    const ticketChunk = await expo.sendPushNotificationsAsync([message]);

    console.log("Tickets received:", ticketChunk);

    const ticket = ticketChunk[0];

    if (ticket.status === "ok") {
      console.log("✓ Notification sent successfully!");
      return res.json({
        success: true,
        message: "Notification sent successfully",
        token: staticToken,
        ticketId: ticket.id,
        status: ticket.status,
      });
    } else {
      console.error("✗ Error sending notification:", ticket);
      return res.status(400).json({
        success: false,
        message: "Failed to send notification",
        token: staticToken,
        error: ticket.message,
        details: ticket.details,
      });
    }
  } catch (error: any) {
    console.error("Exception in testStaticToken:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Test simple notification for current user
export const testSimpleNotification = async (
  req: customRequest,
  res: Response
) => {
  try {
    const { id: userId, name } = req.user;

    // Check if user has push tokens
    const tokens = await getActiveDeviceTokens(userId);

    if (!tokens || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No active push tokens found for your account. Please make sure notifications are enabled in the app.",
        userId,
        userName: name,
      });
    }

    // Send test notification
    const result = await sendPushNotification(
      userId,
      "Test Notification",
      "This is a test notification from Foodmate! 🎉",
      { type: "test" },
      "high"
    );

    res.json({
      success: true,
      message: "Test notification sent successfully",
      userId,
      userName: name,
      tokens,
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to send test notification",
      error: error.message,
    });
  }
};

// Test endpoint for daily food entry reminders
export const testDailyFoodEntryReminder = async (
  req: Request,
  res: Response
) => {
  try {
    const sellers = await User.findAll({
      where: { role: "seller" },
    });

    const results = [];
    for (const seller of sellers) {
      const result = await sendDailyFoodEntryReminderToSeller(seller.id);
      results.push({
        sellerId: seller.id,
        sellerName: seller.name,
        sent: !!result,
      });
    }

    res.json({
      success: true,
      message: `Daily food entry reminders sent to ${sellers.length} sellers`,
      results,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to send daily food entry reminders",
      error: error.message,
    });
  }
};

// Test endpoint for month-start payment reminders
export const testMonthStartPaymentReminder = async (
  req: Request,
  res: Response
) => {
  try {
    const sellers = await User.findAll({
      where: { role: "seller" },
    });

    const results = [];

    for (const seller of sellers) {
      const consumers = await User.findAll({
        where: { role: "consumer" },
      });

      for (const consumer of consumers) {
        // Get previous month's stats
        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfPrevMonth = new Date(
          prevMonth.getFullYear(),
          prevMonth.getMonth(),
          1
        );
        const endOfPrevMonth = new Date(
          prevMonth.getFullYear(),
          prevMonth.getMonth() + 1,
          0
        );

        const entries = await FoodEntry.findAll({
          where: {
            seller_id: seller.id,
            consumer_id: consumer.id,
            date: {
              [Op.between]: [startOfPrevMonth, endOfPrevMonth],
            },
          },
        });

        const payments = await Payment.findAll({
          where: {
            seller_id: seller.id,
            consumer_id: consumer.id,
            date: {
              [Op.between]: [startOfPrevMonth, endOfPrevMonth],
            },
          },
        });

        const totalDue = entries.reduce(
          (sum, entry) => sum + Number(entry.amount),
          0
        );
        const totalPaid = payments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        );
        const pendingAmount = totalDue - totalPaid;

        if (pendingAmount > 0) {
          const sellerResult = await sendMonthEndPaymentReminderToSeller(
            seller.id,
            consumer.name,
            pendingAmount
          );

          const consumerResult = await sendMonthEndPaymentReminderToConsumer(
            consumer.id,
            pendingAmount,
            seller.name
          );

          results.push({
            sellerId: seller.id,
            sellerName: seller.name,
            consumerId: consumer.id,
            consumerName: consumer.name,
            pendingAmount,
            sellerNotificationSent: !!sellerResult,
            consumerNotificationSent: !!consumerResult,
          });
        }
      }
    }

    res.json({
      success: true,
      message: `Month-start payment reminders sent for ${results.length} pending payments`,
      results,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to send month-start payment reminders",
      error: error.message,
    });
  }
};

// Test endpoint to manually trigger specific notification
export const testNotificationForUser = async (req: Request, res: Response) => {
  try {
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        message: "userId and type are required",
      });
    }

    let result;
    switch (type) {
      case "daily_food_entry":
        result = await sendDailyFoodEntryReminderToSeller(userId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid notification type",
        });
    }

    res.json({
      success: true,
      message: "Notification sent successfully",
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};
