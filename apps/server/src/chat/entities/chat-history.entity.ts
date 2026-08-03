import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('chat_history')
export class ChatHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Column({ type: 'text' })
  userMessage!: string;

  @Column({ type: 'text' })
  aiResponse!: string;

  @Column({ type: 'varchar' })
  conversationId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}