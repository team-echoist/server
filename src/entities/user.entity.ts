import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Essay } from './essay.entity';
import { Subscription } from './subscription.entity';
import { ReportQueue } from './reportQueue.entity';
import { Category } from './category.entity';
import { ReviewQueue } from './reviewQueue.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, unique: true, default: null })
  nickname: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ name: 'birth_date', nullable: true })
  birthDate: Date;

  @Column({ name: 'oauth_info', type: 'jsonb', nullable: true })
  oauthInfo: {
    google: string;
    kakao: string;
    naver: string;
    apple: string;
  };

  @Column({ default: 'client' })
  role: string;

  @Column({ default: false })
  banned: boolean;

  @Column({ name: 'subscription_end', type: 'timestamp', nullable: true })
  subscriptionEnd: Date;

  @CreateDateColumn({ name: 'created_date', type: 'timestamp' })
  createdDate: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamp' })
  updatedDate: Date;

  @DeleteDateColumn({ name: 'deleted_date', type: 'timestamp' })
  deletedDate?: Date;

  @OneToMany(() => Category, (category) => category.user)
  category: Category[];

  @OneToMany(() => Essay, (essay) => essay.author)
  essays: Essay[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => ReportQueue, (report) => report.reporter)
  reports: ReportQueue[];

  @OneToMany(() => ReviewQueue, (review) => review.user)
  review: ReviewQueue[];
}
