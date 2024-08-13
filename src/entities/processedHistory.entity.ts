import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReportQueue } from './reportQueue.entity';
import { ReviewQueue } from './reviewQueue.entity';
import { Essay } from './essay.entity';
import { User } from './user.entity';
import { Admin } from './admin.entity';
import { Inquiry } from './inquiry.entity';
import { Notice } from './notice.entity';
import { ActionType } from '../common/types/enum.types';

@Entity('processed_history')
export class ProcessedHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  comment?: string;

  @Column()
  target: string;

  @Column({ name: 'action_type', type: 'enum', enum: ActionType })
  actionType: ActionType;

  @CreateDateColumn({ name: 'processed_date', type: 'timestamptz' })
  processedDate: Date;

  @JoinColumn({ name: 'admin_id' })
  @ManyToOne(() => Admin, (admin) => admin.processedHistories, { onDelete: 'CASCADE' })
  processor: Admin;

  @JoinColumn({ name: 'report_id' })
  @ManyToOne(() => ReportQueue, (report) => report.processedHistories, { onDelete: 'CASCADE' })
  report: ReportQueue;

  @JoinColumn({ name: 'review_id' })
  @ManyToOne(() => ReviewQueue, (review) => review.processedHistories, { onDelete: 'CASCADE' })
  review: ReviewQueue;

  @JoinColumn({ name: 'essay_id' })
  @ManyToOne(() => Essay, (essay) => essay.processedHistories, { onDelete: 'CASCADE' })
  essay: Essay;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.processedHistories, { onDelete: 'CASCADE' })
  user: User;

  @JoinColumn({ name: 'inquiry_id' })
  @ManyToOne(() => Inquiry, (inquiry) => inquiry.processedHistory, { onDelete: 'CASCADE' })
  inquiry: Inquiry;

  @JoinColumn({ name: 'notice_id' })
  @ManyToOne(() => Notice, (notice) => notice.processedHistories, { onDelete: 'CASCADE' })
  notice: Notice;
}
