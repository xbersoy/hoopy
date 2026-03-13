import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AccountService } from '../services/account.service';
import { AccountSettingsDto } from '../dto/account-settings.dto';

@ApiTags('Account Preferences')
@Controller('accounts')
export class AccountPreferencesController {
  constructor(private readonly accountService: AccountService) {}

  @Get(':id/preferences')
  @ApiOperation({ summary: 'Get account preferences' })
  @ApiResponse({
    status: 200,
    description: 'Returns the structured settings/preferences for the account.',
  })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async getPreferences(@Param('id') id: string) {
    return this.accountService.getSettings(id);
  }

  @Put(':id/preferences')
  @ApiOperation({ summary: 'Update account preferences' })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated structured settings/preferences.',
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  async updatePreferences(
    @Param('id') id: string,
    @Body() dto: AccountSettingsDto,
  ) {
    return this.accountService.updateSettings(id, dto);
  }
}
