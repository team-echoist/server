import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export const swaggerConfig: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
  .setTitle('Linked-out API')
  .setDescription('The API description')
  .setVersion('1.0')
  .addBearerAuth({
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Input your JWT token',
    name: 'Authorization',
    in: 'header',
  })
  .addSecurityRequirements('bearer')
  .build();
