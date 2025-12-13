import { Router } from "express";
import {
  testDailyFoodEntryReminder,
  testMonthStartPaymentReminder,
  testNotificationForUser,
} from "../../controllers/notificationTest";
import requiresUser from "../../middleware/requiresUser";
import isAdmin from "../../middleware/isAdmin";

const router = Router();

// Protect these routes - only admins should be able to test notifications
router.use(requiresUser);
router.use(isAdmin);

// Test daily food entry reminders for all sellers
router.get("/test/daily-food-entry-reminder", testDailyFoodEntryReminder);

// Test month-start payment reminders
router.get("/test/month-start-payment-reminder", testMonthStartPaymentReminder);

// Test specific notification for a user
router.post("/test/notification", testNotificationForUser);

export default router;
