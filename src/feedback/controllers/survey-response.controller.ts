import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';
import { SurveyResponseService } from '../services/survey-response.service';
import { SubmitSurveyResponseDto } from '../dto/survey-response.dto';

@Controller('survey-responses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SurveyResponseController {
  constructor(private readonly responseService: SurveyResponseService) {}

  @Post(':surveyId/start')
  async startSurvey(
    @Request() req: any,
    @Param('surveyId') surveyId: string,
  ) {
    return this.responseService.startSurvey(surveyId, req.user.employeeId);
  }

  @Post(':surveyId/submit')
  async submitResponse(
    @Request() req: any,
    @Param('surveyId') surveyId: string,
    @Body() dto: SubmitSurveyResponseDto,
  ) {
    return this.responseService.submitResponse(
      surveyId,
      req.user.employeeId,
      dto,
    );
  }

  @Get(':surveyId/my')
  async getMyResponse(
    @Request() req: any,
    @Param('surveyId') surveyId: string,
  ) {
    return this.responseService.getMyResponse(surveyId, req.user.employeeId);
  }

  @Get(':surveyId/all')
  @RequirePermissions({ action: 'read', resourceType: 'survey-response' })
  async getAllResponses(@Param('surveyId') surveyId: string) {
    return this.responseService.getAllResponses(surveyId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'survey-response' })
  async getResponse(@Param('id') id: string) {
    return this.responseService.getResponse(id);
  }
}
