import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cron_log')
export class CronLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  taskName: string;

  @CreateDateColumn({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz', nullable: true })
  endTime: Date;

  @Column({ length: 50 })
  status: string;

  @Column({ type: 'text', nullable: true })
  message: string;
}
