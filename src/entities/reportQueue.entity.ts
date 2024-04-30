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

  @Column('text')
  reason: string;

  @Column({ default: false })
  approved: boolean;

  @CreateDateColumn({ name: 'reported_at' })
  reportedAt: Date;

  @JoinColumn({ name: 'reporter_id' })
  @ManyToOne(() => User, (user) => user.reports)
  reporter: User;

  @JoinColumn({ name: 'reported_essay_id' })
  @ManyToOne(() => Essay, (essay) => essay.reports)
  reportedEssay: Essay;
}
