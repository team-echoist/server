import { Request as ExpressRequest } from 'express';
import { UserStatus } from '../../entities/user.entity';

declare global {
  namespace Express {
    export interface User {
      id?: number;
      email: string;
      password?: string;
      gender?: string;
      status?: UserStatus;
      role?: string;
      oauthInfo?: object;
      birthDate?: Date;
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: Date;
    }

    export interface Request {
      user?: User;
      token?: string;
      device?: string;
      platform?: string;
      platformId?: string;
      accessToken?: string;
    }
  }
}
