import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ACTIVITY_SERVICE_CONFIG } from '@infras/configuration';
import { ActivityLogPayload } from '../dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ActivityClientService {
  private readonly logger = new Logger(ActivityClientService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs = 5000;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const config = this.configService.get(ACTIVITY_SERVICE_CONFIG);
    this.baseUrl = config?.baseUrl || '';
    this.apiKey = config?.apiKey || '';
  }

  /**
   * Send an activity log to activity-service. Best-effort: failures are
   * logged but never propagated to the caller.
   */
  async log(payload: ActivityLogPayload): Promise<void> {
    if (!this.baseUrl) {
      this.logger.warn(
        'Activity service URL not configured — skipping activity log',
      );
      return;
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/internal/activity-logs`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey,
            },
            timeout: this.timeoutMs,
          },
        ),
      );
    } catch (error) {
      this.logger.error(
        `Failed to send activity log [${payload.action}]: ${error.message}`,
        error.stack,
      );
    }
  }
}
