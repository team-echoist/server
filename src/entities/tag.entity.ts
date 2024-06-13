import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
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

  @ManyToMany(() => Essay, (essay) => essay.tags)
  essays: Essay[];

  @JoinColumn({ name: 'tag_exps' })
  @OneToMany(() => TagExp, (tagExp) => tagExp.tag)
  tagExps: TagExp[];
}
