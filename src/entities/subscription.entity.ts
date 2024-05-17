import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { KSTTransformer } from '../common/utils';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'billing_cycle' })
  billingCycle: 'monthly' | 'yearly';

  // todo 테스트중. 프로덕션에선 널 안됨
  @Column({ name: 'payment_details', type: 'json', nullable: true })
  paymentDetails: any;

  @CreateDateColumn({
    name: 'created_date',
    type: 'timestamptz',
    transformer: KSTTransformer,
  })
  createdDate: Date;

  @UpdateDateColumn({
    name: 'updated_date',
    type: 'timestamptz',
    transformer: KSTTransformer,
  })
  updatedDate: Date;

  @UpdateDateColumn({
    name: 'end_date',
    type: 'timestamptz',
    transformer: KSTTransformer,
  })
  endDate: Date;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.subscriptions)
  user: User;
}
