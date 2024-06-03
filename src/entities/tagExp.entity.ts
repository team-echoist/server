import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Tag } from './tag.entity';
import { Badge } from './badge.entity';

@Entity()
export class TagExp {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ default: false })
  used: boolean;

  @ManyToOne(() => User, (user) => user.tagExps)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Tag, (tag) => tag.tagExps)
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;

  @ManyToOne(() => Badge, (badge) => badge.tagExps)
  @JoinColumn({ name: 'badge' })
  badge: Badge;
}
