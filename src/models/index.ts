// models/index.ts
import sequelizeConnection from "../db/connection";
import User from "./User";
import FoodEntry from "./FoodEntry";
import Payment from "./Payment";

// Import and EXECUTE associations
import "./associations";

// Sync optional (for dev only)
export { sequelizeConnection, User, FoodEntry, Payment };
