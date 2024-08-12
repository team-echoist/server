import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Tag } from './tag.entity';
import { Badge } from './badge.entity';

@Entity('tag_exp')
export class TagExp {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ default: false })
  used: boolean;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.tagExps, { onDelete: 'CASCADE' })
  user: User;

  @JoinColumn({ name: 'tag_id' })
  @ManyToOne(() => Tag, (tag) => tag.tagExps, { onDelete: 'CASCADE' })
  tag: Tag;

  @JoinColumn({ name: 'badge' })
  @ManyToOne(() => Badge, (badge) => badge.tagExps, { onDelete: 'CASCADE' })
  badge: Badge;
}
