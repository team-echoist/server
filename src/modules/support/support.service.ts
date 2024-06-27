import { Injectable } from '@nestjs/common';
import { SupportRepository } from './support.repository';
import { UtilsService } from '../utils/utils.service';
import { NoticesResDto } from './dto/response/noticesRes.dto';
import { NoticeResDto } from './dto/response/noticeRes.dto';
import { InquiryReqDto } from './dto/request/inquiryReq.dto';
import { Inquiry } from '../../entities/inquiry.entity';
import { UserService } from '../user/user.service';
import { InquiriesResDto } from './dto/response/inquiriesRes.dto';
import { InquiryResDto } from './dto/response/inquiryRes.dto';
import { UpdatedHistoryResDto } from './dto/response/updatedHistoryRes.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly utilsService: UtilsService,
    private readonly supportRepository: SupportRepository,
    private readonly userService: UserService,
  ) {}

  async getNotices(page: number, limit: number) {
    const { notices, total } = await this.supportRepository.findNotices(page, limit);
    const totalPage: number = Math.ceil(total / limit);

    const noticesDto = this.utilsService.transformToDto(NoticesResDto, notices);

    return { Notices: noticesDto, total, page, totalPage };
  }

  async getNotice(noticeId: number) {
    const notice = await this.supportRepository.findNotice(noticeId);

    return this.utilsService.transformToDto(NoticeResDto, notice);
  }

  async createInquiry(userId: number, data: InquiryReqDto) {
    const user = await this.userService.fetchUserEntityById(userId);
    const newInquiry = new Inquiry();

    newInquiry.user = user;
    newInquiry.content = data.content;
    newInquiry.type = data.type;
    newInquiry.title = data.title;

    await this.supportRepository.saveInquiry(newInquiry);
  }

  async getInquiries(userId: number) {
    const inquiries = await this.supportRepository.findInquiries(userId);

    return this.utilsService.transformToDto(InquiriesResDto, inquiries);
  }

  async getInquiry(userId: number, inquiryId: number) {
    const inquiry = await this.supportRepository.findInquiry(userId, inquiryId);

    return this.utilsService.transformToDto(InquiryResDto, inquiry);
  }

  async getUserUpdateHistories(page: number, limit: number) {
    const { histories, total } = await this.supportRepository.findUserUpdateHistories(page, limit);

    const totalPage = Math.ceil(total / limit);
    const historiesDto = this.utilsService.transformToDto(UpdatedHistoryResDto, histories);

    return { histories: historiesDto, total, page, totalPage };
  }
}
