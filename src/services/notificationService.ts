import { Expo, ExpoPushMessage } from "expo-server-sdk";
import User from "../models/User";
import { getActiveDeviceTokens, deactivateDeviceToken } from "./deviceService";

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
    const ticketToTokenMap: Record<string, string> = {};

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(`Sent chunk, received ${ticketChunk.length} tickets`);
        tickets.push(...ticketChunk);

        // Map tickets to their tokens
        ticketChunk.forEach((ticket, index) => {
          if (ticket.status === "ok" && ticket.id) {
            const msg = chunk[index];
            if (typeof msg.to === "string") {
              ticketToTokenMap[ticket.id] = msg.to;
            }
          }
        });

        // Log ticket status
        ticketChunk.forEach((ticket, index) => {
          if (ticket.status === "ok") {
            console.log(
              `✓ Ticket ${index}: OK - Notification queued for delivery`
            );
          } else if (ticket.status === "error") {
            console.error(`✗ Ticket ${index}: ERROR - ${ticket.message}`);
            if (ticket.details) {
              console.error("Details:", ticket.details);
            }
          }
        });
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }

    const receiptIds = tickets.filter(t => t.id).map(t => t.id);

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

        for (const [id, receipt] of Object.entries(receipts)) {
          if (receipt.status === "error") {
            console.error("❌ Push delivery failed:", receipt.message);

            if (receipt.details?.error === "DeviceNotRegistered") {
              console.error("🧹 Removing invalid token");
              const token = ticketToTokenMap[id];
              if (token) {
                await deactivateDeviceToken(token);
                console.log(`✓ Deactivated invalid token: ${token}`);
              }
            }

            if (receipt.details?.error === "InvalidCredentials") {
              console.error("🔥 FCM credentials are invalid");
              // STOP SENDING — FIX CREDENTIALS
            }
          }
        }
      } catch (err) {
        console.error("Error fetching receipts:", err);
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
