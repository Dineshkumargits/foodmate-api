import { Expo, ExpoPushMessage } from "expo-server-sdk";
import User from "../models/User";
import { getActiveDeviceTokens } from "./deviceService";

const expo = new Expo();

export const sendPushNotification = async (
  userId: number,
  title: string,
  body: string,
  data?: any
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

    // Create messages for all valid tokens
    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      sound: "default",
      title,
      body,
      data: data || {},
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }

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
    }
  );
};
