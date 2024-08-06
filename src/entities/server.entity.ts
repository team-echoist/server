import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ServerStatus {
  OPEN = 'open',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed',
}

@Entity()
export class Server {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ServerStatus, default: ServerStatus.OPEN })
  status: string;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate: Date;
}
