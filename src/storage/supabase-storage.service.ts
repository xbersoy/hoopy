import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service.interface';
import { supabase } from '../supabase/supabase.client';

@Injectable()
export class SupabaseStorageService implements StorageService {
  async upload(file: Express.Multer.File, destinationPath: string) {
    const { error } = await supabase.storage.from('hoopy').upload(destinationPath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });
    if (error) throw new Error('Failed to upload attachment: ' + error.message);

    const { data } = supabase.storage.from('hoopy').getPublicUrl(destinationPath);
    return { url: data.publicUrl };
  }

  async delete(filePath: string) {
    await supabase.storage.from('hoopy').remove([filePath]);
  }

  async getPublicUrl(filePath: string) {
    const { data } = supabase.storage.from('hoopy').getPublicUrl(filePath);
    return data.publicUrl;
  }
} 