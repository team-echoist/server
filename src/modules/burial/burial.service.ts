import { Injectable } from '@nestjs/common';
import { EssayRepository } from '../essay/essay.repository';
import { AlertService } from '../alert/service/alert.service';
import { UtilsService } from '../utils/utils.service';
import { SummaryEssayResDto } from '../essay/dto/response/summaryEssayRes.dto';

@Injectable()
export class BurialService {
  constructor(
    private readonly essayRepository: EssayRepository,
    private readonly alertService: AlertService,
    private readonly utilsService: UtilsService,
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
