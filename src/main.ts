import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/httpExceiption.filter';
import { AppModule } from './app.module';
import { swaggerConfig } from '../swagger.config';
import * as helmet from 'helmet';
import * as dotenv from 'dotenv';

dotenv.config();

declare const module: any;
async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule, {
    cors: {
      origin: ['https://linkedoutapp.com', 'http://localhost:3000'],
      allowedHeaders: 'Content-Type, Authorization',
      exposedHeaders: [],
    },
  });
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(helmet.default());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

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
