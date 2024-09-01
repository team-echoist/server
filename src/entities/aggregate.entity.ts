import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity()
export class Aggregate {
  @PrimaryColumn({ name: 'essay_id' })
  essayId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'total_views', default: 0 })
  totalViews: number;

  @Column({ name: 'reputation_score', default: 0 })
  reputationScore: number;

  @Column({ name: 'trend_score', default: 0 })
  trendScore: number;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamp' })
  updatedDate: Date;
}
