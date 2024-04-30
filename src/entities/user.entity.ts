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
import { Receipt } from './receipt.entity';
import { ReportQueue } from './reportQueue.entity';
import { Category } from './category.entity';
import { ReviewQueue } from './reviewQueue.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

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
  black: boolean;

  @Column({ name: 'subscription_end', type: 'timestamp', nullable: true })
  subscriptionEnd: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt?: Date;

  @OneToMany(() => Category, (category) => category.user)
  category: Category[];

  @OneToMany(() => Essay, (essay) => essay.author)
  essays: Essay[];

  @OneToMany(() => Receipt, (receipt) => receipt.user)
  receipts: Receipt[];

  @OneToMany(() => ReportQueue, (report) => report.reporter)
  reports: ReportQueue[];

  @OneToMany(() => ReviewQueue, (review) => review.user)
  review: ReviewQueue[];
}
