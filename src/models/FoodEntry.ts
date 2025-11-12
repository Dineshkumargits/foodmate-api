import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../db/connection";

interface FoodEntryAttributes {
  id: number;
  seller_id: number;
  consumer_id: number;
  date: Date;
  meal_type: string;
  food_name: string;
  amount: number;
  created_at?: Date;
}

type FoodEntryCreationAttributes = Optional<
  FoodEntryAttributes,
  "id" | "created_at"
>;

class FoodEntry
  extends Model<FoodEntryAttributes, FoodEntryCreationAttributes>
  implements FoodEntryAttributes
{
  public id!: number;
  public seller_id!: number;
  public consumer_id!: number;
  public date!: Date;
  public meal_type!: string;
  public food_name!: string;
  public amount!: number;
  public created_at!: Date;
}

FoodEntry.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    seller_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    consumer_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    meal_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    food_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "food_entries",
    timestamps: false,
    underscored: true,
  }
);

export default FoodEntry;
