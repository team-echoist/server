import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ProcessedHistory } from './processedHistory.entity';

@Entity()
export class Inquiry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ nullable: true })
  answer: string;

  @Index()
  @Column({ default: false })
  processed: boolean;

  @Column({
    name: 'processed_date',
    nullable: true,
    type: 'timestamptz',
  })
  processedDate: Date;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.inquiries, { onDelete: 'CASCADE' })
  user: User;

  @JoinColumn({ name: 'processed_history_id' })
  @OneToMany(() => ProcessedHistory, (processedHistory) => processedHistory.inquiry)
  processedHistory: ProcessedHistory;
}
