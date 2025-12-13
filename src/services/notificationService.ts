import { Expo, ExpoPushMessage } from "expo-server-sdk";
import User from "../models/User";
import { getActiveDeviceTokens } from "./deviceService";

const expo = new Expo();

export const sendPushNotification = async (
  userId: number,
  title: string,
  body: string,
  data?: any,
  priority: "default" | "normal" | "high" = "high"
) => {
  try {
    // Get all active device tokens for the user
    const pushTokens = await getActiveDeviceTokens(userId);

    if (!pushTokens || pushTokens.length === 0) {
      console.log(`No active push tokens found for user ${userId}`);
      return null;
    }

    // Filter valid Expo push tokens
    const validTokens = pushTokens.filter(token => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) {
      console.error(`No valid Expo push tokens for user ${userId}`);
      return null;
    }

    // Create messages for all valid tokens with priority
    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      sound: "default",
      title,
      body,
      data: data || {},
      priority,
      channelId: priority === "high" ? "high-priority" : "default",
    }));

    console.log(`Sending ${messages.length} notifications to user ${userId}`);
    console.log(`Notification: "${title}" - "${body}"`);

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(`Sent chunk, received ${ticketChunk.length} tickets`);
        tickets.push(...ticketChunk);

        // Log any errors in tickets
        ticketChunk.forEach((ticket, index) => {
          if (ticket.status === "error") {
            console.error(`Error in ticket ${index}:`, ticket.message);
            if (ticket.details) {
              console.error("Details:", ticket.details);
            }
          }
        });
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }

    console.log(`Total tickets received: ${tickets.length}`);
    return tickets;
  } catch (error) {
    console.error("Error in sendPushNotification:", error);
    throw error;
  }
};

export const sendMealAddedNotification = async (
  consumerId: number,
  foodName: string,
  mealType: string,
  amount: number
) => {
  return sendPushNotification(
    consumerId,
    "New Meal Added",
    `${mealType}: ${foodName} - ₹${amount}`,
    {
      type: "meal_added",
      foodName,
      mealType,
      amount,
    }
  );
};

export const sendPaymentReceivedNotification = async (
  consumerId: number,
  amount: number,
  date: string
) => {
  return sendPushNotification(
    consumerId,
    "Payment Received",
    `Payment of ₹${amount} received on ${date}`,
    {
      type: "payment_received",
      amount,
      date,
    },
    "high"
  );
};

// Daily reminder for seller to add food entries
export const sendDailyFoodEntryReminderToSeller = async (sellerId: number) => {
  return sendPushNotification(
    sellerId,
    "📝 Add Today's Food Entries",
    "Don't forget to add food entries for today!",
    {
      type: "daily_food_entry_reminder",
      timestamp: new Date().toISOString(),
    },
    "high"
  );
};

// Daily reminder for consumer about food entries
export const sendDailyFoodEntryReminderToConsumer = async (
  consumerId: number
) => {
  return sendPushNotification(
    consumerId,
    "🍽️ Food Entry Update",
    "Check your today's meals and track your expenses!",
    {
      type: "daily_food_entry_check",
      timestamp: new Date().toISOString(),
    },
    "high"
  );
};

// Month-end payment reminder for seller
export const sendMonthEndPaymentReminderToSeller = async (
  sellerId: number,
  consumerName: string,
  pendingAmount: number
) => {
  return sendPushNotification(
    sellerId,
    "💰 Payment Collection Reminder",
    `Collect ₹${pendingAmount} from ${consumerName} for this month`,
    {
      type: "month_end_payment_reminder_seller",
      consumerName,
      pendingAmount,
      timestamp: new Date().toISOString(),
    },
    "high"
  );
};

// Month-end payment reminder for consumer
export const sendMonthEndPaymentReminderToConsumer = async (
  consumerId: number,
  pendingAmount: number,
  sellerName: string
) => {
  return sendPushNotification(
    consumerId,
    "💳 Payment Due Reminder",
    `You have ₹${pendingAmount} pending payment to ${sellerName} for this month`,
    {
      type: "month_end_payment_reminder_consumer",
      pendingAmount,
      sellerName,
      timestamp: new Date().toISOString(),
    },
    "high"
  );
};
