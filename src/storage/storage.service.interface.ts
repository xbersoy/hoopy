export interface StorageService {
  upload(file: Express.Multer.File, destinationPath: string): Promise<{ url: string }>;
  delete(filePath: string): Promise<void>;
  getPublicUrl(filePath: string): Promise<string>;
} 