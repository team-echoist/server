import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { TagExp } from './tagExp.entity';

@Entity()
export class Badge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: 0 })
  level: number;

  @Column({ default: 0 })
  exp: number;

  @ManyToOne(() => User, (user) => user.badges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => TagExp, (tagExp) => tagExp.badge)
  tagExps: TagExp[];
}
