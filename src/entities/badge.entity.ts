import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

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

  @ManyToOne(() => User, (user) => user.badges)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
