import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AccountService } from '../services/account.service';
import { AccountSettingsDto } from '../dto/account-settings.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';

@ApiTags('Account Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounts')
export class AccountPreferencesController {
  constructor(private readonly accountService: AccountService) {}

  @Get(':id/preferences')
  @RequirePermissions({ action: 'read', resourceType: 'account' })
  @ApiOperation({ summary: 'Get account preferences' })
  @ApiResponse({
    status: 200,
    description: 'Returns the structured settings/preferences for the account.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async getPreferences(@Param('id') id: string) {
    return this.accountService.getSettings(id);
  }

  @Put(':id/preferences')
  @RequirePermissions({ action: 'update', resourceType: 'account' })
  @ApiOperation({ summary: 'Update account preferences' })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated structured settings/preferences.',
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async updatePreferences(
    @Param('id') id: string,
    @Body() dto: AccountSettingsDto,
  ) {
    return this.accountService.updateSettings(id, dto);
  }
}
