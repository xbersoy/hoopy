import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Enable validation pipe
  app.useGlobalPipes(new ValidationPipe());
  
  // Enable CORS
  app.enableCors();
  
  const port = configService.get('app.port');
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
