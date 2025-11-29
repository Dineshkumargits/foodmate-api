import { DataTypes, Model, Optional } from "sequelize";
import { compareSync } from "../util/encrypt";
import sequelizeConnection from "../db/connection";

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: "seller" | "consumer";
  push_token?: string;
  created_at?: Date;
}

type UserCreationAttributes = Optional<
  UserAttributes,
  "id" | "created_at" | "push_token"
>;

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public name!: string;
  public email!: string;
  public phone!: string;
  public password_hash!: string;
  public role!: "seller" | "consumer";
  public push_token?: string;
  public created_at!: Date;

  static validPassword(password: string, hash: string): boolean {
    return compareSync(password, hash);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("seller", "consumer"),
      allowNull: false,
    },
    push_token: {
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
    tableName: "users",
    timestamps: false,
    underscored: true,
  }
);

export default User;
