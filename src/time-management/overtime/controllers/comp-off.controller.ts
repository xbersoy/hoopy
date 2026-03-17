import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../../permissions/decorators/require-permissions.decorator';
import { CompOffService } from '../services/comp-off.service';
import { CompOffGrant } from '../entities/comp-off-grant.entity';

@ApiTags('Comp-Off')
@ApiBearerAuth()
@Controller('time-management/comp-off')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompOffController {
  constructor(private readonly compOffService: CompOffService) {}

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'comp-off' })
  @ApiOperation({ summary: 'Get comp-off grants by employee' })
  findAll(
    @Req() req: any,
    @Query('employeeId') employeeId: string,
  ): Promise<CompOffGrant[]> {
    return this.compOffService.findByEmployee(req.user.companyId, employeeId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'comp-off' })
  @ApiOperation({ summary: 'Get a comp-off grant by ID' })
  @ApiResponse({ status: 200, type: CompOffGrant })
  findOne(@Param('id') id: string): Promise<CompOffGrant> {
    return this.compOffService.findOne(id);
  }
}
