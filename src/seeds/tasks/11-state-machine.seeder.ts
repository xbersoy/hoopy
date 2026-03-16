import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { StateMachineService } from '../../state-machine/services/state-machine.service';
import { CompanyService } from '../../company/services/company.service';
import { UserService } from '../../user/user.service';
import { StateMachineDefinitionStatus } from '../../state-machine/enums/state-machine.enums';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StateMachineDefinition } from '../../state-machine/entities/state-machine-definition.entity';
import { Repository } from 'typeorm';

export class StateMachineSeeder implements Seeder {
  private readonly logger = new Logger(StateMachineSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const smService = app.get(StateMachineService);
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);
    const smRepo = app.get<Repository<StateMachineDefinition>>(
      getRepositoryToken(StateMachineDefinition),
    );

    const users = await userService.findAll();
    const admin = users.find((u: any) => u.email === 'admin@admin.com');
    if (!admin) {
      this.logger.warn('Admin user not found — skipping state machine seed.');
      return;
    }

    const company = await companyService.findByOwner(admin.id);
    if (!company) {
      this.logger.warn('Admin company not found — skipping state machine seed.');
      return;
    }

    // Check if already seeded
    const existing = await smRepo.findOne({
      where: { companyId: company.id, code: 'leave_request_lifecycle' },
    });
    if (existing) {
      this.logger.log('State machine "leave_request_lifecycle" already exists — skipping.');
      return;
    }

    // Create Leave Request Lifecycle state machine
    const definition = await smService.createDefinition(company.id, {
      code: 'leave_request_lifecycle',
      resourceType: 'leave-request',
      category: 'lifecycle',
      initialStateCode: 'draft',
      metadata: { description: 'Lifecycle for employee leave requests' },
      translations: [
        { locale: 'en', name: 'Leave Request Lifecycle', description: 'Manages the lifecycle of leave request approvals' },
        { locale: 'tr', name: 'İzin Talebi Yaşam Döngüsü', description: 'İzin talebi onay süreçlerini yönetir' },
      ],
      states: [
        {
          code: 'draft',
          isInitial: true,
          isFinal: false,
          sortOrder: 0,
          color: '#6B7280',
          translations: [
            { locale: 'en', name: 'Draft', description: 'Request is being prepared' },
            { locale: 'tr', name: 'Taslak', description: 'Talep hazırlanıyor' },
          ],
        },
        {
          code: 'submitted',
          isInitial: false,
          isFinal: false,
          sortOrder: 1,
          color: '#3B82F6',
          translations: [
            { locale: 'en', name: 'Submitted', description: 'Request submitted for approval' },
            { locale: 'tr', name: 'Gönderildi', description: 'Talep onay için gönderildi' },
          ],
        },
        {
          code: 'manager_approved',
          isInitial: false,
          isFinal: false,
          sortOrder: 2,
          color: '#8B5CF6',
          translations: [
            { locale: 'en', name: 'Manager Approved', description: 'Approved by direct manager' },
            { locale: 'tr', name: 'Yönetici Onayladı', description: 'Direkt yönetici tarafından onaylandı' },
          ],
        },
        {
          code: 'approved',
          isInitial: false,
          isFinal: true,
          sortOrder: 3,
          color: '#10B981',
          translations: [
            { locale: 'en', name: 'Approved', description: 'Request fully approved' },
            { locale: 'tr', name: 'Onaylandı', description: 'Talep tamamen onaylandı' },
          ],
        },
        {
          code: 'rejected',
          isInitial: false,
          isFinal: true,
          sortOrder: 4,
          color: '#EF4444',
          translations: [
            { locale: 'en', name: 'Rejected', description: 'Request has been rejected' },
            { locale: 'tr', name: 'Reddedildi', description: 'Talep reddedildi' },
          ],
        },
        {
          code: 'cancelled',
          isInitial: false,
          isFinal: true,
          sortOrder: 5,
          color: '#9CA3AF',
          translations: [
            { locale: 'en', name: 'Cancelled', description: 'Request cancelled by requester' },
            { locale: 'tr', name: 'İptal Edildi', description: 'Talep, talep eden tarafından iptal edildi' },
          ],
        },
      ],
      transitions: [
        {
          code: 'submit',
          fromStateCode: 'draft',
          toStateCode: 'submitted',
          translations: [
            { locale: 'en', name: 'Submit', description: 'Submit request for approval' },
            { locale: 'tr', name: 'Gönder', description: 'Talebi onaya gönder' },
          ],
        },
        {
          code: 'manager_approve',
          fromStateCode: 'submitted',
          toStateCode: 'manager_approved',
          translations: [
            { locale: 'en', name: 'Manager Approve', description: 'Manager approves the request' },
            { locale: 'tr', name: 'Yönetici Onayla', description: 'Yönetici talebi onaylar' },
          ],
        },
        {
          code: 'hr_approve',
          fromStateCode: 'manager_approved',
          toStateCode: 'approved',
          translations: [
            { locale: 'en', name: 'HR Approve', description: 'HR gives final approval' },
            { locale: 'tr', name: 'İK Onayla', description: 'İK nihai onayı verir' },
          ],
        },
        {
          code: 'reject_by_manager',
          fromStateCode: 'submitted',
          toStateCode: 'rejected',
          translations: [
            { locale: 'en', name: 'Reject', description: 'Manager rejects the request' },
            { locale: 'tr', name: 'Reddet', description: 'Yönetici talebi reddeder' },
          ],
        },
        {
          code: 'reject_by_hr',
          fromStateCode: 'manager_approved',
          toStateCode: 'rejected',
          translations: [
            { locale: 'en', name: 'Reject', description: 'HR rejects the request' },
            { locale: 'tr', name: 'Reddet', description: 'İK talebi reddeder' },
          ],
        },
        {
          code: 'cancel_draft',
          fromStateCode: 'draft',
          toStateCode: 'cancelled',
          translations: [
            { locale: 'en', name: 'Cancel', description: 'Cancel the draft request' },
            { locale: 'tr', name: 'İptal Et', description: 'Taslak talebi iptal et' },
          ],
        },
        {
          code: 'cancel_submitted',
          fromStateCode: 'submitted',
          toStateCode: 'cancelled',
          translations: [
            { locale: 'en', name: 'Cancel', description: 'Cancel the submitted request' },
            { locale: 'tr', name: 'İptal Et', description: 'Gönderilmiş talebi iptal et' },
          ],
        },
      ],
    });

    // Publish the definition so it can be used
    await smService.publishDefinition(company.id, definition.id);
    this.logger.log(`Created and published state machine: leave_request_lifecycle`);
  }
}
