import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Column,
} from 'typeorm';
import { User } from './user.entity';
import { Essay } from './essay.entity';

@Entity()
export class Infraction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'create_at' })
  createAt: Date;

  @ManyToOne(() => User, (user) => user.infractions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Essay, (essay) => essay.infractions)
  @JoinColumn({ name: 'essay_id' })
  essay: Essay;
}
