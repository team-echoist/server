import { InjectRepository } from '@nestjs/typeorm';
import { Notice } from '../../entities/notice.entity';
import { Repository } from 'typeorm';
import { Inquiry } from '../../entities/inquiry.entity';

export class SupportRepository {
  constructor(
    @InjectRepository(Inquiry) private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {}

  async saveNotice(newNotice: Notice) {
    return this.noticeRepository.save(newNotice);
  }

  async findNotice(noticeId: number) {
    return this.noticeRepository.findOne({
      where: { id: noticeId },
      relations: ['processor'],
    });
  }

  async findNotices(page: number, limit: number) {
    const [notices, total] = await this.noticeRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdDate: 'DESC',
      },
    });

    return { notices, total };
  }
}