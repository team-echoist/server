import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Essay } from './essay.entity';

@Entity()
export class ReportQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reason: string;

  @Column({ default: false })
  approved: boolean;

  @Column({ default: false })
  processed: boolean;

  @Column({ name: 'processed_date', nullable: true })
  processedDate: Date;

  @CreateDateColumn({ name: 'created_date' })
  createdDate: Date;

  @JoinColumn({ name: 'reporter_id' })
  @ManyToOne(() => User, (user) => user.reports)
  reporter: User;

  @JoinColumn({ name: 'essay_id' })
  @ManyToOne(() => Essay, (essay) => essay.reports)
  essay: Essay;
}
