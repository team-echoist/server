import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Admin } from './admin.entity';
import { ProcessedHistory } from './processedHistory.entity';
import { SeenNotice } from './seenNotice.entity';

@Entity()
export class Notice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate: Date;

  @DeleteDateColumn({
    name: 'deleted_date',
    type: 'timestamptz',
  })
  deletedDate: Date;

  @OneToMany(() => SeenNotice, (seenNotice) => seenNotice.notice)
  seenNotices: SeenNotice[];

  @JoinColumn({ name: 'admin_id' })
  @ManyToOne(() => Admin, (admin) => admin.notice, { onDelete: 'CASCADE' })
  processor: Admin;

  @OneToMany(() => ProcessedHistory, (processedHistory) => processedHistory.notice)
  processedHistories: ProcessedHistory[];
}
