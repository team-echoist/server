import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProcessedHistory } from './processedHistory.entity';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({ default: false, nullable: false })
  activated: boolean;

  @Column({ nullable: true })
  info: string;

  @Column({ name: 'profile_image', nullable: true })
  profileImage: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate: Date;

  @JoinColumn({ name: 'processed_histories' })
  @OneToMany(() => ProcessedHistory, (processedHistory) => processedHistory.processor)
  processedHistories: ProcessedHistory;
}
