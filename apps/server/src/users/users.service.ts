import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User, UserRole, AuthProvider } from './entities/user.entity';

interface CreateUserInput {
  email: string;
  password?: string | null;
  fullName?: string | null;
  googleId?: string | null;
  picture?: string | null;
  authProvider?: AuthProvider;
  isVerified?: boolean;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) { }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { verificationToken: token } });
  }

  findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { passwordResetToken: token } });
  }

  findUnverifiedBefore(date: Date): Promise<User[]> {
    return this.usersRepository.find({
      where: {
        isVerified: false,
        createdAt: LessThan(date),
      },
    });
  }

  create(input: CreateUserInput): Promise<User> {
    const user = this.usersRepository.create(input);
    return this.usersRepository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, attrs: Partial<User>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    Object.assign(user, attrs);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    return this.usersRepository.remove(user);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.usersRepository.update(id, { password: hashedPassword });
  }

  async deleteUser(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
