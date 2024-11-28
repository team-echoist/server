import { Test, TestingModule } from '@nestjs/testing';
import { ViewService } from '../view.service';
import { ViewRepository } from '../view.repository';
import { User } from '../../../../../entities/user.entity';
import { Essay } from '../../../../../entities/essay.entity';
import { ViewRecord } from '../../../../../entities/viewRecord.entity';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('../view.repository');

describe('ViewService', () => {
  let service: ViewService;
  let viewRepository: jest.Mocked<ViewRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ViewService, ViewRepository],
    }).compile();

    service = module.get<ViewService>(ViewService);
    viewRepository = module.get(ViewRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findViewRecord', () => {
    it('should find and return a view record', async () => {
      const userId = 1;
      const essayId = 1;
      const viewRecord = new ViewRecord();
      viewRepository.findViewRecord.mockResolvedValue(viewRecord);

      const result = await service.findViewRecord(userId, essayId);

      expect(viewRepository.findViewRecord).toHaveBeenCalledWith(userId, essayId);
      expect(result).toBe(viewRecord);
    });
  });

  describe('addViewRecord', () => {
    it('should update the viewedDate if view record exists', async () => {
      const user = { id: 1 } as User;
      const essay = { id: 1 } as Essay;
      const viewRecord = new ViewRecord();
      viewRecord.user = user;
      viewRecord.essay = essay;
      viewRecord.viewedDate = new Date('2020-01-01');

      viewRepository.findViewRecord.mockResolvedValue(viewRecord);

      await service.addViewRecord(user, essay);

      expect(viewRepository.findViewRecord).toHaveBeenCalledWith(user.id, essay.id);
      expect(viewRepository.saveViewRecord).toHaveBeenCalledWith(
        expect.objectContaining({ viewedDate: expect.any(Date) }),
      );
    });

    it('should create a new view record if not exists', async () => {
      const user = { id: 1 } as User;
      const essay = { id: 1 } as Essay;

      viewRepository.findViewRecord.mockResolvedValue(null);

      await service.addViewRecord(user, essay);

      expect(viewRepository.findViewRecord).toHaveBeenCalledWith(user.id, essay.id);
    });
  });

  describe('findRecentViewedEssays', () => {
    it('should find and return recent viewed essays', async () => {
      const userId = 1;
      const page = 1;
      const limit = 10;
      const recentViewedEssays = [{ id: 1, title: 'Essay 1' }] as any;

      viewRepository.findRecentViewedEssays.mockResolvedValue(recentViewedEssays);

      const result = await service.findRecentViewedEssays(userId, page, limit);

      expect(viewRepository.findRecentViewedEssays).toHaveBeenCalledWith(userId, page, limit);
      expect(result).toBe(recentViewedEssays);
    });
  });

  describe('getRecentEssayIds', () => {
    it('should return recent essay ids', async () => {
      const userId = 1;
      const recentCount = 5;
      const recentEssayIds = [{ essayId: 1 }, { essayId: 2 }];

      viewRepository.recentEssayIds.mockResolvedValue(recentEssayIds);

      const result = await service.getRecentEssayIds(userId, recentCount);

      expect(viewRepository.recentEssayIds).toHaveBeenCalledWith(userId, recentCount);
      expect(result).toEqual([1, 2]);
    });

    it('should return empty array if no recent essay ids', async () => {
      const userId = 1;
      const recentCount = 5;

      viewRepository.recentEssayIds.mockResolvedValue([]);

      const result = await service.getRecentEssayIds(userId, recentCount);

      expect(viewRepository.recentEssayIds).toHaveBeenCalledWith(userId, recentCount);
      expect(result).toEqual([]);
    });
  });
});
