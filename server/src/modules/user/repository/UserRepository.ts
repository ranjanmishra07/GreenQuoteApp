import * as bcrypt from 'bcrypt';
import { User } from '../../../database/models/user.model';
import { CreateUserRequest } from '../dto/api/user.dto';

export class UserRepository {
  private readonly saltRounds = 12; // Same as Keycloak default

  async findByEmail(email: string): Promise<User | null> {
    return await User.findOne({
      where: { email: email.toLowerCase() }
    });
  }

  async findById(id: string): Promise<User | null> {
    return await User.findByPk(id);
  }

  async create(data: CreateUserRequest): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate salt and hash password (Keycloak style)
    const salt = await bcrypt.genSalt(this.saltRounds);
    const passwordHash = await bcrypt.hash(data.password, salt);

    return await User.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash,
      salt
    });
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async updateLastLogin(id: string): Promise<void> {
    await User.update(
      { updatedAt: new Date() },
      { where: { id } }
    );
  }

  async findAll(): Promise<User[]> {
    return await User.findAll({
      attributes: { exclude: ['passwordHash', 'salt'] }
    });
  }

  async delete(id: string): Promise<boolean> {
    const deletedRows = await User.destroy({
      where: { id }
    });
    return deletedRows > 0;
  }
}
