import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { ServerStatus } from '../common/types/enum.types';

@Entity()
export class Server {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ServerStatus, default: ServerStatus.OPEN })
  status: string;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate: Date;
}
