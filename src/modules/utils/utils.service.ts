import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { v4 } from 'uuid';
import * as moment from 'moment-timezone';

@Injectable()
export class UtilsService {
  constructor(private configService: ConfigService) {}
  getUUID(): string {
    return v4();
  }

  generateJWT(id: number, email: string) {
    const secretKey = this.configService.get('JWT_SECRET');
    const options = { expiresIn: '1440m' };
    return jwt.sign({ id: id, email: email }, secretKey, options);
  }

  async generateVerifyToken() {
    const { randomBytes } = await import('crypto');
    return randomBytes(16).toString('hex');
  }

  newDate() {
    const seoulTime = moment().tz('Asia/Seoul');
    return new Date(seoulTime.format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z');
  }

  startOfDay(date: Date) {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  endOfDay(date: Date) {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  async formatMonthlyData(rawData: any[]) {
    const result: Record<string, number> = {};

    for (let month = 1; month <= 12; month++) {
      result[`${month}`] = 0;
    }

    rawData.forEach((item) => {
      const monthKey = item.month.toString();
      result[monthKey] = parseInt(item.count);
    });

    return result;
  }

  async formatDailyData(rawData: any[], firstDayOfMonth: Date, lastDayOfMonth: Date) {
    const result: Record<string, number> = {};

    for (
      let date = new Date(firstDayOfMonth);
      date <= lastDayOfMonth;
      date.setUTCDate(date.getUTCDate() + 1)
    ) {
      const dayKey = date.getUTCDate().toString();
      result[dayKey] = 0;
    }

    rawData.forEach((item) => {
      const dayKey = item.day.toString();
      result[dayKey] = parseInt(item.count);
    });

    return result;
  }
}
