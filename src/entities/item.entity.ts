import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Theme } from './theme.entity';
import { UserHomeItem } from './userHomeItem.entity';
import { UserItem } from './userItem.entity';

@Entity()
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  position: string;

  @Column()
  price: number;

  @Column({ nullable: true })
  url: string;

  @ManyToOne(() => Theme, (theme) => theme.items)
  @JoinColumn({ name: 'theme_id' })
  theme: Theme;

  @OneToMany(() => UserItem, (userItem) => userItem.item)
  userItems: UserItem[];

  @OneToMany(() => UserHomeItem, (homeItem) => homeItem.item)
  homeItems: UserHomeItem[];
}
