import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, Index, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Device } from './device.entity';

@Entity('alert_settings')
export class AlertSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  viewed: boolean;

  @Column({ default: false })
  report: boolean;

  @Column({ default: false })
  marketing: boolean;

  @Index()
  @ManyToOne(() => Device, (device) => device.alertSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @ManyToOne(() => User, (user) => user.alertSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
