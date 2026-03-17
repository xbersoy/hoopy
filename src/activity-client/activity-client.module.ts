import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ActivityClientService } from './services/activity-client.service';
import { ActivityPayloadBuilderService } from './services/activity-payload-builder.service';

@Module({
  imports: [HttpModule],
  providers: [ActivityClientService, ActivityPayloadBuilderService],
  exports: [ActivityClientService, ActivityPayloadBuilderService],
})
export class ActivityClientModule {}
