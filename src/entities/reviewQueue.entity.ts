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

@Entity()
export class ReviewQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: 'published' | 'linkedOut';

  @Column({ default: false })
  processed: boolean;

  @CreateDateColumn({ name: 'created_date' })
  createdDate: Date;

  @Column({ name: 'processed_date', nullable: true })
  processedDate: Date;

  @JoinColumn({ name: 'essay_id' })
  @ManyToOne(() => Essay, (essay) => essay.reviews)
  essay: Essay;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.reviews)
  user: User;

  @JoinColumn({ name: 'processed_histories' })
  @OneToMany(() => ProcessedHistory, (processedHistory) => processedHistory.report)
  processedHistories: ProcessedHistory[];
}
