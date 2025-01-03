import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Theme } from './theme.entity';
import { User } from './user.entity';
import { UserHomeItem } from './userHomeItem.entity';

@Entity('user_home_layout')
export class UserHomeLayout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'is_active', default: false, nullable: false })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.homeLayouts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Theme, (theme) => theme.layouts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'theme_id' })
  theme: Theme;

  @UpdateDateColumn({
    name: 'updated_date',
    type: 'timestamptz',
  })
  updatedDate: Date;

  @OneToMany(() => UserHomeItem, (homeItem) => homeItem.layout)
  homeItems: UserHomeItem[];
}
