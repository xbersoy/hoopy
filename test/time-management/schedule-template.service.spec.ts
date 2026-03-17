import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ScheduleTemplateService } from '@/time-management/schedules/services/schedule-template.service';
import { ScheduleTemplate } from '@/time-management/schedules/entities/schedule-template.entity';
import { ScheduleType } from '@/time-management/schedules/enums/schedule.enums';

describe('ScheduleTemplateService', () => {
  let service: ScheduleTemplateService;
  let templateRepo: jest.Mocked<any>;
  let i18nRepo: jest.Mocked<any>;

  const mockTemplate: ScheduleTemplate = {
    id: 'sched-1',
    companyId: 'comp-1',
    company: null as any,
    code: 'standard',
    name: 'Standard Schedule',
    description: 'Standard 9-5 schedule',
    scheduleType: ScheduleType.FIXED,
    workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    defaultStartTime: '09:00',
    defaultEndTime: '17:00',
    breakDurationMinutes: 60,
    isOvernight: false,
    weeklyHours: 40,
    isActive: true,
    metadata: null,
    translations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    templateRepo = {
      create: jest.fn().mockImplementation((data) => ({ id: undefined, ...data })),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: entity.id || 'sched-new' }),
      ),
      findOne: jest.fn().mockResolvedValue(null),
      findByCompany: jest.fn().mockResolvedValue([]),
      findByCode: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    i18nRepo = {
      upsert: jest.fn().mockResolvedValue(undefined),
      findByEntity: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleTemplateService,
        { provide: 'ScheduleTemplateRepository', useValue: templateRepo },
        { provide: 'ScheduleTemplateI18nRepository', useValue: i18nRepo },
      ],
    }).compile();

    service = module.get<ScheduleTemplateService>(ScheduleTemplateService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──

  describe('create', () => {
    it('should create a schedule template', async () => {
      templateRepo.save.mockResolvedValue({ ...mockTemplate, id: 'sched-new' });
      templateRepo.findOne.mockResolvedValue({ ...mockTemplate, id: 'sched-new' });

      const result = await service.create('comp-1', {
        code: 'standard',
        name: 'Standard Schedule',
        scheduleType: ScheduleType.FIXED,
      } as any);

      expect(templateRepo.findByCode).toHaveBeenCalledWith('comp-1', 'standard');
      expect(templateRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 'comp-1', code: 'standard' }),
      );
      expect(templateRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('sched-new');
    });

    it('should create with translations', async () => {
      templateRepo.save.mockResolvedValue({ ...mockTemplate, id: 'sched-new' });
      templateRepo.findOne.mockResolvedValue({ ...mockTemplate, id: 'sched-new' });

      await service.create('comp-1', {
        code: 'standard',
        name: 'Standard Schedule',
        scheduleType: ScheduleType.FIXED,
        translations: {
          en: { name: 'Standard Schedule', description: 'Standard 9-5' },
          tr: { name: 'Standart Çalışma', description: 'Standart 9-5 program' },
        },
      } as any);

      expect(i18nRepo.upsert).toHaveBeenCalledTimes(2);
      expect(i18nRepo.upsert).toHaveBeenCalledWith(
        'comp-1', 'sched-new', 'en', { name: 'Standard Schedule', description: 'Standard 9-5' },
      );
      expect(i18nRepo.upsert).toHaveBeenCalledWith(
        'comp-1', 'sched-new', 'tr', { name: 'Standart Çalışma', description: 'Standart 9-5 program' },
      );
    });

    it('should throw ConflictException if code already exists', async () => {
      templateRepo.findByCode.mockResolvedValue(mockTemplate);

      await expect(
        service.create('comp-1', {
          code: 'standard',
          name: 'Standard Schedule',
          scheduleType: ScheduleType.FIXED,
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── findAll ──

  describe('findAll', () => {
    it('should return templates for company', async () => {
      templateRepo.findByCompany.mockResolvedValue([mockTemplate]);
      const result = await service.findAll('comp-1');
      expect(result).toHaveLength(1);
      expect(templateRepo.findByCompany).toHaveBeenCalledWith('comp-1');
    });

    it('should return empty array when no templates exist', async () => {
      const result = await service.findAll('comp-1');
      expect(result).toEqual([]);
    });
  });

  // ── findOne ──

  describe('findOne', () => {
    it('should return a template by id', async () => {
      templateRepo.findOne.mockResolvedValue(mockTemplate);
      const result = await service.findOne('sched-1');
      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ──

  describe('update', () => {
    it('should update template fields', async () => {
      templateRepo.findOne
        .mockResolvedValueOnce({ ...mockTemplate })
        .mockResolvedValueOnce({ ...mockTemplate, name: 'Updated' });
      templateRepo.save.mockResolvedValue({ ...mockTemplate, name: 'Updated' });

      const result = await service.update('sched-1', { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });

    it('should upsert translations on update', async () => {
      templateRepo.findOne
        .mockResolvedValueOnce({ ...mockTemplate })
        .mockResolvedValueOnce({ ...mockTemplate });

      await service.update('sched-1', {
        translations: {
          en: { name: 'Updated Schedule' },
        },
      } as any);

      expect(i18nRepo.upsert).toHaveBeenCalledWith(
        'comp-1', 'sched-1', 'en', { name: 'Updated Schedule' },
      );
    });
  });

  // ── remove ──

  describe('remove', () => {
    it('should remove a template', async () => {
      templateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      const result = await service.remove('sched-1');
      expect(templateRepo.remove).toHaveBeenCalled();
      expect(result.id).toBe('sched-1');
    });

    it('should throw NotFoundException for non-existent template', async () => {
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
