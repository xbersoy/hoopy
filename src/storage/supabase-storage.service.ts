import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service.interface';
import { supabase } from '../supabase/supabase.client';

@Injectable()
export class SupabaseStorageService implements StorageService {
  constructor(private readonly configService: ConfigService) {}

  private get bucketName(): string {
    return this.configService.get<string>('SUPABASE_BUCKET', 'hoopy');
  }

  async upload(file: Express.Multer.File, destinationPath: string) {
    const { error } = await supabase.storage
      .from(this.bucketName)
      .upload(destinationPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    if (error) throw new Error('Failed to upload attachment: ' + error.message);

    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(destinationPath);
    return { url: data.publicUrl };
  }

  async delete(filePath: string) {
    await supabase.storage.from(this.bucketName).remove([filePath]);
  }

  async getPublicUrl(filePath: string) {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    return data.publicUrl;
  }
}
