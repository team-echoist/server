import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Essay } from './essay.entity';
import { Subscription } from './subscription.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  gender: string;

  @Column({ name: 'birth_date' })
  birthDate: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'oauth_info' })
  oauthInfo: any;

  @Column({ default: false })
  admin: boolean;

  @CreateDateColumn({ name: 'create_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'update_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'delete_at' })
  deletedAt?: Date;

  @OneToMany(() => Essay, (essay) => essay.author)
  essays: Essay[];

  @OneToOne(() => Subscription, (subscription) => subscription.user_id)
  subscription: Subscription;
}
