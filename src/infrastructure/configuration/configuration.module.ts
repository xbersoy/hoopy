import { DynamicModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigModuleOptions } from '@nestjs/config'
import configurationLoader from './configuration.global'
import { validateConfig } from './configuration.validator'

@Module({})
export class ConfigurationModule {
	static forRootAsync(options: ConfigModuleOptions): DynamicModule {
		return {
			module: ConfigModule,
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
					validate: validateConfig,
					envFilePath: options.envFilePath || '.env',
					load: [configurationLoader],
				}),
			],
			exports: [ConfigModule],
		}
	}
}
