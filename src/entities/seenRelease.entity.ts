import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from './user.entity';

@Entity()
export class SeenRelease {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.processedHistories, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn({ name: 'last_checked', type: 'timestamptz' })
  lastChecked: Date;
}
