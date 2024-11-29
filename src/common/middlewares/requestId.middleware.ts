import { Injectable, NestMiddleware } from '@nestjs/common';
import { nanoid } from 'nanoid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    req['requestId'] = nanoid(10);
    next();
  }
}
