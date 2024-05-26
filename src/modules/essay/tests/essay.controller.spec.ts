import { EssayController } from '../essay.controller';
import { EssayService } from '../essay.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateEssayReqDto } from '../dto/request/createEssayReq.dto';
import { INestApplication } from '@nestjs/common';
import { setTestUserMiddleware } from '../../../common/utils';
import * as request from 'supertest';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => {
    return jest.fn().mockImplementation(() => {
      return { canActivate: () => true };
    });
  },
}));

describe('EssayController', () => {
  let app: INestApplication;
  let controller: EssayController;
  const mockEssayService = {
    saveEssay: jest.fn(),
    updateEssay: jest.fn(),
    getMyEssays: jest.fn(),
    deleteEssay: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EssayController],
      providers: [
        {
          provide: EssayService,
          useValue: mockEssayService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.use(setTestUserMiddleware({ id: 1 }));
    await app.init();
    controller = module.get<EssayController>(EssayController);
  });

  it('에세이 작성', async () => {
    const createEssayDto = new CreateEssayReqDto();
    createEssayDto.title = 'title';
    createEssayDto.content = 'content';
    const expectedResponse = { id: 1, ...createEssayDto };

    mockEssayService.saveEssay.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .post('/essays')
      .send(createEssayDto)
      .expect(201)
      .expect(expectedResponse);
  });

  it('에세이 업데이트', async () => {
    const updateEssayDto = { title: 'Updated Essay', content: 'Updated content here' };
    const essayId = 1;
    const expectedResponse = { id: essayId, ...updateEssayDto };

    mockEssayService.updateEssay.mockResolvedValue(expectedResponse);

    await request(app.getHttpServer())
      .put(`/essays/${essayId}`)
      .send(updateEssayDto)
      .expect(200)
      .expect(expectedResponse);
  });

  it('쿼리 매개변수로 에세이 조회', async () => {
    const mockResponse = [{ id: 1, title: 'Sample Essay' }];
    mockEssayService.getMyEssays.mockResolvedValue(mockResponse);

    await request(app.getHttpServer())
      .get('/essays')
      .query({ page: 1, limit: 10, published: true, categoryId: 5 })
      .expect(200)
      .expect(mockResponse);
  });

  it('에세이 삭제', async () => {
    const essayId = 1;

    mockEssayService.deleteEssay.mockResolvedValue(true);

    await request(app.getHttpServer()).delete(`/essays/${essayId}`).expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
