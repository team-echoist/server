import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BasicNickname {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ unique: true })
  nickname: string;

  @Index()
  @Column({ default: false })
  isUsed: boolean;
}
