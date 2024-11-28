import { ViewRecord } from '../../../../../entities/viewRecord.entity';

export interface IViewRepository {
  findViewRecord(userId: number, essayId: number): Promise<ViewRecord>;

  saveViewRecord(viewRecord: ViewRecord): Promise<void>;

  findRecentViewedEssays(
    userId: number,
    page: number,
    limit: number,
  ): Promise<{ viewRecords: ViewRecord[]; total: number }>;

  recentEssayIds(userId: number, recentCount: number): Promise<any[]>;
}
