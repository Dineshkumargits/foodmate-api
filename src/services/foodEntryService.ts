import FoodEntry from "../models/FoodEntry";

export const createEntry = async (
  seller_id: number,
  consumer_id: number,
  date: string,
  meal_type: string,
  food_name: string,
  amount: number
) => {
  const entry = await FoodEntry.create({
    seller_id,
    consumer_id,
    date: new Date(date),
    meal_type,
    food_name,
    amount,
  });

  return Number(entry.id);
};

export const getAllEntries = () => {
  return FoodEntry.findAll({
    order: [["date", "DESC"]],
  });
};

export const getFoodEntryById = (id: number) => {
  return FoodEntry.findByPk(id);
};

export const deleteFoodEntryService = (id: number) => {
  return FoodEntry.destroy({ where: { id } });
};

export const getFoodEntryByConsumerId = (consumerId: number) => {
  return FoodEntry.findAll({
    where: {
      consumer_id: consumerId,
    },
    raw: true,
    order: [["date", "DESC"]],
  });
};
