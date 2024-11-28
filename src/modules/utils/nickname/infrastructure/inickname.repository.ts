import { BasicNickname } from '../../../../entities/basicNickname.entity';

export interface INicknameRepository {
  findUniqueNickname(digits: number): Promise<BasicNickname[]>;

  usedNicknameUpdate(usedNickname: string): Promise<void>;

  findByNickname(nickname: string): Promise<BasicNickname | null>;

  saveBasicNickname(basicNickname: BasicNickname): Promise<void>;

  findUsedNicknames(): Promise<BasicNickname[]>;

  saveInitNickname(nicknames: BasicNickname[]): Promise<BasicNickname[]>;
}
