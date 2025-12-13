import { Router } from "express";
import {
  testDailyFoodEntryReminder,
  testMonthStartPaymentReminder,
  testNotificationForUser,
  testSimpleNotification,
} from "../../controllers/notificationTest";
import requiresUser from "../../middleware/requiresUser";
import isAdmin from "../../middleware/isAdmin";

const router = Router();

// Test simple notification for current logged-in user
router.get("/test/simple", requiresUser, testSimpleNotification);

// Protect admin-only routes
router.use(requiresUser);
router.use(isAdmin);

// Test daily food entry reminders for all sellers
router.get("/test/daily-food-entry-reminder", testDailyFoodEntryReminder);

// Test month-start payment reminders
router.get("/test/month-start-payment-reminder", testMonthStartPaymentReminder);

// Test specific notification for a user
router.post("/test/notification", testNotificationForUser);

export default router;
