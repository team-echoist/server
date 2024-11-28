import { User } from '../../../../entities/user.entity';
import { UpdateUserReqDto } from '../dto/request/updateUserReq.dto';
import { DeactivationReason } from '../../../../entities/deactivationReason.entity';
import { DeleteResult } from 'typeorm';

export interface IUserRepository {
  findUserById(userId: number): Promise<User>;

  findUserByEmail(email: string): Promise<User>;

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

  findUserDetailById(userId: number): Promise<User>;

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
}
