import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AppType } from '../common/types/enum.types';

@Entity('app_versions')
export class AppVersions {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: AppType,
    name: 'app_type',
  })
  appType: AppType;

  @Column({ default: '0.0.0' })
  version: string;

  @Column({ name: 'release_date', type: 'timestamptz' })
  releaseDate: Date;

  @CreateDateColumn({
    name: 'created_date',
    type: 'timestamptz',
  })
  createdDate: Date;

  @UpdateDateColumn({
    name: 'updated_date',
    type: 'timestamptz',
  })
  updatedDate: Date;
}
