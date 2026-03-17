import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LeavePolicy } from '../entities/leave-policy.entity';
import {
  LeavePolicyRepository,
  LeaveEntitlementRuleRepository,
  LeavePolicyI18nRepository,
} from '../leave.repository';
import { CreateLeavePolicyDto, UpdateLeavePolicyDto } from '../dto/create-leave-policy.dto';

@Injectable()
export class LeavePolicyService {
  constructor(
    @Inject('LeavePolicyRepository')
    private readonly policyRepository: LeavePolicyRepository,

    @Inject('LeaveEntitlementRuleRepository')
    private readonly ruleRepository: LeaveEntitlementRuleRepository,

    @Inject('LeavePolicyI18nRepository')
    private readonly i18nRepository: LeavePolicyI18nRepository,
  ) {}

  async create(companyId: string, dto: CreateLeavePolicyDto): Promise<LeavePolicy> {
    const { entitlementRules, effectiveStartDate, effectiveEndDate, translations, ...policyData } = dto;

    const entity = this.policyRepository.create({
      companyId,
      ...policyData,
      effectiveStartDate: effectiveStartDate ? new Date(effectiveStartDate) : null,
      effectiveEndDate: effectiveEndDate ? new Date(effectiveEndDate) : null,
    });
    const saved = await this.policyRepository.save(entity);

    if (entitlementRules?.length) {
      const rules = entitlementRules.map((r) =>
        this.ruleRepository.create({ ...r, leavePolicyId: saved.id }),
      );
      await this.ruleRepository.saveAll(rules);
    }

    if (translations) {
      for (const [locale, t] of Object.entries(translations)) {
        await this.i18nRepository.upsert(companyId, saved.id, locale, t.name, t.description);
      }
    }

    return this.findOne(saved.id);
  }

  async findAll(companyId: string): Promise<LeavePolicy[]> {
    return this.policyRepository.findByCompany(companyId);
  }

  async findOne(id: string): Promise<LeavePolicy> {
    const entity = await this.policyRepository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Leave policy with ID "${id}" not found`);
    }
    return entity;
  }

  async findByLeaveType(companyId: string, leaveTypeId: string): Promise<LeavePolicy[]> {
    return this.policyRepository.findByLeaveType(companyId, leaveTypeId);
  }

  async update(id: string, dto: UpdateLeavePolicyDto): Promise<LeavePolicy> {
    const entity = await this.findOne(id);
    const { entitlementRules, effectiveStartDate, effectiveEndDate, translations, ...policyData } = dto;

    if (Object.keys(policyData).length > 0) {
      Object.assign(entity, {
        ...policyData,
        ...(effectiveStartDate !== undefined
          ? { effectiveStartDate: effectiveStartDate ? new Date(effectiveStartDate) : null }
          : {}),
        ...(effectiveEndDate !== undefined
          ? { effectiveEndDate: effectiveEndDate ? new Date(effectiveEndDate) : null }
          : {}),
      });
      await this.policyRepository.save(entity);
    }

    if (entitlementRules) {
      await this.ruleRepository.deleteByPolicyId(id);
      if (entitlementRules.length) {
        const rules = entitlementRules.map((r) =>
          this.ruleRepository.create({ ...r, leavePolicyId: id }),
        );
        await this.ruleRepository.saveAll(rules);
      }
    }

    if (translations) {
      for (const [locale, t] of Object.entries(translations)) {
        await this.i18nRepository.upsert(entity.companyId, id, locale, t.name, t.description);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<LeavePolicy> {
    const entity = await this.findOne(id);
    return this.policyRepository.remove(entity);
  }
}
