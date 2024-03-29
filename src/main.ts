import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/httpExceiption.filter';
import * as helmet from 'helmet';
import * as dotenv from 'dotenv';

dotenv.config();
declare const module: any;
async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule, {
    cors: {
      origin: '*', // TODO 도메인 발급시 변경
      allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      exposedHeaders: 'Authorization',
    },
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors();
  app.use(helmet.default());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription('')
    .setVersion('1.0')
    .build();
  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.SERVER_PORT);
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
