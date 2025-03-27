import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { DatabaseTypeOrmModule } from '@infras/database/typeorm';
import { AuthModule } from './auth/auth.module';
import { jwtConfig, appConfig } from './config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, appConfig],
    }),
    UserModule,
    DatabaseTypeOrmModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
