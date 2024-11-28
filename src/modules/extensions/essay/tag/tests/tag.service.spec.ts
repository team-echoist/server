import { Test, TestingModule } from '@nestjs/testing';
import { TagService } from '../core/tag.service';
import { TagRepository } from '../infrastructure/tag.repository';
import { Tag } from '../../../../../entities/tag.entity';

jest.mock('../infrastructure/tag.repository');

describe('TagService', () => {
  let service: TagService;
  let tagRepository: jest.Mocked<TagRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagService, TagRepository],
    }).compile();

    service = module.get<TagService>(TagService);
    tagRepository = module.get(TagRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTags', () => {
    it('should return an empty array if tagNames is null or empty', async () => {
      const result = await service.getTags([]);
      expect(result).toEqual([]);

      const resultNull = await service.getTags(null);
      expect(resultNull).toEqual([]);
    });

    it('should return processed tags', async () => {
      const tagNames = ['tag1', 'tag2'];
      const tags = [
        { id: 1, name: 'tag1' },
        { id: 2, name: 'tag2' },
      ] as Tag[];

      jest.spyOn(service as any, 'processTags').mockResolvedValue(tags);

      const result = await service.getTags(tagNames);
      expect(result).toEqual(tags);
      expect(service['processTags']).toHaveBeenCalledWith(tagNames);
    });
  });

  describe('processTags', () => {
    it('should return an empty array if tagNames is null or empty', async () => {
      const result = await service['processTags']([]);
      expect(result).toEqual([]);

      const resultNull = await service['processTags'](null);
      expect(resultNull).toEqual([]);
    });

    it('should return existing tags and create new ones if not found', async () => {
      const tagNames = ['tag1', 'tag2'];
      const tag1 = { id: 1, name: 'tag1' } as Tag;
      const tag2 = { id: 2, name: 'tag2' } as Tag;

      tagRepository.findTag.mockImplementation(async (name: string) => {
        if (name === 'tag1') return tag1;
        return null;
      });

      tagRepository.saveTag.mockImplementation(async (name: string) => {
        if (name === 'tag2') return tag2;
        return null;
      });

      const result = await service['processTags'](tagNames);
      expect(result).toEqual([tag1, tag2]);
      expect(tagRepository.findTag).toHaveBeenCalledWith('tag1');
      expect(tagRepository.findTag).toHaveBeenCalledWith('tag2');
      expect(tagRepository.saveTag).toHaveBeenCalledWith('tag2');
    });
  });
});
