import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AdminAccessGuard } from '../guards/admin-access.guard';
import { RequireAdminPrivilege } from '../decorators/require-admin-privilege.decorator';
import { AdminAccessService } from '../services/admin-access.service';
import {
  GrantAdminAccessDto,
  UpdateAdminAccessDto,
} from '../dto/admin-access.dto';

@ApiTags('Admin Access')
@ApiBearerAuth()
@Controller('admin-access')
@UseGuards(JwtAuthGuard, AdminAccessGuard)
@RequireAdminPrivilege('permission-management')
export class AdminAccessController {
  constructor(private readonly adminAccessService: AdminAccessService) {}

  @Get()
  @ApiOperation({
    summary:
      'List all administrative access entries for users in the current company',
  })
  @ApiResponse({ status: 200, description: 'List of admin access entries' })
  findAll(@Req() req) {
    return this.adminAccessService.findAllByAccountAndCompany(
      req.user.accountId,
      req.user.companyId,
    );
  }

  @Get('eligible-users')
  @ApiOperation({
    summary:
      'List users in the same company that can be granted admin access',
  })
  @ApiResponse({ status: 200, description: 'List of eligible users' })
  getEligibleUsers(@Req() req) {
    return this.adminAccessService.getEligibleUsers(
      req.user.accountId,
      req.user.companyId,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Grant administrative access to a user' })
  @ApiResponse({ status: 201, description: 'Admin access granted' })
  @ApiResponse({ status: 400, description: 'User not in same company' })
  @ApiResponse({ status: 409, description: 'Entry already exists' })
  grant(@Body() dto: GrantAdminAccessDto, @Req() req) {
    return this.adminAccessService.grant(
      dto.userId,
      req.user.accountId,
      req.user.companyId,
      dto.privileges as any,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update administrative access privileges' })
  @ApiResponse({ status: 200, description: 'Admin access updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminAccessDto,
    @Req() req,
  ) {
    return this.adminAccessService.update(
      id,
      req.user.accountId,
      dto.privileges as any,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke all administrative access for a user' })
  @ApiResponse({ status: 200, description: 'Admin access revoked' })
  @ApiResponse({ status: 404, description: 'Not found' })
  revoke(@Param('id') id: string, @Req() req) {
    return this.adminAccessService.revoke(id, req.user.accountId);
  }
}
