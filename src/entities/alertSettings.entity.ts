import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

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
  @Column({ name: 'device_id', unique: false })
  deviceId: string;

  @OneToOne(() => User, (user) => user.alertSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
