import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompanyService } from '../services/company.service';
import { CompanySettingsDto } from '../dto/company-settings.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';

@ApiTags('Company Preferences')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompanyPreferencesController {
  constructor(private readonly companyService: CompanyService) {}

  @Get(':id/preferences')
  @RequirePermissions({ action: 'read', resourceType: 'company' })
  @ApiOperation({ summary: 'Get company preferences' })
  @ApiResponse({
    status: 200,
    description: 'Returns the structured settings/preferences for the company.',
  })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  async getPreferences(@Param('id') id: string) {
    return this.companyService.getSettings(id);
  }

  @Put(':id/preferences')
  @RequirePermissions({ action: 'update', resourceType: 'company' })
  @ApiOperation({ summary: 'Update company preferences' })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated structured settings/preferences.',
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  async updatePreferences(
    @Param('id') id: string,
    @Body() dto: CompanySettingsDto,
  ) {
    return this.companyService.updateSettings(id, dto);
  }
}
