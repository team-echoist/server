import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';

import { Essay } from './essay.entity';
import { User } from './user.entity';

@Entity()
export class Bookmark {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.bookmarks, { onDelete: 'CASCADE' })
  user: User;

  @JoinColumn({ name: 'essay_id' })
  @ManyToOne(() => Essay, (essay) => essay.bookmarks, { onDelete: 'CASCADE' })
  essay: Essay;

  @CreateDateColumn({ name: 'created_date' })
  createdDate: Date;
}
