import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sync_status')
export class SyncStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'last_sync', type: 'timestamp' })
  lastSync: Date;
}
