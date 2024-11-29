import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Essay } from './essay.entity';
import { TagExp } from './tagExp.entity';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;

  @ManyToMany(() => Essay, (essay) => essay.tags, { onDelete: 'CASCADE' })
  essays: Essay[];

  @OneToMany(() => TagExp, (tagExp) => tagExp.tag)
  tagExps: TagExp[];
}
