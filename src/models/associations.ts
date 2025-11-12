import User from "./User";
import FoodEntry from "./FoodEntry";
import Payment from "./Payment";

// FoodEntry relations
FoodEntry.belongsTo(User, { foreignKey: "seller_id", as: "Seller" });
FoodEntry.belongsTo(User, { foreignKey: "consumer_id", as: "Consumer" });

// Payment relations
Payment.belongsTo(User, { foreignKey: "seller_id", as: "Seller" });
Payment.belongsTo(User, { foreignKey: "consumer_id", as: "Consumer" });

// Reverse associations
User.hasMany(FoodEntry, { foreignKey: "seller_id", as: "FoodEntriesSold" });
User.hasMany(FoodEntry, { foreignKey: "consumer_id", as: "FoodEntriesBought" });
User.hasMany(Payment, { foreignKey: "seller_id", as: "PaymentsReceived" });
User.hasMany(Payment, { foreignKey: "consumer_id", as: "PaymentsMade" });

export { User, FoodEntry, Payment };
