import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Essay } from './essay.entity';
import { User } from './user.entity';

@Entity()
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @CreateDateColumn({
    name: 'created_date',
    type: 'timestamptz',
  })
  createdDate: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate: Date;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.stories, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Essay, (essay) => essay.story)
  essays: Essay[];
}
