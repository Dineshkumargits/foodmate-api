import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../db/connection";

interface DeviceAttributes {
  id: number;
  user_id: number;
  push_token: string;
  platform: "ios" | "android";
  model?: string;
  os_version?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

type DeviceCreationAttributes = Optional<
  DeviceAttributes,
  "id" | "created_at" | "updated_at" | "model" | "os_version" | "is_active"
>;

class Device
  extends Model<DeviceAttributes, DeviceCreationAttributes>
  implements DeviceAttributes
{
  public id!: number;
  public user_id!: number;
  public push_token!: string;
  public platform!: "ios" | "android";
  public model?: string;
  public os_version?: string;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

Device.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    push_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    platform: {
      type: DataTypes.ENUM("ios", "android"),
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    os_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "devices",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Device;
