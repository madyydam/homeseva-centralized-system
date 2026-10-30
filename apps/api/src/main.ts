import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env['PORT'] ?? 4000;
  await app.listen(port);
  console.log(`🚀 HomeSeva ERP Backend running on: http://localhost:${port}/api/v1`);
}

bootstrap();
