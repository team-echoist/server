import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Notice } from './notice.entity';
import { ProcessedHistory } from './processedHistory.entity';
import { Release } from './release.entity';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: true, unique: true })
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

  @OneToMany(() => Release, (release) => release.processor)
  releases: Release[];

  @OneToMany(() => Notice, (notice) => notice.processor)
  notice: Notice[];
}
