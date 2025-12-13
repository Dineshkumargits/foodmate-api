import cron from "node-cron";
import User from "../models/User";
import FoodEntry from "../models/FoodEntry";
import Payment from "../models/Payment";
import { Op } from "sequelize";
import {
  sendDailyFoodEntryReminderToSeller,
  sendMonthEndPaymentReminderToSeller,
  sendMonthEndPaymentReminderToConsumer,
} from "./notificationService";

// Helper function to get current month stats
const getMonthlyStats = async (sellerId: number, consumerId: number) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const entries = await FoodEntry.findAll({
    where: {
      seller_id: sellerId,
      consumer_id: consumerId,
      date: {
        [Op.between]: [startOfMonth, endOfMonth],
      },
    },
  });

  const payments = await Payment.findAll({
    where: {
      seller_id: sellerId,
      consumer_id: consumerId,
      date: {
        [Op.between]: [startOfMonth, endOfMonth],
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

  return { totalDue, totalPaid, pendingAmount };
};

// Daily reminder for sellers to add food entries - 9 AM IST
export const scheduleDailyFoodEntryRemindersForSellers = () => {
  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("Running daily food entry reminder for sellers...");
      try {
        const sellers = await User.findAll({
          where: { role: "seller" },
        });

        for (const seller of sellers) {
          await sendDailyFoodEntryReminderToSeller(seller.id);
        }

        console.log(
          `Sent daily food entry reminders to ${sellers.length} sellers`
        );
      } catch (error) {
        console.error(
          "Error sending daily food entry reminders to sellers:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};

// Month-start payment reminders - First 3 days of month at 10 AM IST
export const scheduleMonthEndPaymentReminders = () => {
  // Run every day at 10 AM IST, but only send on first 3 days of month
  cron.schedule(
    "0 10 * * *",
    async () => {
      const now = new Date();
      const currentDay = now.getDate();

      // Only send reminders on first 3 days of the month
      if (currentDay > 3) {
        return;
      }

      console.log(
        "Running month-start payment reminders for previous month..."
      );
      try {
        const sellers = await User.findAll({
          where: { role: "seller" },
        });

        for (const seller of sellers) {
          // Get all consumers for this seller
          const consumers = await User.findAll({
            where: { role: "consumer" },
          });

          for (const consumer of consumers) {
            // Get previous month's stats
            const now = new Date();
            const prevMonth = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              1
            );
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
              // Send reminder to seller
              await sendMonthEndPaymentReminderToSeller(
                seller.id,
                consumer.name,
                pendingAmount
              );

              // Send reminder to consumer
              await sendMonthEndPaymentReminderToConsumer(
                consumer.id,
                pendingAmount,
                seller.name
              );
            }
          }
        }

        console.log("Month-start payment reminders sent successfully");
      } catch (error) {
        console.error("Error sending month-start payment reminders:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};

// Initialize all schedulers
export const initializeSchedulers = () => {
  console.log("Initializing notification schedulers...");

  scheduleDailyFoodEntryRemindersForSellers();
  scheduleMonthEndPaymentReminders();

  console.log("Notification schedulers initialized successfully");
  console.log(
    "- Daily food entry reminders for sellers: 9:00 AM IST (Asia/Kolkata)"
  );
  console.log(
    "- Month-start payment reminders: 10:00 AM IST (first 3 days of month)"
  );
};
