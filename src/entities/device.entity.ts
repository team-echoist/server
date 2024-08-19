import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Essay } from './essay.entity';
import { AlertSettings } from './alertSettings.entity';
import { DeviceOS, DeviceType } from '../common/types/enum.types';

@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ nullable: true, unique: false })
  uid: string;

  @Column({ name: 'fcm_token', nullable: true })
  fcmToken: string;

  @Column({
    type: 'enum',
    enum: DeviceOS,
    default: DeviceOS.UNKNOWN,
  })
  os: DeviceOS;

  @Column({
    type: 'enum',
    enum: DeviceType,
    default: DeviceType.UNKNOWN,
  })
  type: DeviceType;

  @Column({ default: null })
  model: string;

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

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.devices, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Essay, (essay) => essay.device)
  essays: Essay[];

  @OneToMany(() => AlertSettings, (alertSettings) => alertSettings.device)
  alertSettings: AlertSettings[];
}
