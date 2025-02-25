import { Request as ExpressRequest } from 'express';

import { DeviceType, DeviceOS } from '../../entities/device.entity';
import { UserStatus } from '../../entities/user.entity';

declare global {
  namespace Express {
    export interface User {
      id?: number;
      nickname?: string | null;
      email: string | null;
      password?: string | null;
      gender?: string | null;
      status?: UserStatus;
      platform?: string | null;
      platformId?: string | null;
      birthDate?: Date | null;
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: Date;
      deactivationDate?: Date | null;
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
