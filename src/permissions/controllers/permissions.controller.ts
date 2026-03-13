import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsService } from '../services/permissions.service';
import { Permission } from '../entities/permission.entity';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all available permissions' })
  @ApiResponse({
    status: 200,
    description: 'List of permissions',
    type: [Permission],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(): Promise<Permission[]> {
    return this.permissionsService.findAll();
  }
}
