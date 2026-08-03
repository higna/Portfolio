import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  USER = 'USER',
  SUPERADMIN = 'SUPERADMIN',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  password!: string | null;


  @Column({ type: 'varchar', nullable: true })
  fullName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  picture!: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  googleId!: string | null;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  authProvider!: AuthProvider;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  verificationToken!: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  passwordResetToken!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpires!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}