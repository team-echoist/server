import { Request as ExpressRequest } from 'express';
import { UserStatus } from '../../entities/user.entity';
import { DeviceType, DeviceOS } from '../../entities/device.entity';

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
      tokenVersion?: number;
    }

    export interface DeviceDto {
      os: DeviceOS;
      type: DeviceType;
      model: string;
    }

    export interface Request {
      user?: User;
      device?: DeviceDto;
      requestId: string;
    }
  }
}
