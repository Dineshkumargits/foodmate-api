import { col, fn, Op, Sequelize } from "sequelize";
import FoodEntry from "../models/FoodEntry";
import Payment from "../models/Payment";

export const getConsumerReportService = async (
  consumerId: number,
  month?: string
) => {
  const whereClause: any = { consumer_id: consumerId };

  if (month) {
    // month in format YYYY-MM
    const startDate = `${month}-01`;
    const endDate = new Date(
      new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)
    );
    whereClause.date = {
      [Op.gte]: startDate,
      [Op.lt]: endDate.toISOString().slice(0, 10), // YYYY-MM-DD
    };
  }

  // Fetch entries
  const entries = await FoodEntry.findAll({
    where: whereClause,
    order: [["date", "ASC"]],
  });

  // Calculate totalDue
  const totalDue = entries.reduce((sum, e) => sum + Number(e.amount), 0);

  // Fetch payments
  const payments = await Payment.findAll({
    where: whereClause,
    order: [["date", "ASC"]],
  });

  // Calculate totalPaid
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    totalDue,
    totalPaid,
    entries,
    payments,
    balance: totalDue - totalPaid,
  };
};

export const getDashboardDataService = async () => {
  // 1️⃣ Total revenue (sum of all food_entries.amount)
  const totalRevenueResult: any = await FoodEntry.findOne({
    attributes: [[fn("IFNULL", fn("SUM", col("amount")), 0), "totalRevenue"]],
    raw: true,
  });
  const totalRevenue = Number(totalRevenueResult?.totalRevenue ?? 0);

  // 2️⃣ Total amount paid (sum of all payments.amount)
  const amountPaidResult: any = await Payment.findOne({
    attributes: [[fn("IFNULL", fn("SUM", col("amount")), 0), "amountPaid"]],
    raw: true,
  });
  const amountPaid = Number(amountPaidResult?.amountPaid ?? 0);

  // 3️⃣ Today's food items (created today, local time)
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const todayEntries = await FoodEntry.findAll({
    where: {
      created_at: {
        [Op.gte]: startOfDay,
        [Op.lt]: endOfDay,
      },
    },
    attributes: ["food_name"],
    raw: true,
  });

  const todayFoodItems = todayEntries.map(f => f.food_name).join(", ") || null;

  return {
    totalRevenue,
    amountPaid,
    pendingBalance: totalRevenue - amountPaid,
    todayFoodItems,
  };
};
