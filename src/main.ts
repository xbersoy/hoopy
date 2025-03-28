import * as dotenv from 'dotenv'
if (!process.env.ENV) {
	dotenv.config()
}

import { bootstrap } from './bootstrap';
bootstrap();
