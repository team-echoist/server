import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AppType {
  ANDROID_MOBILE = 'android_mobile',
  ANDROID_TABLET = 'android_tablet',
  IOS_MOBILE = 'ios_mobile',
  IOS_TABLET = 'ios_tablet',
  DESCKTOP_MAC = 'desktop_mac',
  DESCKTOP_WINDOWS = 'desktop_windows',
}

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
