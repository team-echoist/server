export class ReportDto {
  id: number;
  reason: string;
  processed: boolean;
  processedDate: Date | null;
  createdDate: Date;
  reporterId: number;
}
