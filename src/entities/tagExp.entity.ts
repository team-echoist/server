import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Tag } from './tag.entity';

@Entity()
export class TagExp {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.tagExps)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Tag, (tag) => tag.tagExps)
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;

  @Column({ default: false })
  used: boolean;
}
