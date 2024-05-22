import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Essay } from './essay.entity';
import { User } from './user.entity';
import { ProcessedHistory } from './processedHistory.entity';

export enum ReviewQueueType {
  LINKEDOUT = 'linkedout',
  PUBLISHED = 'published',
}

@Entity()
export class ReviewQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ReviewQueueType,
  })
  type: ReviewQueueType;

  @Column({ default: false })
  processed: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;

  @Column({
    name: 'processed_date',
    nullable: true,
    type: 'timestamptz',
  })
  processedDate: Date;

  @JoinColumn({ name: 'essay_id' })
  @ManyToOne(() => Essay, (essay) => essay.reviews, { onDelete: 'CASCADE' })
  essay: Essay;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  user: User;

  @JoinColumn({ name: 'processed_histories' })
  @OneToMany(() => ProcessedHistory, (processedHistory) => processedHistory.report)
  processedHistories: ProcessedHistory[];
}
