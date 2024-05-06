// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request as ExpressRequest } from 'express';

declare global {
  namespace Express {
    export interface User {
      id?: number;
      email: string;
      password?: string;
      gender?: string;
      banned?: boolean;
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
