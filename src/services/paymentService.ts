import Payment from "../models/Payment";
import { AuthRequest } from "../middleware/auth";
import { Response } from "express";

export const recordPaymentService = async ({
  req,
  res,
}: {
  req: AuthRequest;
  res: Response;
}) => {
  const { consumer_id, seller_id, date, amount, note, upi_reference } =
    req.body;
  const consumerIdNum = Number(consumer_id);
  const sellerIdNum = Number(seller_id);
  const amt = Number(amount);
  if (!consumerIdNum || !sellerIdNum || !date || isNaN(amt))
    return res.status(400).json({ error: "invalid input" });
  const payerIsConsumer =
    req.user!.role === "consumer" && req.user!.id === consumerIdNum;
  const payerIsSeller = req.user!.role === "seller";
  if (!payerIsConsumer && !payerIsSeller)
    return res.status(403).json({ error: "forbidden" });

  let receipt_url: string | null = null;
  if (req.file) {
    receipt_url = `/uploads/${req.file.filename}`;
  }

  const row = await Payment.create({
    consumer_id: consumerIdNum,
    seller_id: sellerIdNum,
    date,
    amount: amt,
    note,
    upi_reference,
    receipt_url,
  });

  res.json({ id: row.id, receipt_url });
};

export const getMyPaymentsService = async (consumer_id: number) => {
  return Payment.findAll({
    where: {
      consumer_id,
    },
    order: [["date", "DESC"]],
  });
};
