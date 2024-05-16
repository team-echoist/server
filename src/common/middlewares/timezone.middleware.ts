import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';

@Injectable()
export class TimezoneMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    process.env.TZ = 'Asia/Seoul';
    next();
  }
}
