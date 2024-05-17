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
import { User } from './user.entity';
import { Essay } from './essay.entity';
import * as moment from 'moment-timezone';
import { KSTTransformer } from '../common/utils';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @CreateDateColumn({
    name: 'created_date',
    type: 'timestamptz',
    transformer: KSTTransformer,
  })
  createdDate: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz', transformer: KSTTransformer })
  updatedDate: Date;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User, (user) => user.category)
  user: User;

  @OneToMany(() => Essay, (essay) => essay.category)
  essays: Essay[];
}
