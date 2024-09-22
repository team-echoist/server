import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Theme } from './theme.entity';
import { UserHomeItem } from './userHomeItem.entity';

@Entity('user_home_layout')
export class UserHomeLayout {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.homeLayouts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Theme, (theme) => theme.layouts)
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
