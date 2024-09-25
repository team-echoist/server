import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Theme } from './theme.entity';

@Entity('user_theme')
export class UserTheme {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.themes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Theme, (theme) => theme.userThemes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'theme_id' })
  theme: Theme;

  @CreateDateColumn({ name: 'purchased_date', type: 'timestamptz' })
  purchasedDate: Date;
}
