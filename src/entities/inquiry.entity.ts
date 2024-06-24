import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ProcessedHistory } from './processedHistory.entity';

@Entity()
export class Inquiry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contents: string;

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
  @OneToOne(() => ProcessedHistory, (processedHistory) => processedHistory.inquiry)
  processedHistory: ProcessedHistory;
}
