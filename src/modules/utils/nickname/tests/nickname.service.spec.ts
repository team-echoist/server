import { Test, TestingModule } from '@nestjs/testing';
import { NicknameService } from '../core/nickname.service';
import { NicknameRepository } from '../infrastructure/nickname.repository';
import { HttpException, HttpStatus } from '@nestjs/common';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('../infrastructure/nickname.repository');

describe('NicknameService', () => {
  let service: NicknameService;
  let nicknameRepository: jest.Mocked<NicknameRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NicknameService, NicknameRepository],
    }).compile();

    service = module.get<NicknameService>(NicknameService);
    nicknameRepository = module.get(NicknameRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUniqueNickname', () => {
    it('should generate a unique nickname', async () => {
      const nicknames = [{ nickname: 'test123' }];
      nicknameRepository.findUniqueNickname.mockResolvedValue(nicknames as any);

      const result = await service.generateUniqueNickname();

      expect(nicknameRepository.findUniqueNickname).toHaveBeenCalledTimes(1);
      expect(nicknameRepository.usedNicknameUpdate).toHaveBeenCalledWith('test123');
      expect(result).toBe('test123');
    });

    it('should try multiple digit lengths if no unique nickname is found initially', async () => {
      nicknameRepository.findUniqueNickname
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ nickname: 'test456' }] as any);

      const result = await service.generateUniqueNickname();

      expect(nicknameRepository.findUniqueNickname).toHaveBeenCalledTimes(2);
      expect(nicknameRepository.usedNicknameUpdate).toHaveBeenCalledWith('test456');
      expect(result).toBe('test456');
    });

    it('should throw an error if unable to generate a unique nickname', async () => {
      nicknameRepository.findUniqueNickname.mockResolvedValue([]);

      await expect(service.generateUniqueNickname()).rejects.toThrow(
        new HttpException('Unable to generate a unique nickname.', HttpStatus.SERVICE_UNAVAILABLE),
      );

      expect(nicknameRepository.findUniqueNickname).toHaveBeenCalledTimes(4);
    });
  });

  describe('setNicknameUsage', () => {
    it('should set nickname usage', async () => {
      const nickname = { nickname: 'test123', isUsed: false };
      nicknameRepository.findByNickname.mockResolvedValue(nickname as any);

      await service.setNicknameUsage('test123', true);

      expect(nicknameRepository.findByNickname).toHaveBeenCalledWith('test123');
      expect(nicknameRepository.saveBasicNickname).toHaveBeenCalledWith({
        ...nickname,
        isUsed: true,
      });
    });

    it('should not set nickname usage if nickname not found', async () => {
      nicknameRepository.findByNickname.mockResolvedValue(null);

      await service.setNicknameUsage('test123', true);

      expect(nicknameRepository.findByNickname).toHaveBeenCalledWith('test123');
      expect(nicknameRepository.saveBasicNickname).not.toHaveBeenCalled();
    });
  });
});
