import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum AlertType {
  PUBLISHED = 'published',
  LINKEDOUT = 'linkedout',
  REPORT = 'report',
}

@Entity()
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  content: string;

  @Column({ nullable: true })
  body: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;

  @Column({
    type: 'enum',
    enum: AlertType,
    nullable: true,
  })
  type: AlertType;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.alerts, { onDelete: 'CASCADE' })
  user: User;
}
