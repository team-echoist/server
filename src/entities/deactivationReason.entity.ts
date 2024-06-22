import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('deactivation_reason')
export class DeactivationReason {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  reason: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;

  @ManyToOne(() => User, (user) => user.deactivationReasons, { onDelete: 'CASCADE' })
  user: User;
}
