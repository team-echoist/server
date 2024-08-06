import { Request as ExpressRequest } from 'express';
import { UserStatus } from '../../entities/user.entity';
import { DeviceType, UserOS } from '../../entities/device.entity';

declare global {
  namespace Express {
    export interface User {
      id?: number;
      nickname?: string;
      email: string;
      password?: string;
      gender?: string;
      status?: UserStatus;
      platform?: string;
      platformId?: string;
      birthDate?: Date;
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: Date;
      deactivationDate?: Date;
      isFirst?: boolean;
    }

    export interface DeviceDto {
      os: UserOS;
      type: DeviceType;
      model: string;
    }

    export interface Request {
      user?: User;
      token?: string;
      device: DeviceDto;
      platform?: string;
      platformId?: string;
      accessToken?: string;
      isFirst?: boolean;
    }
  }
}
