import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { AuthGuard } from '@nestjs/passport';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { UpdateUserReqDto } from '../dto/request/updateUserReq.dto';
import { setTestUserMiddleware } from '../../../common/utils';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => {
    return jest.fn().mockImplementation(() => {
      return { canActivate: () => true };
    });
  },
}));

describe('UserController', () => {
  let app: INestApplication;
  let userService: UserService;

  const mockUserService = {
    saveProfileImage: jest.fn(),
    updateUser: jest.fn(),
  };

  // beforeEach(async () => {
  //   const module: TestingModule = await Test.createTestingModule({
  //     imports: [MulterModule.register({ dest: './upload' })],
  //     controllers: [UserController],
  //     providers: [{ provide: UserService, useValue: mockUserService }],
  //   })
  //     .overrideGuard(AuthGuard('jwt'))
  //     .useValue({ canActivate: () => true })
  //     .compile();
  //
  //   app = module.createNestApplication(new ExpressAdapter());
  //   app.use(setTestUserMiddleware({ id: 1 }));
  //   await app.init();
  //
  //   userService = module.get<UserService>(UserService);
  // });
  //
  // afterAll(async () => {
  //   await app.close();
  // });
  //
  // describe('saveProfileImage', () => {
  //   it('프로필 이미지 저장', async () => {
  //     const mockImageFile = {
  //       fieldname: 'image',
  //       originalname: 'test.png',
  //       encoding: '7bit',
  //       mimetype: 'image/png',
  //       destination: './upload',
  //       filename: 'test.png',
  //       path: 'test.png',
  //       size: 1024,
  //     };
  //
  //     const expectedResponse = 'http://example.com/test.png';
  //
  //     mockUserService.saveProfileImage.mockResolvedValue(expectedResponse);
  //
  //     await request(app.getHttpServer())
  //       .post('/users/images')
  //       .attach('image', Buffer.from('test'), 'test.png')
  //       .expect(201)
  //       .expect(expectedResponse);
  //
  //     expect(mockUserService.saveProfileImage).toHaveBeenCalledWith(
  //       expect.any(Number), // user ID
  //       expect.objectContaining({
  //         originalname: 'test.png',
  //       }),
  //     );
  //   });
  // });
  //
  // describe('updateUser', () => {
  //   it('유저 정보 업데이트', async () => {
  //     const updateUserReqDto: UpdateUserReqDto = { nickname: 'newNickname' };
  //     const expectedResponse = {
  //       id: 1,
  //       email: 'test@test.com',
  //       nickname: 'newNickname',
  //     };
  //
  //     mockUserService.updateUser.mockResolvedValue(expectedResponse);
  //
  //     await request(app.getHttpServer())
  //       .put('/users')
  //       .send(updateUserReqDto)
  //       .expect(200)
  //       .expect(expectedResponse);
  //
  //     expect(mockUserService.updateUser).toHaveBeenCalledWith(expect.any(Number), updateUserReqDto);
  //   });
  // });
});
