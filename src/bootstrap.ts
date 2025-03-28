import { VersioningType, Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { setupSwagger } from './bootstraps'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { APP_CONFIG } from '@infras/configuration'

export async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
	})
  
  const configService = app.get(ConfigService);
  
  // Enable validation pipe with transformation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

	app.enableVersioning({
		type: VersioningType.URI,
	})

	// bootstraps
	setupSwagger(app)

  const {
    env,
    host,
    port
  } = configService.get(APP_CONFIG)
  
	await app.listen(port, host, () => {
		Logger.log(`ENV:${env} - Application runs at ${host}:${port}`, 'App')
	})
}

