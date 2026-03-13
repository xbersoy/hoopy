import { INestApplicationContext } from '@nestjs/common';

export interface Seeder {
  run(app: INestApplicationContext): Promise<void>;
}
