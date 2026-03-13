import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { Contact, ContactType } from './entities/contact.entity';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermissions } from '../permissions/decorators/require-permissions.decorator';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@Controller('contacts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'contact' })
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({
    status: 201,
    description: 'Contact successfully created',
    type: Contact,
  })
  async create(
    @Request() req,
    @Body() createContactDto: CreateContactDto,
  ): Promise<Contact> {
    return this.contactService.createContact(
      req.user,
      createContactDto.type,
      createContactDto.value,
      createContactDto.label,
      createContactDto.isPrimary,
    );
  }

  @Get('primary/:type')
  @RequirePermissions({ action: 'read', resourceType: 'contact' })
  @ApiOperation({ summary: 'Get primary contact of a specific type' })
  @ApiResponse({
    status: 200,
    description: 'Returns the primary contact',
    type: Contact,
  })
  async getPrimaryContact(
    @Request() req,
    @Param('type') type: ContactType,
  ): Promise<Contact> {
    return this.contactService.getPrimaryContact(req.user.id, type);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'contact' })
  @ApiOperation({ summary: 'Update a contact' })
  @ApiResponse({
    status: 200,
    description: 'Contact successfully updated',
    type: Contact,
  })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    return this.contactService.updateContact(id, req.user.id, updateContactDto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'contact' })
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiResponse({ status: 200, description: 'Contact successfully deleted' })
  async remove(@Request() req, @Param('id') id: string): Promise<void> {
    return this.contactService.deleteContact(id, req.user.id);
  }
}
