import { DataTypes, Model, Optional } from "sequelize";
import { getSequelize } from "../connection";

const sequelize = getSequelize();

// Function to generate epoch-based ID with 4-character random string
function generateEpochId(): string {
  const epochTime = Math.floor(Date.now()); // Current epoch time in milliseconds
  const randomString = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4-character random string
  return `${epochTime}${randomString}`;
}

export interface QuoteAttributes {
  id: string;
  userId: string;
  systemSizeKw: number;
  monthlyConsumptionKwh: number;
  downPayment: number;
  currency: string;
  systemPrice: number;
  principalAmount: number;
  riskBand: 'A' | 'B' | 'C';
  baseApr: number;
  offers: any; // JSON field for pricing offers
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteCreationAttributes extends Optional<QuoteAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Quote extends Model<QuoteAttributes, QuoteCreationAttributes> implements QuoteAttributes {
  public id!: string;
  public userId!: string;
  public systemSizeKw!: number;
  public monthlyConsumptionKwh!: number;
  public downPayment!: number;
  public currency!: string;
  public systemPrice!: number;
  public principalAmount!: number;
  public riskBand!: 'A' | 'B' | 'C';
  public baseApr!: number;
  public offers!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Quote.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: generateEpochId,
    allowNull: false
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    field: "user_id",
  },
  systemSizeKw: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: "system_size_kw"
  },
  monthlyConsumptionKwh: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: "monthly_consumption_kwh"
  },
  downPayment: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: "down_payment"
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  systemPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: "system_price"
  },
  principalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: "principal_amount"
  },
  riskBand: {
    type: DataTypes.ENUM('A', 'B', 'C'),
    allowNull: false,
    field: "risk_band"
  },
  baseApr: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: "base_apr"
  },
  offers: {
    type: DataTypes.JSON,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Quote',
  tableName: 'quotes',
  timestamps: true,
  underscored: true
});