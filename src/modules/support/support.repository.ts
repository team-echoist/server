import { InjectRepository } from '@nestjs/typeorm';
import { Notice } from '../../entities/notice.entity';
import { Repository } from 'typeorm';
import { Inquiry } from '../../entities/inquiry.entity';
import { UpdatedHistory } from '../../entities/updatedHistory.entity';
import { AlertSettings } from '../../entities/alertSettings.entity';
import { UpdateAlertSettingsReqDto } from './dto/request/updateAlertSettings.dto';

export class SupportRepository {
  constructor(
    @InjectRepository(Inquiry) private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(Notice) private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(UpdatedHistory)
    private readonly updatedHistoryRepository: Repository<UpdatedHistory>,
    @InjectRepository(AlertSettings)
    private readonly alertSettingsRepository: Repository<AlertSettings>,
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

  async saveInquiry(newInquiry: Inquiry) {
    return this.inquiryRepository.save(newInquiry);
  }

  async findInquiries(userId: number) {
    return this.inquiryRepository.find({ where: { user: { id: userId } } });
  }

  async findAdminInquiries(page: number, limit: number, status: 'all' | 'unprocessed') {
    const queryBuilder = this.inquiryRepository
      .createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.user', 'user')
      .orderBy('inquiry.createdDate', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status === 'unprocessed') {
      queryBuilder.where('inquiry.processed = :processed', { processed: false });
    }

    const [inquiries, total] = await queryBuilder.getManyAndCount();

    return { inquiries, total };
  }

  async findInquiry(userId: number, inquiryId: number) {
    return this.inquiryRepository.findOne({ where: { user: { id: userId }, id: inquiryId } });
  }

  async findUnprocessedInquiry() {
    return this.inquiryRepository.find({ where: { processed: false } });
  }

  async findInquiryById(inquiryId: number) {
    return this.inquiryRepository.findOne({ where: { id: inquiryId }, relations: ['user'] });
  }

  async saveUpdateHistory(updateHistory: UpdatedHistory) {
    return this.updatedHistoryRepository.save(updateHistory);
  }

  async findAllUpdateHistories(page: number, limit: number) {
    const [histories, total] = await this.updatedHistoryRepository.findAndCount({
      order: {
        createdDate: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['processor'],
    });

    return { histories, total };
  }

  async findUserUpdateHistories(page: number, limit: number) {
    const [histories, total] = await this.updatedHistoryRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return { histories, total };
  }

  async createAlertSettings(data: UpdateAlertSettingsReqDto, userId: number) {
    return this.alertSettingsRepository.create({ ...data, user: { id: userId } });
  }

  async findSettings(userId: number) {
    return this.alertSettingsRepository.findOne({ where: { user: { id: userId } } });
  }

  async saveSettings(settings: AlertSettings) {
    return this.alertSettingsRepository.save(settings);
  }
}
