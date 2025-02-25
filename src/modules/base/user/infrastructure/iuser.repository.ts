import { DeepPartial, DeleteResult } from 'typeorm';

import { DeactivationReason } from '../../../../entities/deactivationReason.entity';
import { User } from '../../../../entities/user.entity';
import { CreateUserReqDto } from '../../auth/dto/request/createUserReq.dto';
import { UpdateUserReqDto } from '../dto/request/updateUserReq.dto';

export interface IUserRepository {
  findUserById(userId: number): Promise<User>;

  findUserByEmail(email: string): Promise<User | null>;

  saveUser(user: User): Promise<User>;

  usersCount(): Promise<number>;

  countDailyRegistrations(firstDayOfMonth: Date, lastDayOfMonth: Date): Promise<any[]>;

  countMonthlyRegistrations(year: number): Promise<any[]>;

  findUsers(
    today: Date,
    filter: string,
    page: number,
    limit: number,
  ): Promise<{ users: User[]; total: number }>;

  findUserDetailById(userId: number): Promise<User | null>;

  updateUser(user: User, data: UpdateUserReqDto): Promise<User>;

  increaseReputation(userId: number, newReputation: number): Promise<void>;

  decreaseReputation(userId: number, newReputation: number): Promise<void>;

  saveDeactivationReasons(deactivationReasons: DeactivationReason[]): Promise<void>;

  deleteAccount(userId: number, todayDate: string): Promise<void>;

  deleteAllAccount(): Promise<DeleteResult>;

  updateUserTable(userId: number, reputation: number): Promise<void>;

  searchUsers(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ users: User[]; total: number }>;

  findById(id: number): Promise<User | null>;

  findByIdWithEmail(payload: any): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  findByNickname(nickname: string): Promise<User | null>;

  saveUserDto(createUserDto: CreateUserReqDto): Promise<CreateUserReqDto & User>;

  findByPlatformId(platform: string, platformId: string): Promise<User | null>;
}
