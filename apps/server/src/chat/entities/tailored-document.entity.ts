import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type TailoredDocumentKind = 'cv' | 'cover-letter';

@Entity('tailored_documents')
@Index('IDX_tailored_documents_user_updated', ['userId', 'updatedAt'])
export class TailoredDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 24 })
  kind!: TailoredDocumentKind;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 160 })
  candidateName!: string;

  @Column({ type: 'text' })
  jobDescription!: string;

  @Column({ type: 'varchar', length: 24, nullable: true })
  template!: string | null;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
