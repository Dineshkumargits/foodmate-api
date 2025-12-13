import { Request, Response } from "express";
import User from "../models/User";
import FoodEntry from "../models/FoodEntry";
import Payment from "../models/Payment";
import { Op } from "sequelize";
import {
  sendDailyFoodEntryReminderToSeller,
  sendMonthEndPaymentReminderToSeller,
  sendMonthEndPaymentReminderToConsumer,
} from "../services/notificationService";

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
