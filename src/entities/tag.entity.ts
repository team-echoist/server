import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Essay } from './essay.entity';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Essay, (essay) => essay.tags)
  essays: Essay[];
}
