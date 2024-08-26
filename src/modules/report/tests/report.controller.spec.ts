import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from '../report.controller';
import { ReportService } from '../report.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';
import { CreateReportReqDto } from '../dto/request/createReportReq.dto';

jest.mock('../report.service');

describe('ReportController', () => {
  let controller: ReportController;
  let service: jest.Mocked<ReportService>;

  jest.mock('@nestjs/passport', () => ({
    AuthGuard: jest.fn().mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    })),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({}), ConfigModule.forRoot()],
      controllers: [ReportController],
      providers: [ReportService],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ReportController>(ReportController);
    service = module.get<ReportService>(ReportService) as jest.Mocked<ReportService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('reportEssay', () => {
    it('should call service createReport method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const essayId = 1;
      const data: CreateReportReqDto = { reason: 'inappropriate content' };

      await controller.reportEssay(req, essayId, data);
      expect(service.createReport).toHaveBeenCalledWith(req.user.id, essayId, data);
    });
  });
});
