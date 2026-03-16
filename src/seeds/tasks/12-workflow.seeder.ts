import { INestApplicationContext, Logger } from '@nestjs/common';
import { Seeder } from '../seeder.interface';
import { WorkflowDefinitionService } from '../../workflows/services/workflow-definition.service';
import { CompanyService } from '../../company/services/company.service';
import { UserService } from '../../user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowDefinition } from '../../workflows/entities/workflow-definition.entity';
import { StateMachineDefinition } from '../../state-machine/entities/state-machine-definition.entity';

export class WorkflowSeeder implements Seeder {
  private readonly logger = new Logger(WorkflowSeeder.name);

  async run(app: INestApplicationContext): Promise<void> {
    const wfService = app.get(WorkflowDefinitionService);
    const userService = app.get(UserService);
    const companyService = app.get(CompanyService);
    const wfRepo = app.get<Repository<WorkflowDefinition>>(
      getRepositoryToken(WorkflowDefinition),
    );
    const smRepo = app.get<Repository<StateMachineDefinition>>(
      getRepositoryToken(StateMachineDefinition),
    );

    const users = await userService.findAll();
    const admin = users.find((u: any) => u.email === 'admin@admin.com');
    if (!admin) {
      this.logger.warn('Admin user not found — skipping workflow seed.');
      return;
    }

    const company = await companyService.findByOwner(admin.id);
    if (!company) {
      this.logger.warn('Admin company not found — skipping workflow seed.');
      return;
    }

    // Check if already seeded
    const existing = await wfRepo.findOne({
      where: { companyId: company.id, code: 'leave_request_approval' },
    });
    if (existing) {
      this.logger.log('Workflow "leave_request_approval" already exists — skipping.');
      return;
    }

    // Find the state machine definition
    const smDef = await smRepo.findOne({
      where: { companyId: company.id, code: 'leave_request_lifecycle' },
    });
    if (!smDef) {
      this.logger.warn('State machine "leave_request_lifecycle" not found — skipping workflow seed.');
      return;
    }

    // Create Leave Request Approval workflow
    const definition = await wfService.create(company.id, {
      code: 'leave_request_approval',
      resourceType: 'leave-request',
      category: 'approval',
      priority: 0,
      stateMachineDefinitionId: smDef.id,
      translations: [
        { locale: 'en', name: 'Leave Request Approval', description: 'Two-step approval workflow for leave requests' },
        { locale: 'tr', name: 'İzin Talebi Onayı', description: 'İzin talepleri için iki aşamalı onay iş akışı' },
      ],
      triggerMode: 'manual' as any,
      slaConfig: { defaultDurationHours: 48 },
      steps: [
        {
          code: 'manager_review',
          transitionCode: 'manager_approve',
          type: 'approval' as any,
          sortOrder: 1,
          assigneeStrategy: 'manager' as any,
          approvalStrategy: 'any' as any,
          slaDurationHours: 24,
          isCommentRequired: false,
          isAttachmentRequired: false,
          isSkippable: false,
          isAutoComplete: false,
          translations: [
            { locale: 'en', name: 'Manager Review', description: 'Direct manager reviews and approves the leave request' },
            { locale: 'tr', name: 'Yönetici İncelemesi', description: 'Direkt yönetici izin talebini inceler ve onaylar' },
          ],
        },
        {
          code: 'hr_review',
          transitionCode: 'hr_approve',
          type: 'approval' as any,
          sortOrder: 2,
          assigneeStrategy: 'hr' as any,
          approvalStrategy: 'any' as any,
          slaDurationHours: 48,
          isCommentRequired: false,
          isAttachmentRequired: false,
          isSkippable: false,
          isAutoComplete: false,
          entryCondition: {
            logic: 'and',
            conditions: [
              { field: 'request.durationDays', operator: 'gt', value: 3 },
            ],
          },
          translations: [
            { locale: 'en', name: 'HR Review', description: 'HR reviews requests longer than 3 days' },
            { locale: 'tr', name: 'İK İncelemesi', description: 'İK 3 günden uzun talepleri inceler' },
          ],
        },
      ],
      transitions: [
        {
          fromStepCode: 'manager_review',
          toStepCode: 'hr_review',
          action: 'approve' as any,
          isDefault: true,
          label: 'Approve & Forward to HR',
        },
        {
          fromStepCode: 'manager_review',
          toStepCode: undefined as any,
          action: 'reject' as any,
          isDefault: false,
          label: 'Reject',
        },
        {
          fromStepCode: 'hr_review',
          toStepCode: undefined as any,
          action: 'approve' as any,
          isDefault: true,
          label: 'Final Approve',
        },
        {
          fromStepCode: 'hr_review',
          toStepCode: undefined as any,
          action: 'reject' as any,
          isDefault: false,
          label: 'Reject',
        },
      ],
    });

    // Publish the first version
    const version = definition.versions?.[0];
    if (version) {
      await wfService.publishVersion(company.id, definition.id, version.id);
      this.logger.log('Published workflow version v1.');
    }

    this.logger.log('Created workflow definition: leave_request_approval');
  }
}
