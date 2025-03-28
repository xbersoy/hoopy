import { isDevelopment } from '@infras/common'
import { DEBUG_CONFIG, JWT_CONFIG, APP_CONFIG, REDIS_CONFIG } from './configuration.consts'

export default () => ({
	[DEBUG_CONFIG]: {
		enableSwagger: process.env.ENABLE_SWAGGER === '1' ? true : false,
	},
	[JWT_CONFIG]: {
		accessSecret: process.env.JWT_ACCESS_SECRET,
		refreshSecret: process.env.JWT_REFRESH_SECRET,
		accessTokenExpirationTime: process.env.ACCESS_TOKEN_EXPIRATION_TIME,
		refreshTokenExpirationTime: process.env.REFRESH_TOKEN_EXPIRATION_TIME,
	},
	[APP_CONFIG]: {
		port: parseInt(process.env.PORT, 10) || 8080,
		host: process.env.HOST,
		env: process.env.ENV,
	},
	[REDIS_CONFIG]: {
		host: isDevelopment() ? '127.0.0.1' : process.env.REDIS_HOST,
		port: isDevelopment() ? 6379 : process.env.REDIS_PORT,
		username: isDevelopment() ? '' : process.env.REDIS_USERNAME,
		password: isDevelopment() ? '' : process.env.REDIS_PASSWORD,
	}
})