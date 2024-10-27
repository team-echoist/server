import { Injectable } from '@nestjs/common';
import { EssayRepository } from '../essay/essay.repository';
import { CoordinateReqDto } from './dto/request/coordinateReq.dto';
import { AlertService } from '../alert/alert.service';

@Injectable()
export class BuryService {
  constructor(
    private readonly essayRepository: EssayRepository,
    private readonly alertService: AlertService,
  ) {}

  async notifyIfBurialNearby(userId: number, coordinates: CoordinateReqDto) {
    const nearbyEssaysCount = await this.essayRepository.findNearbyEssays(userId, coordinates);

    if (nearbyEssaysCount > 0) {
      await this.alertService.sendPushBurialNearby(userId);
    }
  }
}
