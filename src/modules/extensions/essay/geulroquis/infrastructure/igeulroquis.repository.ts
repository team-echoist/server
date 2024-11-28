import { Geulroquis } from '../../../../../entities/geulroguis.entity';
import { DeleteResult } from 'typeorm';

export interface IGeulroquisRepository {
  saveGeulroquis(geulroquis: Geulroquis): Promise<Geulroquis>;

  findGeulroquis(page: number, limit: number): Promise<{ geulroquis: Geulroquis[]; total: number }>;

  findTodayGeulroquis(): Promise<Geulroquis>;

  countTotalGeulroquis(): Promise<number>;

  countAvailableGeulroquis(): Promise<number>;

  findTomorrowGeulroquis(): Promise<Geulroquis>;

  findCurrentGeulroquis(): Promise<Geulroquis>;

  findOneGeulroquis(geulroquisId: number): Promise<Geulroquis>;

  findOneNextGeulroquis(): Promise<Geulroquis>;

  deleteAllGeulroquis(): Promise<DeleteResult>;
}
