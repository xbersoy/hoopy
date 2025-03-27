import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import typeormConfig from './typeorm.config'
import { TYPEORM_CONFIG_PROVIDER } from './typeorm.constants'

@Global()
@Module({
	imports: [
		ConfigModule.forFeature(typeormConfig),
		TypeOrmModule.forRootAsync({
			useFactory: (configService: ConfigService) => {
				return configService.get(TYPEORM_CONFIG_PROVIDER)
			},
			inject: [ConfigService],
		}),
	],
})
export class DatabaseTypeOrmModule {}
