import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as useragent from 'useragent';

// default import를 사용하면 useragent의 lookup 및 parse 멤버를 인식 못함

@Injectable()
export class DeviceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userAgent = request.headers['user-agent'];
    const agent = useragent.parse(userAgent);

    request.device = this.determineDevice(agent);

    return next.handle().pipe(
      map((data) => {
        return data;
      }),
    );
  }

  private determineDevice(agent: useragent.Agent): string {
    if (agent.device.family === 'iPhone') return 'iPhone';
    if (agent.device.family === 'iPad') return 'iPad';
    if (agent.os.family === 'Android') return 'Android';
    if (agent.os.family === 'Windows' || agent.os.family === 'Mac OS X') return 'Desktop';

    return 'Other';
  }
}
