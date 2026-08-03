import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn()
  user!: User;

  @Column({ type: 'varchar' })
  fullName!: string;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', nullable: true })
  linkedinUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  githubUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  portfolioUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  professionalSummary!: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  languages!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}