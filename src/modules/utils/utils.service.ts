import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { v4 } from 'uuid';
import * as moment from 'moment-timezone';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { LoremIpsum } from 'lorem-ipsum';

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
    return moment(date).tz('Asia/Seoul').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
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

  transformTagsToNames(data: any): any {
    if (data.tags && Array.isArray(data.tags)) {
      data.tags = data.tags.map((tag: any) => tag.name);
    }
    return data;
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

  getRandomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  extractPartContent(text: string) {
    const cleanedText = text.replace(/[\n\r]/g, '');
    return cleanedText.slice(0, 100);
  }

  extractFirstSentences(text: string, minLength: number, maxLength: number) {
    const sentences = this.sentences(text, minLength, maxLength);
    if (sentences.length === 0) {
      return text.trim().slice(0, 30);
    }

    return sentences[0];
  }
  extractEndSentences(text: string, minLength: number, maxLength: number) {
    const sentences = this.sentences(text, minLength, maxLength);
    if (sentences.length === 0) {
      const trimmedText = text.trim();
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

  private lorem = new LoremIpsum({
    sentencesPerParagraph: {
      max: 8,
      min: 4,
    },
    wordsPerSentence: {
      max: 16,
      min: 4,
    },
  });
  generateCustomKoreanContent(): string {
    const sentences = [
      '나는 오늘 아침에 일어나서 생각했다.',
      '삶의 의미는 무엇일까?',
      '자아를 발견하는 과정은 매우 복잡하다.',
      '성찰을 통해 나는 더 나은 사람이 될 수 있다.',
      '감정의 흐름을 이해하는 것은 중요하다.',
      '내면의 평화를 찾기 위해 나는 명상을 시작했다.',
      '자기 계발은 끝이 없는 여정이다.',
      '마음의 소리에 귀 기울이는 것이 필요하다.',
      '내적 갈등은 누구에게나 있다.',
      '자신의 가치를 알아보는 것은 중요하다.',
      '정신적 성숙은 나이를 가리지 않는다.',
      '자기 치유를 위해 나는 여행을 떠났다.',
      '자기 수용은 행복의 열쇠다.',
      '자아 존중은 자신을 사랑하는 것이다.',
      '자기 이해는 자기 계발의 첫 걸음이다.',
      '내면의 힘은 우리 모두에게 있다.',
      '내적 여정은 끝이 없다.',
      '자아 탐구는 끝없이 이어진다.',
      '자기 개발은 지속적인 노력이다.',
      '정신적 성장은 중요한 과정이다.',
      '감정의 발견은 자기 이해로 이어진다.',
      '삶의 목적을 찾기 위해 노력해야 한다.',
      '마음의 여정을 계속해야 한다.',
      '자신의 가치를 인정하는 것이 중요하다.',
      '정신적 성숙은 많은 경험을 통해 이루어진다.',
    ];

    let content = '';
    while (content.length < 2000) {
      const sentence = sentences[Math.floor(Math.random() * sentences.length)];
      content += sentence + ' ';
      if (Math.random() < 0.2) {
        content += '\n';
      }
    }
    return content.slice(0, 3500);
  }

  generateRandomTitle(): string {
    const topics = [
      '자아성찰',
      '삶의 의미',
      '내면의 발견',
      '자아 성장',
      '자아 이해',
      '자기 계발',
      '내적 평화',
      '심리적 성장',
      '자기 통찰',
      '내적 갈등',
      '감정의 흐름',
      '삶의 목적',
      '마음의 여정',
      '자신의 가치',
      '정신적 성숙',
      '자기 치유',
      '자기 수용',
      '자아 존중',
      '자기 이해',
      '내면의 힘',
      '내적 여정',
      '자아 탐구',
      '자기 개발',
      '정신적 성장',
      '감정의 발견',
    ];
    const verbs = [
      '하기',
      '탐구',
      '이해하기',
      '발견하기',
      '성장하기',
      '수용하기',
      '이해하기',
      '탐험하기',
      '성찰하기',
      '생각하기',
      '성찰하기',
      '알아보기',
      '분석하기',
      '깨닫기',
      '탐닉하기',
      '발견하기',
      '찾기',
      '인식하기',
      '바라보기',
      '느끼기',
    ];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    return `${topic} ${verb}`;
  }

  generateRandomTags(): string[] {
    const tags = [
      '성찰',
      '성장',
      '발견',
      '이해',
      '삶',
      '자아',
      '내면',
      '탐구',
      '발전',
      '자기계발',
      '치유',
      '자존감',
      '정신',
      '마음',
      '감정',
      '자기이해',
      '자아성찰',
      '자기발견',
      '자아발견',
      '자기치유',
      '내적평화',
      '심리',
      '감정관리',
      '삶의목적',
      '자기존중',
      '자기통찰',
      '내적갈등',
      '내적여정',
      '정신적성장',
      '감정의흐름',
      '마음의여정',
      '자신의가치',
      '정신적성숙',
      '자아탐구',
      '자기개발',
      '정신적성장',
      '감정의발견',
      '삶의의미',
      '내면의발견',
      '자기성장',
    ];
    return tags.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 1);
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
}
