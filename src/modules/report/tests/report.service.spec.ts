import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from '../report.service';
import { ReportRepository } from '../report.repository';
import { EssayService } from '../../essay/essay.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ReportQueue } from '../../../entities/reportQueue.entity';
import { Essay } from '../../../entities/essay.entity';
import { CreateReportReqDto } from '../dto/request/createReportReq.dto';
import { EssayStatus } from '../../../common/types/enum.types';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('../report.repository');
jest.mock('../../essay/essay.service');

describe('ReportService', () => {
  let service: ReportService;
  let reportRepository: jest.Mocked<ReportRepository>;
  let essayService: jest.Mocked<EssayService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        ReportRepository,
        {
          provide: EssayService,
          useValue: {
            getEssayById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    reportRepository = module.get(ReportRepository);
    essayService = module.get(EssayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getReportByReporter', () => {
    it('should return a report by reporter', async () => {
      const userId = 1;
      const essayId = 1;
      const report = { id: 1 } as ReportQueue;

      reportRepository.findReportByReporter.mockResolvedValue(report);

      const result = await service.getReportByReporter(userId, essayId);

      expect(reportRepository.findReportByReporter).toHaveBeenCalledWith(userId, essayId);
      expect(result).toBe(report);
    });
  });

  describe('createReport', () => {
    it('should create a report', async () => {
      const userId = 1;
      const essayId = 1;
      const data = { reason: 'Inappropriate content' } as CreateReportReqDto;
      const essay = { id: essayId, status: EssayStatus.PUBLISHED } as any;

      essayService.getEssayById.mockResolvedValue(essay);
      reportRepository.findReportByReporter.mockResolvedValue(null);
      reportRepository.saveReport.mockResolvedValue({} as ReportQueue);

      await service.createReport(userId, essayId, data);

      expect(essayService.getEssayById).toHaveBeenCalledWith(essayId);
      expect(reportRepository.findReportByReporter).toHaveBeenCalledWith(userId, essayId);
      expect(reportRepository.saveReport).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: data.reason,
          reporter: { id: userId },
          essay: { id: essayId },
          processed: false,
        }),
      );
    });

    it('should throw an error if essay not found', async () => {
      const userId = 1;
      const essayId = 1;
      const data = { reason: 'Inappropriate content' } as CreateReportReqDto;

      essayService.getEssayById.mockResolvedValue(null);

      await expect(service.createReport(userId, essayId, data)).rejects.toThrow(
        new HttpException('에세이를 찾을 수 없습니다.', HttpStatus.NOT_FOUND),
      );

      expect(essayService.getEssayById).toHaveBeenCalledWith(essayId);
      expect(reportRepository.findReportByReporter).not.toHaveBeenCalled();
      expect(reportRepository.saveReport).not.toHaveBeenCalled();
    });

    it('should throw an error if essay is private', async () => {
      const userId = 1;
      const essayId = 1;
      const data = { reason: 'Inappropriate content' } as CreateReportReqDto;
      const essay = { id: essayId, status: 'private' } as Essay;

      essayService.getEssayById.mockResolvedValue(essay);

      await expect(service.createReport(userId, essayId, data)).rejects.toThrow(
        new HttpException('비공개 에세이는 신고할 수 없습니다.', HttpStatus.BAD_REQUEST),
      );

      expect(essayService.getEssayById).toHaveBeenCalledWith(essayId);
      expect(reportRepository.findReportByReporter).not.toHaveBeenCalled();
      expect(reportRepository.saveReport).not.toHaveBeenCalled();
    });

    it('should throw an error if report already exists', async () => {
      const userId = 1;
      const essayId = 1;
      const data = { reason: 'Inappropriate content' } as CreateReportReqDto;
      const essay = { id: essayId, status: EssayStatus.PUBLISHED } as any;
      const existingReport = { id: 1 } as ReportQueue;

      essayService.getEssayById.mockResolvedValue(essay);
      reportRepository.findReportByReporter.mockResolvedValue(existingReport);

      await expect(service.createReport(userId, essayId, data)).rejects.toThrow(
        new HttpException('귀하는 이미 이 에세이를 신고했습니다.', HttpStatus.CONFLICT),
      );

      expect(essayService.getEssayById).toHaveBeenCalledWith(essayId);
      expect(reportRepository.findReportByReporter).toHaveBeenCalledWith(userId, essayId);
      expect(reportRepository.saveReport).not.toHaveBeenCalled();
    });
  });
});
