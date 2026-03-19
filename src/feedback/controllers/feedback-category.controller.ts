import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permissions.decorator';
import { FeedbackCategoryService } from '../services/feedback-category.service';
import {
  CreateFeedbackCategoryDto,
  UpdateFeedbackCategoryDto,
} from '../dto/feedback-category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeedbackCategoryController {
  constructor(private readonly categoryService: FeedbackCategoryService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'feedback-category' })
  async create(@Request() req: any, @Body() dto: CreateFeedbackCategoryDto) {
    return this.categoryService.create(req.user.companyId, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'feedback-category' })
  async findAll(@Request() req: any) {
    return this.categoryService.findAll(req.user.companyId);
  }

  @Get('active')
  async findActive(@Request() req: any) {
    return this.categoryService.findActive(req.user.companyId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'feedback-category' })
  async findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions({ action: 'update', resourceType: 'feedback-category' })
  async update(@Param('id') id: string, @Body() dto: UpdateFeedbackCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'feedback-category' })
  async remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
