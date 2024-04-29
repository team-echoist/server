import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Report } from './report.entity';
import { Infraction } from './infraction.entity';

@Entity()
export class Essay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  title: string;

  @Column('text')
  content: string;

  @Index()
  @CreateDateColumn({ name: 'create_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'update_at' })
  updatedAt: Date;

  @Column({ name: 'thumbnail', nullable: true })
  thumbnail: string;

  @Column({ nullable: true })
  weather: string;

  @Column({ default: false })
  bookmarks: boolean;

  @Column({ default: 0 })
  views: number;

  @Index()
  @Column({ default: false, name: 'is_published' })
  isPublished: boolean;

  @Column({ default: false, name: 'is_linked_out' })
  isLinkedOut: boolean;

  @Index()
  @Column({ nullable: true, name: 'device_info' })
  device: string;

  @JoinColumn({ name: 'author' })
  @ManyToOne(() => User, (user) => user.essays)
  author: User;

  @OneToMany(() => Report, (report) => report.reportedEssay)
  reports: Report[];

  @OneToMany(() => Infraction, (infraction) => infraction.essay)
  infractions: Infraction[];
}
