import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Item } from './item.entity';
import { UserHomeLayout } from './userHomeLayout.entity';

@Entity('user_home_item')
export class UserHomeItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserHomeLayout, (layout) => layout.homeItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_home_layout_id' })
  layout: UserHomeLayout;

  @ManyToOne(() => Item, (item) => item.homeItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;
}
