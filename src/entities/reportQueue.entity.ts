import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Essay } from './essay.entity';
import { ProcessedHistory } from './processedHistory.entity';

@Entity('report_queue')
export class ReportQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reason: string;

  @Index()
  @Column({ default: false })
  processed: boolean;

  @Column({
    name: 'processed_date',
    nullable: true,
    type: 'timestamptz',
  })
  processedDate: Date;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;

  @JoinColumn({ name: 'reporter_id' })
  @ManyToOne(() => User, (user) => user.reports, { onDelete: 'CASCADE' })
  reporter: User;

  @JoinColumn({ name: 'essay_id' })
  @ManyToOne(() => Essay, (essay) => essay.reports)
  essay: Essay;

  @OneToMany(() => ProcessedHistory, (processedHistory) => processedHistory.report)
  processedHistories: ProcessedHistory[];
}
