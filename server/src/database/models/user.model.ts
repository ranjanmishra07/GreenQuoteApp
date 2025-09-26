import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../connection';
import { RolesEnum } from '../../modules/user/dto/types';

const sequelize = getSequelize();

// Function to generate epoch-based ID with 4-character random string
function generateEpochId(): string {
  const epochTime = Math.floor(Date.now()); // Current epoch time in milliseconds
  const randomString = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4-character random string
  return `${epochTime}${randomString}`;
}

// Internal data model attributes
export interface UserAttributes {
  id: string; // Changed to string for epoch-based ID
  fullName: string;
  roleName: string;
  email: string;
  address?: string;
  passwordHash: string;
  salt: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'roleName'> {}

// Sequelize Model
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string; // Changed to string for epoch-based ID
  public fullName!: string;
  public roleName!: string;
  public email!: string;
  public address?: string;
  public passwordHash!: string;
  public salt!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: generateEpochId, // Call TypeScript function
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'full_name'
    },
    roleName: {
      type: DataTypes.STRING(255),
      defaultValue: RolesEnum.USER,
      allowNull: false,
      field: 'role_name'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    salt: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true
  }
);