import {
  Controller,
  Get,
  Post,
  Patch,
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
import { AnnouncementService } from '../services/announcement.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  QueryAnnouncementDto,
} from '../dto/announcement.dto';

@Controller('announcements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'announcement' })
  async create(@Request() req: any, @Body() dto: CreateAnnouncementDto) {
    return this.announcementService.create(req.user.companyId, req.user.id, dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'announcement' })
  async findAll(@Request() req: any, @Query() query: QueryAnnouncementDto) {
    return this.announcementService.findAll(req.user.companyId, query);
  }

  @Get('my-feed')
  async getMyAnnouncements(@Request() req: any) {
    return this.announcementService.getMyAnnouncements(req.user.employeeId);
  }

  @Get('my/unread')
  async getUnreadAnnouncements(@Request() req: any) {
    return this.announcementService.getUnreadAnnouncements(req.user.employeeId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.announcementService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions({ action: 'update', resourceType: 'announcement' })
  async update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementService.update(id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions({ action: 'publish', resourceType: 'announcement' })
  async publish(
    @Param('id') id: string,
    @Body('employeeIds') employeeIds: string[],
  ) {
    return this.announcementService.publish(id, employeeIds);
  }

  @Post(':id/schedule')
  @RequirePermissions({ action: 'publish', resourceType: 'announcement' })
  async schedule(
    @Param('id') id: string,
    @Body('publishAt') publishAt: string,
  ) {
    return this.announcementService.schedule(id, new Date(publishAt));
  }

  @Post(':id/archive')
  @RequirePermissions({ action: 'update', resourceType: 'announcement' })
  async archive(@Param('id') id: string) {
    return this.announcementService.archive(id);
  }

  @Patch(':id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.announcementService.markAsRead(id, req.user.employeeId);
  }

  @Patch(':id/unread')
  async markAsUnread(@Request() req: any, @Param('id') id: string) {
    return this.announcementService.markAsUnread(id, req.user.employeeId);
  }

  @Patch(':id/acknowledge')
  async acknowledge(@Request() req: any, @Param('id') id: string) {
    return this.announcementService.acknowledge(id, req.user.employeeId);
  }

  @Get(':id/stats')
  @RequirePermissions({ action: 'read', resourceType: 'announcement' })
  async getStats(@Param('id') id: string) {
    return this.announcementService.getStats(id);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'announcement' })
  async remove(@Param('id') id: string) {
    return this.announcementService.remove(id);
  }
}
