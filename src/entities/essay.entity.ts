import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ReportQueue } from './reportQueue.entity';
import { Story } from './story.entity';
import { ReviewQueue } from './reviewQueue.entity';
import { ProcessedHistory } from './processedHistory.entity';
import { Tag } from './tag.entity';

export enum EssayStatus {
  PRIVATE = 'private',
  PUBLISHED = 'published',
  LINKEDOUT = 'linkedout',
}

@Entity()
export class Essay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ name: 'linked_out_gauge', nullable: false, default: 0 })
  linkedOutGauge: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  location: string;

  @CreateDateColumn({
    name: 'created_date',
    type: 'timestamptz',
  })
  createdDate: Date;

  @UpdateDateColumn({
    name: 'updated_date',
    type: 'timestamptz',
  })
  updatedDate: Date;

  @DeleteDateColumn({
    name: 'deleted_date',
    type: 'timestamptz',
  })
  deletedDate: Date;

  @Column({ name: 'thumbnail', nullable: true })
  thumbnail: string;

  @Column({ default: false })
  bookmarks: boolean;

  @Column({ default: 0 })
  views: number;

  @Index()
  @Column({
    type: 'enum',
    enum: EssayStatus,
    default: EssayStatus.PRIVATE,
  })
  status: EssayStatus;

  @Index()
  @Column({ nullable: true, name: 'device_info' })
  device: string;

  @JoinTable({ name: 'essay_tags' })
  @ManyToMany(() => Tag, (tag) => tag.essays, { onDelete: 'CASCADE' })
  tags: Tag[];

  @JoinColumn({ name: 'story_id' })
  @ManyToOne(() => Story, (category) => category.essays, { onDelete: 'CASCADE' })
  story: Story;

  @Index()
  @JoinColumn({ name: 'author_id' })
  @ManyToOne(() => User, (user) => user.essays, { onDelete: 'CASCADE' })
  author: User;

  @OneToMany(() => ReportQueue, (report) => report.essay)
  reports: ReportQueue[];

  @OneToMany(() => ReviewQueue, (review) => review.essay)
  reviews: ReviewQueue[];

  @OneToMany(() => ProcessedHistory, (processedHistory) => processedHistory.essay)
  processedHistories: ProcessedHistory[];
}
