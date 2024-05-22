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

export enum ActionType {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING = 'pending',
  UPDATED = 'updated',
  DELETED = 'deleted',
  UNPUBLISHED = 'unpublished',
  UNLINKEDOUT = 'unlinkedout',
  PUBLISHED = 'published',
  LINKEDOUT = 'linkedout',
  BANNED = 'banned',
  MONITORED = 'monitored',
}

@Entity()
export class ProcessedHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  comment?: string;

  @Column()
  target: string;

  @Column({ name: 'action_type', type: 'enum', enum: ActionType })
  actionType: ActionType;

  @Column()
  processor: number;

  @CreateDateColumn({ name: 'processed_date', type: 'timestamptz' })
  processedDate: Date;

  @JoinColumn({ name: 'report_id' })
  @ManyToOne(() => ReportQueue, (report) => report.processedHistories)
  report: ReportQueue;

  @JoinColumn({ name: 'review_id' })
  @ManyToOne(() => ReviewQueue, (review) => review.processedHistories)
  review: ReviewQueue;

  @JoinColumn({ name: 'essay_id' })
  @ManyToOne(() => Essay, (essay) => essay.processedHistories)
  essay: Essay;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.processedHistories)
  user: User;
}
