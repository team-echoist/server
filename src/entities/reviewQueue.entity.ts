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

  @Column({ name: 'reviewer_comment', nullable: true })
  reviewerComment: string;

  @Column()
  type: 'published' | 'linked_out';

  @Column({ default: false })
  approved: boolean;

  @Column({ default: false })
  completed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @JoinColumn({ name: 'essay_id' })
  @ManyToOne(() => Essay, (essay) => essay.review)
  essay: Essay;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.review)
  user: User;
}
