import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Notice } from './notice.entity';
import { User } from './user.entity';

@Entity('seen_notice')
export class SeenNotice {
  @PrimaryGeneratedColumn()
  id: number;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Notice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notice_id' })
  notice: Notice;
}
