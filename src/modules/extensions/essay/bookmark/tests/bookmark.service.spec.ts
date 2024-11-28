import { Test, TestingModule } from '@nestjs/testing';
import { BookmarkService } from '../core/bookmark.service';
import { BookmarkRepository } from '../infrastructure/bookmark.repository';
import { ToolService } from '../../../../utils/tool/tool.service';
import { EssayService } from '../../../../base/essay/core/essay.service';
import { UserService } from '../../../../base/user/core/user.service';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { EssayStatus } from '../../../../../common/types/enum.types';
import { HttpException, HttpStatus } from '@nestjs/common';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('../bookmark.repository');
jest.mock('../../../../utils/tool/tool.service');
jest.mock('../../essay/essay.service');
jest.mock('../../user/user.service');

describe('BookmarkService', () => {
  let bookmarkService: BookmarkService;
  let bookmarkRepository: jest.Mocked<BookmarkRepository>;
  let utilsService: jest.Mocked<ToolService>;
  let essayService: jest.Mocked<EssayService>;
  let userService: jest.Mocked<UserService>;
  let bookmarkQueue: jest.Mocked<Queue>;

  let user: any;
  let bookmark: any;
  let bookmarks: any;
  let essay: any;
  let anotherEssay: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarkService,
        { provide: BookmarkRepository, useClass: BookmarkRepository },
        { provide: ToolService, useClass: ToolService },
        { provide: EssayService, useClass: EssayService },
        { provide: UserService, useClass: UserService },
        {
          provide: getQueueToken('bookmark'),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();

    bookmarkService = module.get<BookmarkService>(BookmarkService);
    bookmarkRepository = module.get(BookmarkRepository) as jest.Mocked<BookmarkRepository>;
    utilsService = module.get(ToolService) as jest.Mocked<ToolService>;
    essayService = module.get(EssayService) as jest.Mocked<EssayService>;
    userService = module.get(UserService) as jest.Mocked<UserService>;
    bookmarkQueue = module.get(getQueueToken('bookmark')) as jest.Mocked<Queue>;

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
    bookmark = {
      id: 1,
      essay: {
        id: 1,
        content: '내용1',
        title: '에세이1',
        status: EssayStatus.PUBLISHED,
      },
    };
    bookmarks = [
      {
        id: 1,
        essay: {
          id: 1,
          content: '내용1',
          title: '에세이1',
          status: EssayStatus.PUBLISHED,
          author: { id: 1 },
        },
      },
      {
        id: 2,
        essay: {
          id: 2,
          content: '내용2',
          title: '에세이2',
          status: EssayStatus.PUBLISHED,
          author: { id: 2 },
        },
      },
    ];
    essay = {
      id: 1,
      title: '에세이1',
      content: '내용1',
      author: user,
    };
    anotherEssay = { id: 1, title: '에세이1', content: '내용1', author: { id: 2 } };
  });

  describe('getUserBookmarks', () => {
    it('북마크 조회', async () => {
      const page = 1;
      const limit = 10;
      bookmarkRepository.findUserBookmarks.mockResolvedValue({ bookmarks: bookmarks, total: 2 });

      const result = await bookmarkService.getUserBookmarks(user.id, page, limit);

      expect(result).toEqual({
        essays: bookmarks.map((bookmark) => ({
          ...bookmark.essay,
          content: bookmark.essay.content.substring(0, 20),
        })),
        totalPage: Math.ceil(result.total / limit),
        page,
        total: 2,
      });
    });
  });

  describe('addBookmark', () => {
    it('북마크: 본인에세이/비공개 북마크 불가', async () => {
      userService.fetchUserEntityById.mockResolvedValue(user);
      essayService.getEssayById.mockResolvedValue(essay);

      await expect(bookmarkService.addBookmark(user.id, essay.id)).rejects.toThrow(
        new HttpException(
          '자신의 에세이 혹은 비공개 에세이는 북마크할 수 없습니다.',
          HttpStatus.BAD_REQUEST,
        ),
      );
      expect(userService.fetchUserEntityById).toHaveBeenCalledWith(user.id);
      expect(essayService.getEssayById).toHaveBeenCalledWith(essay.id);
    });
  });

  it('북마크: 중복요청', async () => {
    userService.fetchUserEntityById.mockResolvedValue(user);
    essayService.getEssayById.mockResolvedValue(anotherEssay);
    bookmarkRepository.findBookmark.mockResolvedValue(bookmark);

    await expect(bookmarkService.addBookmark(user.id, essay.id)).rejects.toThrow(
      new HttpException('이미 북마크한 에세이 입니다.', HttpStatus.BAD_REQUEST),
    );
    expect(userService.fetchUserEntityById).toHaveBeenCalledWith(user.id);
    expect(essayService.getEssayById).toHaveBeenCalledWith(anotherEssay.id);
    expect(bookmarkRepository.findBookmark).toHaveBeenCalledWith(user, anotherEssay);
  });

  it('북마크: 성공', async () => {
    userService.fetchUserEntityById.mockResolvedValue(user);
    essayService.getEssayById.mockResolvedValue(anotherEssay);
    bookmarkRepository.findBookmark.mockResolvedValue(null);

    await bookmarkService.addBookmark(user.id, anotherEssay.id);

    expect(userService.fetchUserEntityById).toHaveBeenCalledWith(user.id);
    expect(essayService.getEssayById).toHaveBeenCalledWith(anotherEssay.id);
    expect(bookmarkRepository.findBookmark).toHaveBeenCalledWith(user, anotherEssay);
    expect(bookmarkRepository.addBookmark).toHaveBeenCalledWith(user, anotherEssay);
    expect(userService.increaseReputation).toHaveBeenCalledWith(anotherEssay.author, 1);
    expect(essayService.increaseTrendScore).toHaveBeenCalledWith(anotherEssay, 2);
  });

  describe('removeBookmarks', () => {
    it('북마크를 삭제하고 평판 감소', async () => {
      bookmarkRepository.findBookmarks.mockResolvedValue(bookmarks);
      userService.decreaseReputation.mockResolvedValue(undefined);
      bookmarkRepository.removeBookmarks.mockResolvedValue(undefined);

      await bookmarkService.removeBookmarks(user.id, [essay.id]);

      expect(bookmarkRepository.findBookmarks).toHaveBeenCalledWith(user.id, [essay.id]);
      expect(userService.decreaseReputation).toHaveBeenCalledWith(user.id, 1);
      expect(bookmarkRepository.removeBookmarks).toHaveBeenCalledWith(bookmarks);
    });
  });

  describe('resetBookmarks', () => {
    beforeEach(() => {
      bookmarks = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        essay: { id: i },
      }));

      jest.clearAllMocks();
    });

    it('북마크리셋: 배치로 나눠서 큐에 추가', async () => {
      bookmarkRepository.findAllBookmarks.mockResolvedValue(bookmarks);
      bookmarkQueue.add.mockResolvedValue(undefined);

      await bookmarkService.resetBookmarks(user.id);

      const batchSize = 10;
      const totalBatches = Math.ceil(bookmarks.length / batchSize);

      expect(bookmarkRepository.findAllBookmarks).toHaveBeenCalledWith(user.id);
      expect(bookmarkQueue.add).toHaveBeenCalledTimes(totalBatches);

      for (let i = 0; i < bookmarks.length; i += batchSize) {
        const batch = bookmarks.slice(i, i + batchSize);

        expect(bookmarkQueue.add).toHaveBeenCalledWith(
          'resetBookmarks',
          { batch },
          {
            attempts: 5,
            backoff: 5000,
            delay: i * 3000,
          },
        );
      }
    });
  });

  describe('handleResetBookmarks', () => {
    it('북마크리셋: 큐 작업', async () => {
      const bookmarks = [
        { essay: { author: { id: 1 } } },
        { essay: { author: { id: 1 } } },
        { essay: { author: { id: 2 } } },
        { essay: { author: { id: 3 } } },
        { essay: { author: { id: 3 } } },
        { essay: { author: { id: 3 } } },
      ] as any;

      bookmarkRepository.removeBookmarks.mockResolvedValue(undefined);
      userService.decreaseReputation.mockResolvedValue(undefined);

      await bookmarkService.handleResetBookmarks(bookmarks);

      expect(userService.decreaseReputation).toHaveBeenCalledTimes(3);
      expect(userService.decreaseReputation).toHaveBeenCalledWith(1, 2); // id 1 작가의 평판 감소 (2회)
      expect(userService.decreaseReputation).toHaveBeenCalledWith(2, 1); // id 2 작가의 평판 감소 (1회)
      expect(userService.decreaseReputation).toHaveBeenCalledWith(3, 3); // id 3 작가의 평판 감소 (3회)

      expect(bookmarkRepository.removeBookmarks).toHaveBeenCalledWith(bookmarks);
    });

    it('북마크리셋: 큐 작업시 음수 평판 감소 방지', async () => {
      const bookmarks = [{ essay: { author: { id: 1 } } }, { essay: { author: { id: 1 } } }] as any;

      bookmarkRepository.removeBookmarks.mockResolvedValue(undefined);
      userService.decreaseReputation.mockResolvedValue(undefined);

      // 평판이 음수가 되지 않도록 0보다 작을 때 조건을 맞추기 위한 테스트
      await bookmarkService.handleResetBookmarks(bookmarks);

      expect(userService.decreaseReputation).toHaveBeenCalledWith(1, 2);
      expect(bookmarkRepository.removeBookmarks).toHaveBeenCalledWith(bookmarks);
    });
  });
});
