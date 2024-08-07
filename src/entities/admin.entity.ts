import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProcessedHistory } from './processedHistory.entity';
import { Notice } from './notice.entity';
import { UpdatedHistory } from './updatedHistory.entity';

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

  @OneToMany(() => ProcessedHistory, (processedHistory) => processedHistory.processor)
  processedHistories: ProcessedHistory[];

  @OneToMany(() => UpdatedHistory, (updatedHistory) => updatedHistory.processor)
  updatedHistories: UpdatedHistory[];

  @OneToMany(() => Notice, (notice) => notice.processor)
  notice: Notice[];
}
