import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CompOffGrant } from '../entities/comp-off-grant.entity';
import { CompOffGrantRepository } from '../overtime.repository';
import { CompOffStatus } from '../enums/overtime.enums';

@Injectable()
export class CompOffService {
  constructor(
    @Inject('CompOffGrantRepository')
    private readonly compOffRepository: CompOffGrantRepository,
  ) {}

  async findByEmployee(
    companyId: string,
    employeeId: string,
  ): Promise<CompOffGrant[]> {
    return this.compOffRepository.findByEmployee(companyId, employeeId);
  }

  async findActive(
    companyId: string,
    employeeId: string,
  ): Promise<CompOffGrant[]> {
    return this.compOffRepository.findActive(companyId, employeeId);
  }

  async findOne(id: string): Promise<CompOffGrant> {
    const entity = await this.compOffRepository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Comp-off grant with ID "${id}" not found`);
    }
    return entity;
  }

  async consume(id: string, days: number): Promise<CompOffGrant> {
    const grant = await this.findOne(id);
    if (grant.status !== CompOffStatus.ACTIVE) {
      throw new BadRequestException('Only active comp-off grants can be consumed');
    }
    if (days > grant.remainingDays) {
      throw new BadRequestException(
        `Cannot consume ${days} days. Only ${grant.remainingDays} remaining`,
      );
    }

    grant.consumedDays = Number(grant.consumedDays) + days;
    grant.remainingDays = Number(grant.remainingDays) - days;

    if (grant.remainingDays <= 0) {
      grant.status = CompOffStatus.CONSUMED;
    }

    return this.compOffRepository.save(grant);
  }
}
