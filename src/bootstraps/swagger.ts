import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { DEBUG_CONFIG } from '@infras/configuration'

export default (app: INestApplication) => {
	const configService = app.get(ConfigService)
	const debugConfig = configService.get(DEBUG_CONFIG)
	
	if (debugConfig.enableSwagger) {
			const config = new DocumentBuilder()
			.setTitle('Hoopy API')
			.setDescription('The Hoopy API documentation')
			.setVersion('1.0')
			.addBearerAuth()
			.build();
		
		const document = SwaggerModule.createDocument(app, config);
		SwaggerModule.setup('api', app, document);
	}
}