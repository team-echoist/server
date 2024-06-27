import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admin } from './admin.entity';

@Entity('updated_history')
export class UpdatedHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  history: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate: Date;

  @JoinColumn({ name: 'admin_id' })
  @ManyToOne(() => Admin, (admin) => admin.updatedHistories)
  processor: Admin;
}
