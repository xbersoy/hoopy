import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AttachmentsService } from '@/attachments/attachments.service';
import { Attachment } from '@/attachments/attachment.entity';

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let storageService: jest.Mocked<any>;
  let attachmentRepo: jest.Mocked<any>;

  const mockAttachment: Attachment = {
    id: 'att-1',
    url: 'https://bucket.supabase.co/storage/v1/object/public/hoopy/uploads/uuid-file.pdf',
    fileName: 'file.pdf',
    mimeType: 'application/pdf',
    size: 2048,
    relatedType: 'employee',
    relatedId: 'emp-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'file.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 2048,
    buffer: Buffer.from('test content'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    storageService = {
      upload: jest.fn().mockResolvedValue({ url: mockAttachment.url }),
      delete: jest.fn().mockResolvedValue(undefined),
      getPublicUrl: jest.fn().mockResolvedValue(mockAttachment.url),
    };

    attachmentRepo = {
      create: jest
        .fn()
        .mockImplementation((data) => ({ id: 'att-new', ...data })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findById: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findByRelated: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        { provide: 'StorageService', useValue: storageService },
        { provide: 'AttachmentRepository', useValue: attachmentRepo },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── upload ────────────────────────────────────────────────

  describe('upload', () => {
    it('should upload file to storage and persist metadata', async () => {
      const result = await service.upload(mockFile, 'employee', 'emp-1');

      expect(storageService.upload).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining('uploads/'),
      );
      expect(attachmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          url: mockAttachment.url,
          fileName: 'file.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          relatedType: 'employee',
          relatedId: 'emp-1',
        }),
      );
      expect(attachmentRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should generate a unique destination path per upload', async () => {
      await service.upload(mockFile, 'employee', 'emp-1');
      await service.upload(mockFile, 'employee', 'emp-1');

      const [firstCall, secondCall] = storageService.upload.mock.calls;
      // Different UUID prefixes → different paths
      expect(firstCall[1]).not.toBe(secondCall[1]);
    });

    it('should clean up storage when database save fails', async () => {
      attachmentRepo.save.mockRejectedValue(new Error('DB error'));

      await expect(
        service.upload(mockFile, 'employee', 'emp-1'),
      ).rejects.toThrow('DB error');

      expect(storageService.delete).toHaveBeenCalledWith(
        expect.stringMatching(/^uploads\/.*-file\.pdf$/),
      );
    });

    it('should not crash when both save and cleanup fail', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      attachmentRepo.save.mockRejectedValue(new Error('DB error'));
      storageService.delete.mockRejectedValue(
        new Error('Storage cleanup error'),
      );

      await expect(
        service.upload(mockFile, 'employee', 'emp-1'),
      ).rejects.toThrow('DB error');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete file after failed upload:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('should clean up storage when storage upload itself fails', async () => {
      storageService.upload.mockRejectedValue(new Error('Upload failed'));

      await expect(
        service.upload(mockFile, 'employee', 'emp-1'),
      ).rejects.toThrow('Upload failed');

      // Cleanup is attempted even if the upload failed
      expect(storageService.delete).toHaveBeenCalled();
    });
  });

  // ── delete ────────────────────────────────────────────────

  describe('delete', () => {
    it('should extract path from URL, delete storage file, and remove DB record', async () => {
      attachmentRepo.findById.mockResolvedValue(mockAttachment);

      await service.delete('att-1');

      expect(storageService.delete).toHaveBeenCalledWith(
        'uploads/uuid-file.pdf',
      );
      expect(attachmentRepo.remove).toHaveBeenCalledWith(mockAttachment);
    });

    it('should throw NotFoundException for non-existent attachment', async () => {
      await expect(service.delete('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findOne ───────────────────────────────────────────────

  describe('findOne', () => {
    it('should return attachment by id', async () => {
      attachmentRepo.findById.mockResolvedValue(mockAttachment);

      const result = await service.findOne('att-1');
      expect(result).toEqual(mockAttachment);
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findByRelated ─────────────────────────────────────────

  describe('findByRelated', () => {
    it('should return attachments for a related entity', async () => {
      attachmentRepo.findByRelated.mockResolvedValue([mockAttachment]);

      const result = await service.findByRelated('employee', 'emp-1');

      expect(result).toEqual([mockAttachment]);
      expect(attachmentRepo.findByRelated).toHaveBeenCalledWith(
        'employee',
        'emp-1',
      );
    });

    it('should return empty array when no attachments found', async () => {
      const result = await service.findByRelated('employee', 'emp-99');
      expect(result).toEqual([]);
    });
  });
});
