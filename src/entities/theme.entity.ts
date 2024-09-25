import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserTheme } from './userTheme.entity';
import { UserHomeLayout } from './userHomeLayout.entity';
import { Item } from './item.entity';

@Entity()
export class Theme {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column({ nullable: true })
  url: string;

  @OneToMany(() => Item, (item) => item.theme)
  items: Item[];

  @OneToMany(() => UserTheme, (userTheme) => userTheme.theme)
  userThemes: UserTheme[];

  @OneToMany(() => UserHomeLayout, (layout) => layout.theme)
  layouts: UserHomeLayout[];
}
