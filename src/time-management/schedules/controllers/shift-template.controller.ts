import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../../permissions/decorators/require-permissions.decorator';
import { ShiftTemplateService } from '../services/shift-template.service';
import {
  CreateShiftTemplateDto,
  UpdateShiftTemplateDto,
} from '../dto/create-shift-template.dto';
import { ShiftTemplate } from '../entities/shift-template.entity';

@ApiTags('Shift Templates')
@ApiBearerAuth()
@Controller('time-management/shift-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ShiftTemplateController {
  constructor(private readonly service: ShiftTemplateService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'shift-template' })
  @ApiOperation({ summary: 'Create a shift template' })
  @ApiResponse({ status: 201, type: ShiftTemplate })
  create(
    @Req() req: any,
    @Body() dto: CreateShiftTemplateDto,
  ): Promise<ShiftTemplate> {
    return this.service.create(req.user.companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'shift-template' })
  @ApiOperation({ summary: 'Get all shift templates' })
  findAll(@Req() req: any): Promise<ShiftTemplate[]> {
    return this.service.findAll(req.user.companyId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'shift-template' })
  @ApiOperation({ summary: 'Get a shift template by ID' })
  @ApiResponse({ status: 200, type: ShiftTemplate })
  findOne(@Param('id') id: string): Promise<ShiftTemplate> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'shift-template' })
  @ApiOperation({ summary: 'Update a shift template' })
  @ApiResponse({ status: 200, type: ShiftTemplate })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShiftTemplateDto,
  ): Promise<ShiftTemplate> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'shift-template' })
  @ApiOperation({ summary: 'Delete a shift template' })
  @ApiResponse({ status: 200, type: ShiftTemplate })
  remove(@Param('id') id: string): Promise<ShiftTemplate> {
    return this.service.remove(id);
  }
}
