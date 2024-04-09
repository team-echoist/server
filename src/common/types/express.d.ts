// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request as ExpressRequest } from 'express';

declare global {
  namespace Express {
    export interface User {
      id?: number;
      email: string;
      password?: string;
      gender?: string;
      birthDate?: Date;
      oauthInfo?: object;
      admin?: boolean;
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: null;
    }

    export interface Request {
      user?: User;
      token?: string;
    }
  }
}
