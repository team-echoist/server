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
import { Bookmark } from './bookmark.entity';
import { DeactivationReason } from './deactivationReason.entity';
import { Inquiry } from './inquiry.entity';
import { AlertSettings } from './alertSettings.entity';
import { Device } from './device.entity';
import { Alert } from './alert.entity';
import { SeenNotice } from './seenNotice.entity';
import { UserStatus } from '../common/types/enum.types';
import { SeenRelease } from './seenRelease.entity';
import { UserTheme } from './userTheme.entity';
import { UserItem } from './userItem.entity';
import { UserHomeLayout } from './userHomeLayout.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ nullable: true, unique: true, default: null })
  nickname: string;

  @Index()
  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  gender: string;

  @Column({
    name: 'profile_image',
    nullable: true,
    default: 'https://cdn.linkedoutapp.com/service/profile_icon_01.png',
  })
  profileImage: string;

  @Column({ name: 'birth_date', nullable: true })
  birthDate: Date;

  @Column({ nullable: true })
  platform: string;

  @Column({ name: 'platform_id', nullable: true })
  platformId: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVATED,
    nullable: false,
  })
  status: UserStatus;

  @Column({ default: 0 })
  gems: number;

  @Column({ default: 0 })
  reputation: number;

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

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'deactivation_date',
  })
  deactivationDate: Date;

  @DeleteDateColumn({
    name: 'deleted_date',
    nullable: true,
    type: 'timestamptz',
  })
  deletedDate?: Date;

  @Column({ name: 'location_consent', default: false })
  locationConsent: boolean;

  @Column({ name: 'is_first', default: true })
  isFirst: boolean;

  @Column({ name: 'token_version', default: 1 })
  tokenVersion: number;

  @OneToMany(() => UserTheme, (userTheme) => userTheme.user)
  themes: UserTheme[];

  @OneToMany(() => UserItem, (userItem) => userItem.user)
  items: UserItem[];

  @OneToMany(() => UserHomeLayout, (layout) => layout.user)
  homeLayouts: UserHomeLayout[];

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

  @OneToMany(() => ViewRecord, (viewRecord) => viewRecord.user)
  viewRecords: ViewRecord[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks: Bookmark[];

  @OneToMany(() => DeactivationReason, (reason) => reason.user)
  deactivationReasons: DeactivationReason[];

  @OneToMany(() => Inquiry, (inquiry) => inquiry.user)
  inquiries: Inquiry[];

  @OneToMany(() => AlertSettings, (settings) => settings.user)
  alertSettings: AlertSettings[];

  @OneToMany(() => Device, (device) => device.user, { onDelete: 'SET NULL' })
  devices: Device[];

  @OneToMany(() => Alert, (alert) => alert.user)
  alerts: Alert[];

  @OneToMany(() => SeenNotice, (seenNotice) => seenNotice.user, { onDelete: 'CASCADE' })
  seenNotices: SeenNotice[];

  @OneToMany(() => SeenRelease, (seenRelease) => seenRelease.user, { onDelete: 'CASCADE' })
  seenReleases: SeenRelease[];
}
