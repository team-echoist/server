import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admin } from './admin.entity';
import { ProcessedHistory } from './processedHistory.entity';

@Entity()
export class Release {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate: Date;

  @JoinColumn({ name: 'admin_id' })
  @ManyToOne(() => Admin, (admin) => admin.releases, { onDelete: 'CASCADE' })
  processor: Admin;

  @OneToMany(() => ProcessedHistory, (processedHistory) => processedHistory.release)
  processedHistories: ProcessedHistory[];
}
