import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BlockPhpRequestsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const forbiddenPaths = [/\/vendor\/phpunit/i];

    for (const path of forbiddenPaths) {
      if (path.test(req.url)) {
        return res.status(403).send('Forbidden');
      }
    }

    next();
  }
}
