import { 
  Controller, 
  Post, 
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  UseGuards,
  Body
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { Attachment } from './attachment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@ApiTags('Attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a new attachment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        relatedType: {
          type: 'string',
          example: 'employee',
        },
        relatedId: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
      required: ['file', 'relatedType', 'relatedId']
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The attachment has been successfully uploaded.',
    type: Attachment,
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('relatedType') relatedType: string,
    @Body('relatedId') relatedId: string,
  ) {
    return this.attachmentsService.upload(file, relatedType, relatedId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attachment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the attachment information.',
    type: Attachment,
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attachmentsService.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get attachments by related entity' })
  @ApiResponse({
    status: 200,
    description: 'Returns the list of attachments.',
    type: [Attachment],
  })
  async findByRelated(
    @Query('relatedType') relatedType: string,
    @Query('relatedId', ParseUUIDPipe) relatedId: string,
  ) {
    return this.attachmentsService.findByRelated(relatedType, relatedId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete attachment' })
  @ApiResponse({
    status: 200,
    description: 'The attachment has been successfully deleted.',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.attachmentsService.delete(id);
    return { message: 'Attachment deleted successfully' };
  }
} 