import { Inject, Injectable } from '@nestjs/common';
import { AlertService } from '../../../management/alert/core/alert.service';
import { ToolService } from '../../../../utils/tool/core/tool.service';
import { SummaryEssayResDto } from '../../../../base/essay/dto/response/summaryEssayRes.dto';
import { IEssayRepository } from '../../../../base/essay/infrastructure/iessay.repository';

@Injectable()
export class BurialService {
  constructor(
    @Inject('IEssayRepository') private readonly essayRepository: IEssayRepository,
    private readonly alertService: AlertService,
    private readonly utilsService: ToolService,
  ) {}

  async notifyIfBurialNearby(userId: number, latitude: number, longitude: number) {
    const nearbyEssaysCount = await this.essayRepository.findNearbyEssaysCount(
      userId,
      latitude,
      longitude,
    );

    if (nearbyEssaysCount > 0) {
      await this.alertService.sendPushBurialNearby(userId);
    }
  }

  async findBurialNearby(userId: number, latitude: number, longitude: number) {
    const nearbyEssays = await this.essayRepository.findNearbyEssays(userId, latitude, longitude);

    return this.utilsService.transformToDto(SummaryEssayResDto, nearbyEssays);
  }
}
