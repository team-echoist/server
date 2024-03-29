import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Essay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  author: number;

  @Column({ nullable: true, name: 'original_author' })
  originalAuthor: number | null; // 원작자 ID, 자기 글일 경우 null

  @Column('text')
  content: string;

  @Index()
  @CreateDateColumn({ name: 'create_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'update_at' })
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  image: any;

  @Column({ type: 'jsonb', nullable: true })
  video: any;

  @Column('decimal', { precision: 9, scale: 6, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 9, scale: 6, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  weather: string;

  @Column({ default: false })
  bookmarks: boolean;

  @Column({ default: 0 })
  reports: number;

  @Column({ default: 0 })
  views: number;

  @Column({ default: false, name: 'is_favorite' })
  isFavorite: boolean;

  @Column({ default: false, name: 'is_published' })
  isPublished: boolean;

  @Column({ nullable: true, name: 'capsule_open_date', type: 'timestamp' })
  capsuleOpenDate: Date;

  @ManyToOne(() => User, (user) => user.essays)
  user: User;
}
