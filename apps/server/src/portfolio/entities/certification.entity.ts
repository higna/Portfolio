import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('certifications')
export class Certification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  issuer!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', nullable: true })
  url!: string | null;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}