import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allow specific domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow HTTP methods
    credentials: true, // Allow cookies to be sent
    allowedHeaders: 'Content-Type, Authorization', // Permitted request headers
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
