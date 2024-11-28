import { DeleteResult, FindManyOptions } from 'typeorm';
import { ReportQueue } from '../../../../entities/reportQueue.entity';
import { ProcessedHistory } from '../../../../entities/processedHistory.entity';
import { ReviewQueue } from '../../../../entities/reviewQueue.entity';
import { Admin } from '../../../../entities/admin.entity';
import { AdminUpdateReqDto } from '../dto/request/adminUpdateReq.dto';
import { CreateAdminDto } from '../dto/createAdmin.dto';
import { Server } from '../../../../entities/server.entity';
import { Theme } from '../../../../entities/theme.entity';
import { Item } from '../../../../entities/item.entity';

export interface IAdminRepository {
  totalSubscriberCount(today: Date): Promise<number>;

  todaySubscribers(todayStart: Date, todayEnd: Date): Promise<number>;

  unprocessedReports(): Promise<number>;

  unprocessedReviews(): Promise<number>;

  countMonthlySubscriptionPayments(firstDayOfMonth: Date, lastDayOfMonth: Date): Promise<any>;

  countYearlySubscriptionPayments(year: number): Promise<any>;

  getReports(
    sort: string,
    page: number,
    limit: number,
  ): Promise<{ reports: any[]; totalReports: number; totalEssay: number }>;

  findReportByEssayId(essayId: number): Promise<ReportQueue[]>;

  saveReport(report: ReportQueue): Promise<void>;

  saveHistory(history: ProcessedHistory): Promise<void>;

  getReviews(page: number, limit: number): Promise<{ reviews: ReviewQueue[]; total: number }>;

  getReview(reviewId: number): Promise<ReviewQueue>;

  saveReview(review: ReviewQueue): Promise<ReviewQueue>;

  getHistories(query: FindManyOptions): Promise<{ histories: ProcessedHistory[]; total: number }>;

  handleBannedReports(essayIds: number[]): Promise<void>;

  handleBannedReviews(userId: number): Promise<void>;

  findByEmail(email: string): Promise<Admin>;

  findByName(name: string): Promise<Admin>;

  findAdmins(
    activated: boolean,
    page: number,
    limit: number,
  ): Promise<{ admins: Admin[]; total: number }>;

  findAdmin(adminId: number): Promise<Admin>;

  updateAdmin(admin: Admin, data: AdminUpdateReqDto): Promise<Admin>;

  saveAdmin(admin: Admin | CreateAdminDto): Promise<Admin | (CreateAdminDto & Admin)>;

  getCurrentServerStatus(): Promise<Server>;

  saveServer(server: Server): Promise<Server>;

  clearDatabase(): Promise<void>;

  deleteAdminById(adminId: number): Promise<DeleteResult>;

  saveTheme(newTheme: Theme): Promise<Theme>;

  findThemes(): Promise<Theme[]>;

  findThemeById(themeId: number): Promise<Theme>;

  deleteTheme(themeId: number): Promise<DeleteResult>;

  findItems(themeName?: string): Promise<Item[]>;

  saveItem(newItem: Item): Promise<Item>;

  deleteItem(itemId: number): Promise<DeleteResult>;
}
