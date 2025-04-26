import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageService } from '../storage/storage.service.interface';
import { Attachment } from './attachment.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AttachmentsService {
  constructor(
    @Inject('StorageService') private storageService: StorageService,
    @InjectRepository(Attachment) private attachmentRepository: Repository<Attachment>
  ) {}

  async upload(file: Express.Multer.File, relatedType: string, relatedId: string) {
    const destinationPath = `uploads/${uuidv4()}-${file.originalname}`;
    
    try {
      const { url } = await this.storageService.upload(file, destinationPath);

      const attachment = this.attachmentRepository.create({
        url,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        relatedType,
        relatedId,
      });

      return await this.attachmentRepository.save(attachment);
    } catch (error) {
      // If database save fails, try to clean up the uploaded file
      try {
        await this.storageService.delete(destinationPath);
      } catch (deleteError) {
        // Log the error but don't throw it since the original error is more important
        console.error('Failed to delete file after failed upload:', deleteError);
      }
      throw error;
    }
  }

  async delete(id: string) {
    const attachment = await this.attachmentRepository.findOne({ where: { id } });
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID "${id}" not found`);
    }

    const filePath = attachment.url.split('/storage/v1/object/public/hoopy/')[1];
    await this.storageService.delete(filePath);
    await this.attachmentRepository.remove(attachment);
  }

  async findOne(id: string) {
    const attachment = await this.attachmentRepository.findOne({ where: { id } });
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID "${id}" not found`);
    }
    return attachment;
  }

  async findByRelated(relatedType: string, relatedId: string) {
    return this.attachmentRepository.find({
      where: {
        relatedType,
        relatedId,
      },
    });
  }
} 