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
import { KSTTransformer } from '../common/utils';

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

  @CreateDateColumn({ name: 'processed_date', type: 'timestamptz', transformer: KSTTransformer })
  processedDate: Date;

  @JoinColumn({ name: 'report_id' })
  @ManyToOne(() => ReportQueue, (report) => report.processedHistories)
  report: ReportQueue;

  @JoinColumn({ name: 'review_id' })
  @ManyToOne(() => ReviewQueue, (review) => review.processedHistories)
  review: ReviewQueue;
}
