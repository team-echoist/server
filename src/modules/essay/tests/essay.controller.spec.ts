import { EssayController } from '../essay.controller';
import { EssayService } from '../essay.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('EssayController', () => {
  let controller: EssayController;
  let mockEssayService: any;

  beforeEach(async () => {
    mockEssayService = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EssayController],
      providers: [
        {
          provide: EssayService,
          useValue: mockEssayService,
        },
      ],
    }).compile();

    controller = module.get<EssayController>(EssayController);
    jest.clearAllMocks();
  });

  describe('essay', () => {
    it('에세이 작성', async () => {});
  });
});
