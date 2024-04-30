import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Essay } from './essay.entity';
import { User } from './user.entity';

@Entity()
export class ReviewQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Essay, (essay) => essay.review)
  @JoinColumn({ name: 'essay_id' })
  essay: Essay;

  @ManyToOne(() => User, (user) => user.review)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: false })
  approved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  reviewerComment: string;
}
