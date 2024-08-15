import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { v4 } from 'uuid';
import * as moment from 'moment-timezone';
import * as sanitizeHtml from 'sanitize-html';

import { ClassConstructor, plainToInstance } from 'class-transformer';

@Injectable()
export class UtilsService {
  constructor(private configService: ConfigService) {}
  getUUID(): string {
    return v4();
  }

  generateJWT(id: number) {
    const secretKey = this.configService.get('JWT_SECRET');
    const options = { expiresIn: '30d' };
    return jwt.sign({ id: id }, secretKey, options);
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

  convertToKST(date: Date): string {
    const kstOffset = 9 * 60;
    const kstDate = new Date(date.getTime() + kstOffset * 60 * 1000);

    return kstDate.toISOString().replace('Z', '+09:00');
  }

  transformDatesToKST(data: any): any {
    const dateFields = [
      'createdDate',
      'updatedDate',
      'deletedDate',
      'processedDate',
      'endDate',
      'subscriptionEnd',
    ];

    const result = { ...data };

    dateFields.forEach((field) => {
      if (result[field]) {
        result[field] = this.convertToKST(new Date(result[field]));
      }
    });

    return result;
  }

  getStartOfWeek(date: Date): Date {
    const currentDate = new Date(date);
    const day = currentDate.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    currentDate.setUTCDate(currentDate.getUTCDate() + diff);
    currentDate.setUTCHours(0, 0, 0, 0);
    return currentDate;
  }

  formatWeeklyData(rawData: any[], startDate: Date, endDate: Date) {
    const result: { weekStart: Date; weekEnd: Date; count: number }[] = [];

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      weekEnd.setUTCHours(23, 59, 59, 999);

      const matchingData = rawData.find((item) => {
        const itemWeekStart = new Date(item.weekstart);
        return (
          itemWeekStart.getUTCFullYear() === weekStart.getUTCFullYear() &&
          itemWeekStart.getUTCMonth() === weekStart.getUTCMonth() &&
          itemWeekStart.getUTCDate() === weekStart.getUTCDate()
        );
      });

      result.push({
        weekStart: weekStart,
        weekEnd: weekEnd,
        count: matchingData ? parseInt(matchingData.count, 10) : 0,
      });

      currentDate.setUTCDate(currentDate.getUTCDate() + 7);
      currentDate.setUTCHours(0, 0, 0, 0);
    }

    return result;
  }

  transformToDto<T, V>(cls: ClassConstructor<T>, plain: V | V[]): T | T[] {
    if (Array.isArray(plain)) {
      return plain.map((item) => {
        const transformedItem = plainToInstance(cls, item, { excludeExtraneousValues: true });
        return this.transformDatesToKST(transformedItem);
      });
    }
    const transformedPlain = plainToInstance(cls, plain, { excludeExtraneousValues: true });
    return this.transformDatesToKST(transformedPlain);
  }

  formatDateToKorean(date: Date): string {
    const koreanFormatter = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Seoul',
    });
    return koreanFormatter.format(date);
  }

  cleanText(text: string) {
    return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
  }

  extractPartContent(text: string) {
    const cleanedText = this.cleanText(text);
    return cleanedText.slice(0, 100);
  }

  extractFirstSentences(text: string, minLength: number, maxLength: number) {
    const cleanedText = this.cleanText(text);
    const sentences = this.sentences(cleanedText, minLength, maxLength);
    if (sentences.length === 0) {
      return cleanedText.trim().slice(0, 30);
    }

    return sentences[0];
  }
  extractEndSentences(text: string, minLength: number, maxLength: number) {
    const cleanedText = this.cleanText(text);
    const sentences = this.sentences(cleanedText, minLength, maxLength);
    if (sentences.length === 0) {
      const trimmedText = cleanedText.trim();
      return trimmedText.slice(-30);
    }

    return sentences[sentences.length - 1];
  }

  sentences(text: string, minLength: number, maxLength: number) {
    const sentenceEndings = /([.?!]+)/;
    return text
      .split(sentenceEndings)
      .reduce((acc, current, index, array) => {
        if (index % 2 === 0) {
          const sentence = current + (array[index + 1] || '');
          acc.push(sentence.trim());
        }
        return acc;
      }, [])
      .filter((s) => s.length >= minLength && s.length <= maxLength);
  }

  highlightKeywordSnippet(text: string, keyword: string) {
    const snippetLength = 100;
    const cleanedText = this.cleanText(text);
    const keywordIndex = cleanedText.toLowerCase().indexOf(keyword.toLowerCase());

    if (keywordIndex === -1) {
      return cleanedText.slice(0, snippetLength);
    }

    const start = Math.max(0, keywordIndex - Math.floor((snippetLength - keyword.length) / 2));
    const end = keywordIndex + keyword.length + 70;

    return cleanedText.slice(start, end).trim();
  }

  async batchProcess<T>(
    items: T[],
    batchSize: number,
    processBatch: (bach: T[]) => Promise<void>,
  ): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await processBatch(batch);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  numberToKoreanString(number: number): string {
    const koreanDigits = ['공', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const numberStr = number.toString();
    const paddedStr = numberStr.padStart(3, '0');
    return paddedStr
      .split('')
      .map((digit) => koreanDigits[parseInt(digit)])
      .join('');
  }

  preprocessKeyword(keyword: string) {
    return `%${keyword.trim()}%`;
  }

  isDefaultProfileImage(profileImageUrl: string): boolean {
    return profileImageUrl.includes('profile_icon_');
  }
}
