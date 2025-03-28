import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { DatabaseTypeOrmModule } from '@infras/database/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigurationModule } from '@infras/configuration';

@Module({
  imports: [
		ConfigurationModule.forRootAsync({
			envFilePath: '.env',
		}),
    UserModule,
    DatabaseTypeOrmModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
