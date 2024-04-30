import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Column,
} from 'typeorm';
import { ReviewQueue } from './reviewQueue.entity';
import { ReportQueue } from './reportQueue.entity';

@Entity()
export class ProcessingHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn({ name: 'review_queue_id' })
  @ManyToOne(() => ReviewQueue, { nullable: true })
  reviewQueue: ReviewQueue;

  @JoinColumn({ name: 'report_queue_id' })
  @ManyToOne(() => ReportQueue, { nullable: true })
  reportQueue: ReportQueue;

  @Column()
  actionType: 'review' | 'report';

  @Column()
  approved: boolean;

  @CreateDateColumn({ name: 'action_data' })
  actionDate: Date;

  @Column({ nullable: true })
  comments: string;
}
