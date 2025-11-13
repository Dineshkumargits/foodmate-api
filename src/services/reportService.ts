import { col, fn, Op, Sequelize } from "sequelize";
import FoodEntry from "../models/FoodEntry";
import Payment from "../models/Payment";
import { User } from "../models";

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

export const getMonthlySummaryService = async ({
  consumerId,
  monthNum,
  monthName,
}: {
  consumerId: number;
  monthNum: number;
  monthName: string;
}) => {
  const year = new Date().getFullYear();
  const consumerFilter = consumerId ? { consumerId } : {};

  const foodStats = await FoodEntry.findOne({
    where: {
      ...consumerFilter,
      [Op.and]: [
        Sequelize.where(fn("MONTH", col("date")), monthNum),
        Sequelize.where(fn("YEAR", col("date")), year),
      ],
    },
    attributes: [
      [fn("SUM", col("amount")), "totalRevenue"],
      [fn("COUNT", col("id")), "totalItems"],
    ],
    raw: true,
  });

  const totalRevenue = Number((foodStats as any)?.totalRevenue || 0);
  const totalItems = Number((foodStats as any)?.totalItems || 0);

  const paymentStats = await Payment.findOne({
    where: {
      ...consumerFilter,
      [Op.and]: [
        Sequelize.where(fn("MONTH", col("date")), monthNum),
        Sequelize.where(fn("YEAR", col("date")), year),
      ],
    },
    attributes: [[fn("SUM", col("amount")), "totalPaid"]],
    raw: true,
  });

  const totalPaid = Number((paymentStats as any)?.totalPaid || 0);

  let breakdown: any[] = [];

  if (!consumerId) {
    breakdown = await FoodEntry.findAll({
      where: {
        [Op.and]: [
          Sequelize.where(fn("MONTH", col("date")), monthNum),
          Sequelize.where(fn("YEAR", col("date")), year),
        ],
      },
      include: [{ model: User, as: "Consumer", attributes: ["id", "name"] }],
      attributes: [
        "Consumer.id" as "consumerId",
        [fn("SUM", col("amount")), "totalRevenue"],
      ],
      group: ["Consumer.id" as "consumerId", "Consumer.id"],
      raw: true,
    });
    breakdown = breakdown?.map(b => ({
      ...b,
      consumerId: b["Consumer.id"],
      consumerName: b["Consumer.name"],
    }));
  }
  const pendingAmount = totalRevenue - totalPaid;
  const avgPerItem = totalItems > 0 ? totalRevenue / totalItems : 0;
  const collectionRate =
    totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

  const displayMonth = `${monthName.charAt(0).toUpperCase()}${monthName
    .slice(1)
    .toLowerCase()} ${year}`;

  return {
    month: displayMonth,
    consumerId,
    totalRevenue,
    totalPaid,
    pendingAmount,
    totalItems,
    avgPerItem,
    collectionRate,
    breakdown: consumerId ? null : breakdown,
    stats: [
      {
        label: "Total Revenue",
        value: totalRevenue,
        color: "#22c55e",
        bg: "#dcfce7",
        isAmount: true,
      },
      {
        label: "Collected",
        value: totalPaid,
        color: "#3b82f6",
        bg: "#dbeafe",
        isAmount: true,
      },
      {
        label: "Pending",
        value: pendingAmount,
        color: "#f97316",
        bg: "#fed7aa",
        isAmount: true,
      },
      {
        label: "Total Items",
        value: totalItems,
        color: "#a855f7",
        bg: "#f3e8ff",
      },
    ],
  };
};
