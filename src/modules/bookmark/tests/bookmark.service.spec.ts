import { Test, TestingModule } from '@nestjs/testing';
import { BookmarkService } from '../bookmark.service';
import { BookmarkRepository } from '../bookmark.repository';
import { UtilsService } from '../../utils/utils.service';
import { EssayService } from '../../essay/essay.service';
import { UserService } from '../../user/user.service';
import { getQueueToken } from '@nestjs/bull';
import { HttpException, HttpStatus } from '@nestjs/common';
import { User } from '../../../entities/user.entity';
import { Essay, EssayStatus } from '../../../entities/essay.entity';
import { Queue } from 'bull';
import { Bookmark } from '../../../entities/bookmark.entity';
import { SummaryEssayResDto } from '../../essay/dto/response/summaryEssayRes.dto';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('../bookmark.repository');
jest.mock('../../utils/utils.service');
jest.mock('../../essay/essay.service');
jest.mock('../../user/user.service');

describe('BookmarkService', () => {
  let service: BookmarkService;
  let bookmarkRepository: jest.Mocked<BookmarkRepository>;
  let utilsService: jest.Mocked<UtilsService>;
  let essayService: jest.Mocked<EssayService>;
  let userService: jest.Mocked<UserService>;
  let bookmarkQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarkService,
        BookmarkRepository,
        UtilsService,
        EssayService,
        UserService,
        {
          provide: getQueueToken('bookmark'),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<BookmarkService>(BookmarkService);
    bookmarkRepository = module.get(BookmarkRepository);
    utilsService = module.get(UtilsService);
    essayService = module.get(EssayService);
    userService = module.get(UserService);
    bookmarkQueue = module.get(getQueueToken('bookmark'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserBookmarks', () => {
    it('should return user bookmarks', async () => {
      const userId = 1;
      const page = 1;
      const limit = 10;
      const bookmarks = [{ essay: { content: 'content' } }] as Bookmark[];
      const total = 1;
      const transformedEssays = [{ content: 'transformed content' }];

      bookmarkRepository.findUserBookmarks.mockResolvedValue({ bookmarks, total });
      utilsService.extractPartContent.mockImplementation((content) => `transformed ${content}`);
      utilsService.transformToDto.mockReturnValue(transformedEssays);

      const result = await service.getUserBookmarks(userId, page, limit);

      expect(bookmarkRepository.findUserBookmarks).toHaveBeenCalledWith(userId, page, limit);
      expect(utilsService.extractPartContent).toHaveBeenCalledWith('content');
      expect(utilsService.transformToDto).toHaveBeenCalledWith(SummaryEssayResDto, [
        { content: 'transformed content' },
      ]);
      expect(result).toEqual({ essays: transformedEssays, totalPage: 1, page, total });
    });
  });

  describe('addBookmark', () => {
    it('should add a new bookmark', async () => {
      const userId = 1;
      const essayId = 1;
      const user = { id: userId } as User;
      const essay = { id: essayId, status: EssayStatus.PUBLISHED, author: { id: 2 } } as Essay;

      userService.fetchUserEntityById.mockResolvedValue(user);
      essayService.getEssayById.mockResolvedValue(essay);
      bookmarkRepository.findBookmark.mockResolvedValue(null);
      userService.increaseReputation.mockResolvedValue(undefined);
      essayService.increaseTrendScore.mockResolvedValue(undefined);

      await service.addBookmark(userId, essayId);

      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(userId);
      expect(essayService.getEssayById).toHaveBeenCalledWith(essayId);
      expect(bookmarkRepository.findBookmark).toHaveBeenCalledWith(user, essay);
      expect(bookmarkRepository.addBookmark).toHaveBeenCalledWith(user, essay);
      expect(userService.increaseReputation).toHaveBeenCalledWith(essay.author, 1);
      expect(essayService.increaseTrendScore).toHaveBeenCalledWith(essay, 2);
    });

    it('should throw an error if essay is private', async () => {
      const userId = 1;
      const essayId = 1;
      const user = { id: userId } as User;
      const essay = { id: essayId, status: EssayStatus.PRIVATE } as Essay;

      userService.fetchUserEntityById.mockResolvedValue(user);
      essayService.getEssayById.mockResolvedValue(essay);

      await expect(service.addBookmark(userId, essayId)).rejects.toThrow(
        new HttpException('Bad request.', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw an error if bookmark already exists', async () => {
      const userId = 1;
      const essayId = 1;
      const user = { id: userId } as User;
      const essay = { id: essayId } as Essay;
      const bookmark = { id: 1 } as Bookmark;

      userService.fetchUserEntityById.mockResolvedValue(user);
      essayService.getEssayById.mockResolvedValue(essay);
      bookmarkRepository.findBookmark.mockResolvedValue(bookmark);

      await expect(service.addBookmark(userId, essayId)).rejects.toThrow(
        new HttpException('Bookmark already exists.', HttpStatus.CONFLICT),
      );
    });
  });

  describe('removeBookmarks', () => {
    it('should remove bookmarks and decrease author reputation', async () => {
      const userId = 1;
      const essayIds = [1];
      const essay = { id: 1, author: { id: 2 } } as Essay;
      const bookmark = { essay } as Bookmark;
      const bookmarks = [bookmark];

      bookmarkRepository.findBookmarks.mockResolvedValue(bookmarks);
      userService.decreaseReputation.mockResolvedValue(undefined);
      bookmarkRepository.removeBookmarks.mockResolvedValue(undefined);

      await service.removeBookmarks(userId, essayIds);

      expect(bookmarkRepository.findBookmarks).toHaveBeenCalledWith(userId, essayIds);
      expect(userService.decreaseReputation).toHaveBeenCalledWith(2, 1);
      expect(bookmarkRepository.removeBookmarks).toHaveBeenCalledWith(bookmarks);
    });
  });

  describe('resetBookmarks', () => {
    it('should add resetBookmarks job to the queue', async () => {
      const userId = 1;
      const bookmarks = [{ id: 1 }] as Bookmark[];

      bookmarkRepository.findAllBookmarks.mockResolvedValue(bookmarks);
      bookmarkQueue.add.mockResolvedValue(undefined);

      await service.resetBookmarks(userId);

      expect(bookmarkRepository.findAllBookmarks).toHaveBeenCalledWith(userId);
    });
  });

  describe('handleResetBookmarks', () => {
    it('should handle reset bookmarks and decrease author reputation', async () => {
      const bookmarks = [
        { essay: { id: 1, author: { id: 2 } } },
        { essay: { id: 2, author: { id: 3 } } },
      ] as Bookmark[];

      userService.decreaseReputation.mockResolvedValue(undefined);
      bookmarkRepository.removeBookmarks.mockResolvedValue(undefined);

      await service.handleResetBookmarks(bookmarks);

      expect(userService.decreaseReputation).toHaveBeenCalledWith(2, 1);
      expect(userService.decreaseReputation).toHaveBeenCalledWith(3, 1);
      expect(bookmarkRepository.removeBookmarks).toHaveBeenCalledWith(bookmarks);
    });
  });

  describe('getBookmark', () => {
    it('should return a bookmark', async () => {
      const user = { id: 1 } as User;
      const essay = { id: 1 } as Essay;
      const bookmark = { id: 1 } as Bookmark;

      bookmarkRepository.findBookmark.mockResolvedValue(bookmark);

      const result = await service.getBookmark(user, essay);

      expect(bookmarkRepository.findBookmark).toHaveBeenCalledWith(user, essay);
      expect(result).toBe(bookmark);
    });
  });
});
