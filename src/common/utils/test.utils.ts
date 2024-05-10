import { NextFunction, Request as ExpressRequest } from 'express';

export function setTestUserMiddleware(user: any) {
  return function (req: ExpressRequest, res: Response, next: NextFunction) {
    req.user = user;
    next();
  };
}
