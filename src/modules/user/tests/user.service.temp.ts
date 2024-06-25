import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';
import { UtilsService } from '../../utils/utils.service';
import { AwsService } from '../../aws/aws.service';
import { UpdateUserReqDto } from '../dto/request/updateUserReq.dto';
import { UserResDto } from '../dto/response/userRes.dto';
import { EssayService } from '../../essay/essay.service';
import { FollowService } from '../../follow/follow.service';
import { BadgeService } from '../../badge/badge.service';
import { NicknameService } from '../../nickname/nickname.service';
import { AuthService } from '../../auth/auth.service';
import { BullModule, getQueueToken } from '@nestjs/bull';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));

// describe('UserService', () => {
//   let userService: UserService;
//   let mockUserRepository = {
//     findUserById: jest.fn(),
//     saveUser: jest.fn(),
//     updateUser: jest.fn(),
//   };
//   let mockUtilsService = {
//     getUUID: jest.fn(),
//     transformToDto: jest.fn(),
//   };
//   let mockAwsService = {
//     imageUploadToS3: jest.fn(),
//   };
//   const mockEssayService = {};
//   const mockFollowService = {};
//   const mockBadgeService = {};
//   const mockRedis = {
//     get: jest.fn(),
//     set: jest.fn(),
//     del: jest.fn(),
//     setex: jest.fn(),
//   };
//   const mockNicknameService = {
//     setNicknameUsage: jest.fn(),
//   };
//   const mockAuthService = {
//     checkNickname: jest.fn(),
//   };
//
//   beforeEach(async () => {
//     const RedisInstance = jest.fn(() => mockRedis);
//     const mockQueue = { add: jest.fn() };
//
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [
//         BullModule.registerQueue({
//           name: 'user',
//         }),
//       ],
//       providers: [
//         UserService,
//         { provide: UserRepository, useValue: mockUserRepository },
//         { provide: UtilsService, useValue: mockUtilsService },
//         { provide: AwsService, useValue: mockAwsService },
//         { provide: EssayService, useValue: mockEssayService },
//         { provide: FollowService, useValue: mockFollowService },
//         { provide: BadgeService, useValue: mockBadgeService },
//         { provide: NicknameService, useValue: mockNicknameService },
//         { provide: AuthService, useValue: mockAuthService },
//         { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
//         { provide: getQueueToken('user'), useValue: mockQueue },
//       ],
//     }).compile();
//
//     userService = module.get<UserService>(UserService);
//     mockUserRepository = module.get(UserRepository);
//     mockUtilsService = module.get(UtilsService);
//     mockAwsService = module.get(AwsService);
//   });
//
//   describe('findUserById', () => {
//     it('should find user by id', async () => {
//       const user = { id: 1, email: 'test@test.com' };
//       mockUserRepository.findUserById.mockResolvedValue(user);
//
//       const result = await userService.fetchUserEntityById(1);
//
//       expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
//       expect(result).toEqual(user);
//     });
//   });

// describe('saveProfileImage', () => {
//   it('should save profile image', async () => {
//     const user = { id: 1, profileImage: '' };
//     const mockImageFile = {
//       originalname: 'test.png',
//       buffer: Buffer.from('test'),
//     } as Express.Multer.File;
//     const mockImageUrl = 'http://example.com/test.png';
//     const newExt = 'png';
//     const fileName = 'uuid-test';
//
//     mockUserRepository.findUserById.mockResolvedValue(user);
//     mockUtilsService.getUUID.mockReturnValue('uuid-test');
//     mockAwsService.imageUploadToS3.mockResolvedValue(mockImageUrl);
//     mockUtilsService.transformToDto.mockReturnValue(mockImageUrl);
//
//     const result = await userService.saveProfileImage(1, mockImageFile);
//
//     expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
//     expect(mockUtilsService.getUUID).toHaveBeenCalled();
//     expect(mockAwsService.imageUploadToS3).toHaveBeenCalledWith(fileName, mockImageFile, newExt);
//     expect(mockUserRepository.saveUser).toHaveBeenCalledWith({
//       ...user,
//       profileImage: mockImageUrl,
//     });
//
//     expect(result).toEqual('http://example.com/test.png');
//   });
// });

// describe('updateUser', () => {
//   it('should update user', async () => {
//     const user = { id: 1, email: 'test@test.com', password: 'hashed-password' };
//     const updateUserReqDto: UpdateUserReqDto = { nickname: 'newNickname', password: 'password' };
//     const updatedUser = { ...user, nickname: 'newNickname', password: 'new-hashed-password' };
//
//     mockUserRepository.findUserById.mockResolvedValue(user);
//     mockUserRepository.updateUser.mockResolvedValue(updatedUser);
//
//     const result = await userService.updateUser(1, updateUserReqDto);
//
//     expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
//
//     if (result instanceof UserResDto) {
//       expect(result.email).toEqual('test@test.com');
//     }
//   });
// });
// });
