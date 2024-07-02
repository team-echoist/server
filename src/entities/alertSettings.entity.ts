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

  @Column({ name: 'time_allowed', default: false })
  timeAllowed: boolean;

  @Column({ name: 'alert_start', type: 'time', nullable: true, default: null })
  alertStart: string;

  @Column({ name: 'alert_end', type: 'time', nullable: true, default: null })
  alertEnd: string;

  @Index()
  @Column({ name: 'device_id', nullable: true, unique: true })
  deviceId: string;

  @OneToOne(() => User, (user) => user.alertSettings)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
