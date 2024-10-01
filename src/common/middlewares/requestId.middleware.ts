import { Injectable, NestMiddleware } from '@nestjs/common';
// import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // req.requestId = uuidv4();
    req['requestId'] = nanoid(10);
    next();
  }
}
