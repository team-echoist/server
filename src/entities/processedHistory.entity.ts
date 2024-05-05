import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReportQueue } from './reportQueue.entity';
import { ReviewQueue } from './reviewQueue.entity';

@Entity()
export class ProcessedHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  comment: string;

  @Column()
  result: string;

  @Column()
  processor: number;

  @CreateDateColumn({ name: 'processed_date' })
  processedDate: Date;

  @JoinColumn({ name: 'report_id' })
  @ManyToOne(() => ReportQueue, (report) => report.processedHistories)
  report: ReportQueue;

  @JoinColumn({ name: 'review_id' })
  @ManyToOne(() => ReviewQueue, (review) => review.processedHistories)
  review: ReviewQueue;
}
