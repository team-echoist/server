import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { v4 } from 'uuid';

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

  startOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  endOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }
}
