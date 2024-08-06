import { ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServerStatus } from '../../entities/server.entity';
import { AdminService } from '../../modules/admin/admin.service';

@Injectable()
export class ServerGuard extends AuthGuard('admin-pass') {
  constructor(private readonly adminService: AdminService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const allowedAdminPathPrefix = '/api/admin';
    const allowedLoginPath = '/api/admin/login';

    if (request.originalUrl === allowedLoginPath) {
      return true;
    }

    let user = null;

    try {
      const canActivate = await super.canActivate(context);
      if (canActivate) {
        const request = context.switchToHttp().getRequest();
        user = request.user;
      }
    } catch (err) {}

    const currentStatus = await this.adminService.getServerStatus();
    console.log('가드에 도착한 캐시: ', currentStatus);

    const rootAdminId = 1;

    const isAdminPath = request.originalUrl.startsWith(allowedAdminPathPrefix);
    const isLoginPath = request.originalUrl === allowedLoginPath;

    switch (currentStatus) {
      case ServerStatus.OPEN:
        return true;

      case ServerStatus.MAINTENANCE:
        if (isAdminPath && user && user.activated) {
          return true;
        }
        throw new HttpException(
          'The server is currently under maintenance. Please try again later.',
          423,
        );

      case ServerStatus.CLOSED:
        if (isLoginPath || (isAdminPath && user && user.id === rootAdminId)) {
          return true;
        }
        throw new HttpException(
          'The server is currently closed. Access is restricted.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );

      // default:
      //   throw new HttpException(
      //     'Unexpected server status. Please contact support.',
      //     HttpStatus.INTERNAL_SERVER_ERROR,
      //   );
    }
  }
}
