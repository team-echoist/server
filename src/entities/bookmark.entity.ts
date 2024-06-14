import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Essay } from './essay.entity';

@Entity()
export class Bookmark {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.bookmarks)
  user: User;

  @ManyToOne(() => Essay, (essay) => essay.bookmarks, { onDelete: 'CASCADE' })
  essay: Essay;

  @CreateDateColumn({ name: 'created_date' })
  createdDate: Date;
}
