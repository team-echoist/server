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

dotenv.config();

declare const module: any;
async function bootstrap() {
  initializeTransactionalContext();
  const app: INestApplication = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['https://linkedoutapp.com', 'http://localhost:3000'],
    allowedHeaders: 'Content-Type, Authorization',
    exposedHeaders: 'Authorization',
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Expose-Headers', 'Authorization');
    next();
  });

  const server = app.getHttpAdapter().getInstance();
  server.get('/', (req: Request, res: Response) => {
    res.sendFile(join(__dirname, '../../src/common/images', 'seedimage.jpeg'));
  });

  app.setGlobalPrefix('/api');
  app.use(helmet.default());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new ResponseTransformInterceptor(),
    new LoggingInterceptor(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: false,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

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
