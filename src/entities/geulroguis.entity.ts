import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Geulroquis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  url: string;

  @Column({ default: false })
  current: boolean;

  @Column({ default: false })
  next: boolean;

  @Column({ default: false })
  provided: boolean;

  @Column({ name: 'provided_date', type: 'timestamptz', nullable: true })
  providedDate: Date;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate: Date;
}
