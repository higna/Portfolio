import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('educations')
export class Education {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  degree!: string;

  @Column({ type: 'varchar' })
  institution!: string;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ type: 'varchar', nullable: true })
  grade!: string | null;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}