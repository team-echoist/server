import { Test, TestingModule } from '@nestjs/testing';
import { BurialService } from '../burial.service';
import { UtilsService } from '../../utils/utils.service';
import { UserService } from '../../user/user.service';
import { EssayRepository } from '../../essay/essay.repository';
import { AlertService } from '../../alert/alert.service';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('../../utils/utils.service');
jest.mock('../../essay/essay.repository');
jest.mock('../../user/user.service');
jest.mock('../../alert/alert.service');

describe('BurialService', () => {
  let burialService: BurialService;
  let utilsService: jest.Mocked<UtilsService>;
  let essayRepository: jest.Mocked<EssayRepository>;
  let alertService: jest.Mocked<AlertService>;

  let user: any;
  let essays: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BurialService,
        { provide: UtilsService, useClass: UtilsService },
        { provide: EssayRepository, useClass: EssayRepository },
        { provide: UserService, useClass: UserService },
        { provide: AlertService, useClass: AlertService },
      ],
    }).compile();

    burialService = module.get<BurialService>(BurialService);
    utilsService = module.get(UtilsService) as jest.Mocked<UtilsService>;
    essayRepository = module.get(EssayRepository) as jest.Mocked<EssayRepository>;
    alertService = module.get(AlertService) as jest.Mocked<AlertService>;

    utilsService.transformToDto.mockImplementation((_, any) => any);
    utilsService.extractPartContent.mockImplementation((any) => any);

    user = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
      nickname: null,
      platformId: null,
      platform: null,
      status: null,
      tokenVersion: 1,
    };

    essays = [
      {
        id: 1,
        title: '에세이1',
        content: '내용1',
        author: user,
      },
      {
        id: 2,
        title: '에세이2',
        content: '내용2',
        author: user,
      },
    ];
  });

  describe('notifyIfBurialNearby', () => {
    it('땅묻: 가까운 에세이 카운트', async () => {
      essayRepository.findNearbyEssaysCount.mockResolvedValue(1);

      await burialService.notifyIfBurialNearby(user.id, 1, 1);

      expect(essayRepository.findNearbyEssaysCount).toHaveBeenCalledWith(user.id, 1, 1);
      expect(alertService.sendPushBurialNearby).toHaveBeenCalledWith(user.id);
    });
  });

  describe('findBurialNearby', () => {
    it('땅묻: 가까운 에세이 조회', async () => {
      essayRepository.findNearbyEssays.mockResolvedValue(essays);

      const result = await burialService.findBurialNearby(user.id, 1, 1);

      expect(essayRepository.findNearbyEssays).toHaveBeenCalledWith(user.id, 1, 1);
      expect(result).toEqual(essays);
    });
  });
});
