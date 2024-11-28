import { Alert } from '../../../../../entities/alert.entity';

export interface IAlertRepository {
  saveAlert(alert: Alert): Promise<Alert>;

  countingAlert(userId: number): Promise<number>;

  findAlerts(
    userId: number,
    page: number,
    limit: number,
  ): Promise<{ alerts: Alert[]; total: number }>;

  findAlert(userId: number, alertId: number): Promise<Alert>;
}
