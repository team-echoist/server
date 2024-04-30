import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { ReportQueue } from './reportQueue.entity';
import { Category } from './category.entity';
import { ReviewQueue } from './reviewQueue.entity';

@Entity()
export class Essay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  title: string;

  @Column('text')
  content: string;

  @Column({ name: 'linked_out_gauge' })
  linkedOutGauge: number;

  @Index()
  @CreateDateColumn({ name: 'create_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'update_at' })
  updatedAt: Date;

  @Column({ name: 'thumbnail', nullable: true })
  thumbnail: string;

  @Column({ default: false })
  bookmarks: boolean;

  @Column({ default: 0 })
  views: number;

  @Index()
  @Column({ default: false, name: 'is_published' })
  isPublished: boolean;

  @Column({ default: false, name: 'is_linked_out' })
  isLinkedOut: boolean;

  @Index()
  @Column({ nullable: true, name: 'device_info' })
  device: string;

  @ManyToOne(() => Category, (category) => category.essays)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Index()
  @JoinColumn({ name: 'author_id' })
  @ManyToOne(() => User, (user) => user.essays)
  author: User;

  @OneToMany(() => ReportQueue, (report) => report.reportedEssay)
  reports: ReportQueue[];

  @OneToMany(() => ReviewQueue, (review) => review.essay)
  review: ReviewQueue[];
}
