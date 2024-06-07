import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Essay } from './essay.entity';
import { Subscription } from './subscription.entity';
import { ReportQueue } from './reportQueue.entity';
import { Story } from './story.entity';
import { ReviewQueue } from './reviewQueue.entity';
import { ProcessedHistory } from './processedHistory.entity';
import { Follow } from './follow.entity';
import { Badge } from './badge.entity';
import { TagExp } from './tagExp.entity';
import { ViewRecord } from './viewRecord.entity';

export enum UserStatus {
  ACTIVE = 'active',
  MONITORED = 'monitored',
  BANNED = 'banned',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, unique: true, default: null })
  nickname: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ name: 'profile_image', nullable: true })
  profileImage: string;

  @Column({ name: 'birth_date', nullable: true })
  birthDate: Date;

  @Column({ name: 'oauth_info', type: 'jsonb', nullable: true })
  oauthInfo: {
    google: string;
    kakao: string;
    naver: string;
    apple: string;
  };

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({
    name: 'subscription_end',
    nullable: true,
    type: 'timestamptz',
  })
  subscriptionEnd: Date;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate: Date;

  @DeleteDateColumn({
    name: 'deleted_date',
    nullable: true,
    type: 'timestamptz',
  })
  deletedDate?: Date;

  @OneToMany(() => Story, (story) => story.user)
  stories: Story[];

  @OneToMany(() => Essay, (essay) => essay.author)
  essays: Essay[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => ReportQueue, (report) => report.reporter)
  reports: ReportQueue[];

  @OneToMany(() => ReviewQueue, (review) => review.user)
  reviews: ReviewQueue[];

  @OneToMany(() => ProcessedHistory, (processedHistory) => processedHistory.user)
  processedHistories: ProcessedHistory[];

  @OneToMany(() => Badge, (Badge) => Badge.user)
  badges: Badge[];

  @OneToMany(() => TagExp, (tagExp) => tagExp.user)
  tagExps: TagExp[];

  @OneToMany(() => ViewRecord, (essayView) => essayView.user)
  essayViewRecords: ViewRecord[];
}
