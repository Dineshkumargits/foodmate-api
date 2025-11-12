import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../db/connection";

interface PaymentAttributes {
  id: number;
  consumer_id: number;
  seller_id: number;
  date: Date;
  amount: number;
  note?: string;
  upi_reference?: string;
  receipt_url?: string;
  created_at?: Date;
}

type PaymentCreationAttributes = Optional<
  PaymentAttributes,
  "id" | "note" | "upi_reference" | "receipt_url" | "created_at"
>;

class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: number;
  public consumer_id!: number;
  public seller_id!: number;
  public date!: Date;
  public amount!: number;
  public note?: string;
  public upi_reference?: string;
  public receipt_url?: string;
  public created_at!: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    consumer_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    seller_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    upi_reference: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    receipt_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "payments",
    timestamps: false,
    underscored: true,
  }
);

export default Payment;
