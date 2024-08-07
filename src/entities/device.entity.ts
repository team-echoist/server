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

export enum DeviceOS {
  WINDOW = 'Window',
  MAC = 'Mac',
  ANDROID = 'Android',
  IOS = 'iOS',
  LINUX = 'Linux',
  UNKNOWN = 'Unknown',
}

export enum DeviceType {
  DESKTOP = 'Desktop',
  LAPTOP = 'Laptop',
  MOBILE = 'Mobile',
  TABLET = 'Tablet',
  UNKNOWN = 'Unknown',
}

@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'device_id', nullable: true, unique: true })
  deviceId: string;

  @Column({ name: 'device_token', nullable: true })
  deviceToken: string;

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
}
