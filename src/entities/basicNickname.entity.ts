import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BasicNickname {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ unique: true })
  nickname: string;

  @Index()
  @Column({ name: 'is_used', default: false })
  isUsed: boolean;
}
