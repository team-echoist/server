import { Test, TestingModule } from '@nestjs/testing';
import { BookmarkController } from '../bookmark.controller';
import { BookmarkService } from '../bookmark.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';
import { EssayIdsReqDto } from '../dto/request/essayIdsReq.dto';

jest.mock('../bookmark.service');

describe('BookmarkController', () => {
  let controller: BookmarkController;
  let service: jest.Mocked<BookmarkService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({}), ConfigModule.forRoot()],
      controllers: [BookmarkController],
      providers: [BookmarkService],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<BookmarkController>(BookmarkController);
    service = module.get<BookmarkService>(BookmarkService) as jest.Mocked<BookmarkService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserBookmarks', () => {
    it('should call service getUserBookmarks method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const page = 1;
      const limit = 10;
      const bookmarks = { essays: [], total: 0, page: 0, totalPage: 0 };
      service.getUserBookmarks.mockResolvedValue(bookmarks);

      const result = await controller.getUserBookmarks(req, page, limit);
      expect(service.getUserBookmarks).toHaveBeenCalledWith(req.user.id, page, limit);
      expect(result).toEqual(bookmarks);
    });
  });

  describe('addBookmark', () => {
    it('should call service addBookmark method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const essayId = 1;

      await controller.addBookmark(req, essayId);
      expect(service.addBookmark).toHaveBeenCalledWith(req.user.id, essayId);
    });
  });

  describe('removeBookmarks', () => {
    it('should call service removeBookmarks method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;
      const body: EssayIdsReqDto = { essayIds: [1, 2, 3] };

      await controller.removeBookmarks(req, body);
      expect(service.removeBookmarks).toHaveBeenCalledWith(req.user.id, body.essayIds);
    });
  });

  describe('resetBookmarks', () => {
    it('should call service resetBookmarks method', async () => {
      const req: ExpressRequest = { user: { id: 1 } } as any;

      await controller.resetBookmarks(req);
      expect(service.resetBookmarks).toHaveBeenCalledWith(req.user.id);
    });
  });
});
