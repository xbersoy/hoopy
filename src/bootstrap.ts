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
    port,
    cors
  } = configService.get(APP_CONFIG)
  
  // Enable CORS with configuration
  app.enableCors(cors);
  
	await app.listen(port, () => {
		Logger.log(`ENV:${env} - Application runs on ::${port}`, 'App')
	})
}

