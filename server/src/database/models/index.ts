import { getSequelize } from "../connection";
import { logger } from "../../logger";
import { User } from "./user.model";
import { Quote } from "./quote.model";

// Initialize sequelize connection for models
getSequelize();

// Define associations
export function initAssociations() {
  // User has many Quotes
  User.hasMany(Quote, {
    foreignKey: "userId",
    as: "quotes",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });
  
  // Quote belongs to User
  Quote.belongsTo(User, {
    foreignKey: "userId",
    as: "author",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });
}

// Initialize all models and associations
export async function initModels() {
  try {
    // Initialize associations first
    initAssociations();
    
    // Sync all models with database
    await User.sync({ alter: true }); // alter: true for development
    await Quote.sync({ alter: true }); // alter: true for development
    
    logger.info("✅ Database models initialized successfully");
  } catch (error) {
    logger.error("❌ Error initializing database models:", { error });
    throw error;
  }
}

// Export models for use in other parts of the application
export { User, Quote };