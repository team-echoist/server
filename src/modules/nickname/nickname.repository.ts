import { InjectRepository } from '@nestjs/typeorm';
import { BasicNickname } from '../../entities/basicNickname.entity';
import { Repository } from 'typeorm';

export class NicknameRepository {
  constructor(
    @InjectRepository(BasicNickname) private readonly nicknameRepository: Repository<BasicNickname>,
  ) {}

  async findUniqueNickname(digits: number) {
    return await this.nicknameRepository
      .createQueryBuilder('nickname')
      .where('CHAR_LENGTH(nickname.nickname) = :length', { length: digits })
      .andWhere('nickname.isUsed = :isUsed', { isUsed: false })
      .select(['nickname.nickname'])
      .orderBy('nickname.id', 'ASC')
      .limit(1000)
      .getMany();
  }

  async usedNicknameUpdate(usedNickname: string) {
    await this.nicknameRepository.update({ nickname: usedNickname }, { isUsed: true });
  }

  async findByNickname(nickname: string): Promise<BasicNickname | null> {
    return this.nicknameRepository.findOne({ where: { nickname } });
  }

  async saveBasicNickname(basicNickname: BasicNickname): Promise<void> {
    await this.nicknameRepository.save(basicNickname);
  }
}
