import { NestFactory, Reflector } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { NextFunction, Request, Response } from 'express';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/filters/httpExceiption.filter';
import { ResponseTransformInterceptor } from './common/interceptros/responseTransform.interceptor';
import { LoggingInterceptor } from './common/interceptros/logging.interceptor';
import { AppModule } from './app.module';
import { swaggerConfig } from './config/swagger.config';
import * as helmet from 'helmet';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as basicAuth from 'express-basic-auth';
import { writeFileSync } from 'fs';
import * as cors from 'cors';

import { join } from 'path';
import { UtilsService } from './modules/utils/utils.service';
import { AdminService } from './modules/admin/admin.service';
import { UserStatusInterceptor } from './common/interceptros/userStatus.interceptor';

dotenv.config();

declare const module: any;
async function bootstrap() {
  initializeTransactionalContext();

  const utilsService = new UtilsService();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { snapshot: true });

  const allowedOrigins = [
    'https://linkedoutapp.com',
    'https://linkedout-umber.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8888',
    'https://appleid.apple.com',
    'https://devtools.nestjs.com',
  ];

  // app.enableCors({
  //   origin: (origin, callback) => {
  //     if (allowedOrigins.includes(origin) || !origin) {
  //       callback(null, origin);
  //     } else {
  //       callback(new Error('Not allowed by CORS'));
  //     }
  //   },
  //   allowedHeaders:
  //     'Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, x-access-token, x-refresh-token, Accept, Observe',
  //   methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
  //   credentials: true,
  //   exposeHeaders: ['x-access-token', 'x-refresh-token'],
  // });

  const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    allowedHeaders:
      'Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, x-access-token, x-refresh-token, Accept, Observe',
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    credentials: true,
    exposeHeaders: ['x-access-token', 'x-refresh-token'],
  };

  app.use(cors(corsOptions));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin as string;

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Accept, Observe',
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Expose-Headers', 'Authorization');
    next();
  });

  app.setGlobalPrefix('/api');
  app.useGlobalFilters(new HttpExceptionFilter(utilsService));
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggingInterceptor(),
    new UserStatusInterceptor(),
    new ResponseTransformInterceptor(utilsService),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: false,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:8888',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:8888',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:8888',
        ],
        connectSrc: [
          "'self'",
          'api.trusted.com',
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:8888',
        ],
        fontSrc: [
          "'self'",
          'fonts.gstatic.com',
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:8888',
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    }),
  );

  app.use(
    helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    }),
  );

  app.use('/.well-known', express.static(join(__dirname, '../.well-known')));

  const server = app.getHttpAdapter().getInstance();

  server.get('/health-check', (req: Request, res: Response) => {
    res.status(200).send('OK');
  });

  const adminService = app.get(AdminService);
  if (process.env.SWAGGER === 'true') {
    app.use(
      ['/api-doc', '/swagger.json'],
      basicAuth({
        authorizeAsync: true,
        authorizer: async (email, password, callback) => {
          const isValid = await adminService.validateSwagger(email, password);
          if (isValid) {
            return callback(null, true);
          } else {
            return callback(null, false);
          }
        },
        challenge: true,
      }),
    );
    const document: OpenAPIObject = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('/api-doc', app, document);
    writeFileSync(join(process.cwd(), 'swagger.json'), JSON.stringify(document));
  }

  await app.listen(process.env.SERVER_PORT);
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
