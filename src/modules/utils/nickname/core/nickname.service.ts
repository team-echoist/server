import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { INicknameRepository } from '../infrastructure/inickname.repository';

@Injectable()
export class NicknameService {
  constructor(
    @Inject('INicknameRepository') private readonly nicknameRepository: INicknameRepository,
  ) {}

  @Transactional()
  async generateUniqueNickname(): Promise<string> {
    const maxDigits = 6;

    for (let digits = 3; digits <= maxDigits; digits++) {
      const nicknames = await this.nicknameRepository.findUniqueNickname(digits);

      if (nicknames.length > 0) {
        const randomIndex = Math.floor(Math.random() * nicknames.length);
        const chosenNickname = nicknames[randomIndex];

        await this.nicknameRepository.usedNicknameUpdate(chosenNickname.nickname);

        return chosenNickname.nickname;
      }
    }

    throw new HttpException(
      'Unable to generate a unique nickname.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  async setNicknameUsage(nickname: string, isUsed: boolean) {
    const basicNickname = await this.nicknameRepository.findByNickname(nickname);
    if (basicNickname) {
      basicNickname.isUsed = isUsed;
      await this.nicknameRepository.saveBasicNickname(basicNickname);
    }
  }

  @Transactional()
  async resetNickname() {
    const nicknames = await this.nicknameRepository.findUsedNicknames();
    nicknames.forEach((nickname) => {
      nickname.isUsed = false;
    });

    await this.nicknameRepository.saveInitNickname(nicknames);
  }
}
