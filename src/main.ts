import { NestFactory, Reflector } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { NextFunction, Request, Response } from 'express';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/httpExceiption.filter';
import { ResponseTransformInterceptor } from './common/interceptros/responseTransform.interceptor';
import { LoggingInterceptor } from './common/interceptros/logging.interceptor';
import { AppModule } from './app.module';
import { swaggerConfig } from '../swagger.config';
import * as helmet from 'helmet';
import * as dotenv from 'dotenv';

import { join } from 'path';
import { UtilsService } from './modules/utils/utils.service';
import { ConfigService } from '@nestjs/config';

dotenv.config();

declare const module: any;
async function bootstrap() {
  initializeTransactionalContext();

  const configService = new ConfigService();
  const utilsService = new UtilsService(configService);

  const app: INestApplication = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['https://linkedoutapp.com', 'http://localhost:3000', 'http://localhost:5173'],
    allowedHeaders: 'Content-Type, Authorization',
    exposedHeaders: 'Authorization',
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Expose-Headers', 'Authorization');
    next();
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.url === '/favicon.ico') {
      res.status(204).end();
    } else {
      next();
    }
  });
  app.setGlobalPrefix('/api');
  app.useGlobalFilters(new HttpExceptionFilter(utilsService));
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new ResponseTransformInterceptor(utilsService),
    new LoggingInterceptor(),
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
        scriptSrc: ["'self'", 'http://localhost:3000', 'http://localhost:5173'],
        styleSrc: ["'self'", "'unsafe-inline'", 'http://localhost:3000', 'http://localhost:5173'],
        imgSrc: ["'self'", 'data:', 'http://localhost:3000', 'http://localhost:5173'],
        connectSrc: ["'self'", 'api.trusted.com', 'http://localhost:3000', 'http://localhost:5173'],
        fontSrc: ["'self'", 'fonts.gstatic.com', 'http://localhost:3000', 'http://localhost:5173'],
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

  const server = app.getHttpAdapter().getInstance();
  server.get('/', (req: Request, res: Response) => {
    res.sendFile(join(__dirname, '../../src/common/images', 'seedimage.jpeg'));
  });

  if (process.env.SWAGGER === 'true') {
    const document: OpenAPIObject = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-doc', app, document);
  }

  await app.listen(process.env.SERVER_PORT);
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
