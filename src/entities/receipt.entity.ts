import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Receipt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  platform: string;

  @Column({ name: 'payment_id' })
  paymentId: number;

  @Column()
  purchase_date: Date;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.receipts)
  user: User;
}
