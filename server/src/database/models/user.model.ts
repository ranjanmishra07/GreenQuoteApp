import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { RolesEnum } from '../../modules/user/dto/types';

// Internal data model attributes
export interface UserAttributes {
  id: string; // UUID string
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

// Function to initialize the User model with a Sequelize instance
export function initUserModel(sequelize: Sequelize): void {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
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
}