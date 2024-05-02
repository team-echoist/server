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

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ name: 'linked_out_gauge' })
  linkedOutGauge: number;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'thumbnail', nullable: true })
  thumbnail: string;

  @Column({ default: false })
  bookmarks: boolean;

  @Column({ default: 0 })
  views: number;

  @Index()
  @Column({ default: false })
  published: boolean;

  @Column({ default: false, name: 'linked_out' })
  linkedOut: boolean;

  @Index()
  @Column({ nullable: true, name: 'device_info' })
  device: string;

  @JoinColumn({ name: 'category_id' })
  @ManyToOne(() => Category, (category) => category.essays)
  category: Category;

  @Index()
  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.essays)
  author: User;

  @OneToMany(() => ReportQueue, (report) => report.essay)
  reports: ReportQueue[];

  @OneToMany(() => ReviewQueue, (review) => review.essay)
  review: ReviewQueue[];
}
