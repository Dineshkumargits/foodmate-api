import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  deleteFoodEntryService,
  getAllEntries,
  getFoodEntryByConsumerId,
  getFoodEntryById,
} from "../services/foodEntryService";
import { createEntry } from "../services/foodEntryService";

export const addFoodEntry = async (req: AuthRequest, res: Response) => {
  const { consumer_id, date, meal_type, food_name, amount } = req.body;
  if (
    !consumer_id ||
    !date ||
    !meal_type ||
    !food_name ||
    typeof amount !== "number"
  )
    return res.status(400).json({ error: "invalid input" });

  const id = await createEntry(
    req.user!.id,
    consumer_id,
    date,
    meal_type,
    food_name,
    amount
  );
  res.json({ id });
};

export const getFoodEntries = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (id) {
    const row = await getFoodEntryById(Number(id));
    res.json(row);
  } else {
    const rows = await getAllEntries();
    res.json(rows);
  }
};

export const deleteFoodEntry = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (id) {
    const row = await deleteFoodEntryService(Number(id));
    res.json(row);
  }
  res.json();
};

export const getMyEntries = async (req: AuthRequest, res: Response) => {
  const { id } = req.user;
  const rows = await getFoodEntryByConsumerId(id);
  res.json(rows);
};

export const getFoodEntriesForConsumer = async (
  req: AuthRequest,
  res: Response
) => {
  const { id } = req.params;
  const rows = await getFoodEntryByConsumerId(Number(id));
  res.json(rows);
};
