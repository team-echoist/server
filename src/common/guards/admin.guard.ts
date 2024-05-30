import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminGuard extends AuthGuard('admin-jwt') {
  canActivate(context: ExecutionContext) {
    const canActivate = super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    return this.validate(request);
  }

  validate(request: any) {
    const user = request.user;
    if (user && user.active) {
      return true;
    }
    throw new UnauthorizedException('Admin access only');
  }
}
