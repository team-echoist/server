// import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
// import * as useragent from 'useragent';
// import { DeviceOS, DeviceType } from '../types/enum.types';
//
// // default import를 사용하면 useragent의 lookup 및 parse 멤버를 인식 못함
//
// @Injectable()
// export class DeviceInterceptor implements NestInterceptor {
//   constructor() {}
//
//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const request = context.switchToHttp().getRequest();
//     const userAgent = request.headers['user-agent'];
//     const agent = useragent.parse(userAgent);
//
//     request.device = this.determineDevice(agent);
//
//     return next.handle().pipe(
//       map((data) => {
//         return data;
//       }),
//     );
//   }
//
//   private determineDevice(agent: useragent.Agent) {
//     const osFamily = agent.os.family.toLowerCase();
//     const deviceFamily = agent.device.family.toLowerCase();
//
//     let os: string;
//     let type: string;
//
//     if (osFamily.includes('windows')) {
//       os = DeviceOS.WINDOW;
//       type = DeviceType.DESKTOP;
//     } else if (osFamily.includes('mac os x')) {
//       os = DeviceOS.MAC;
//       type = DeviceType.DESKTOP;
//     } else if (osFamily.includes('android')) {
//       os = DeviceOS.ANDROID;
//       type = DeviceType.MOBILE;
//       if (deviceFamily.includes('tablet')) {
//         type = DeviceType.TABLET;
//       }
//     } else if (osFamily.includes('ios')) {
//       os = DeviceOS.IOS;
//       type = deviceFamily.includes('ipad') ? DeviceType.TABLET : DeviceType.MOBILE;
//     } else if (osFamily.includes('linux')) {
//       os = DeviceOS.LINUX;
//       type = DeviceType.DESKTOP;
//     } else {
//       os = DeviceOS.UNKNOWN;
//       type = DeviceType.UNKNOWN;
//     }
//
//     if (
//       deviceFamily.includes('iphone') ||
//       (deviceFamily.includes('android') && type !== 'Tablet')
//     ) {
//       type = DeviceType.MOBILE;
//     } else if (deviceFamily.includes('ipad')) {
//       type = DeviceType.TABLET;
//     } else if (deviceFamily.includes('macbook')) {
//       type = DeviceType.LAPTOP;
//     }
//
//     return { os, type, model: deviceFamily };
//   }
// }
