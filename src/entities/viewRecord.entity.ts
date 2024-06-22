import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Essay } from './essay.entity';
import { User } from './user.entity';

@Entity('view_record')
export class ViewRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.essayViewRecords)
  user: User;

  @ManyToOne(() => Essay, (essay) => essay.viewRecords)
  essay: Essay;

  @CreateDateColumn({
    name: 'viewed_date',
    type: 'timestamptz',
  })
  viewedDate: Date;
}
