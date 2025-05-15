import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') || 3001;
  const logger = new Logger('Bootstrap');

  app.enableCors();

  logger.log(`Application starting with environment: ${process.env.NODE_ENV}`);
  logger.log(`Application is running on: http://localhost:${port}`);

  await app.listen(port);
}

void bootstrap();
