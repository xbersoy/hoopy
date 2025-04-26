import { Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';

@Module({
  providers: [
    {
      provide: 'StorageService',
      useClass: SupabaseStorageService,
    },
  ],
  exports: ['StorageService'],
})
export class StorageModule {} 