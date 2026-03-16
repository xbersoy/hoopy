import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAccess, AdminPrivilege } from '../entities/admin-access.entity';
import { Employee } from '../../employee/entities/employee.entity';

@Injectable()
export class AdminAccessService {
  constructor(
    @InjectRepository(AdminAccess)
    private readonly adminAccessRepo: Repository<AdminAccess>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  /**
   * List admin access entries scoped to users that belong to the given company.
   */
  async findAllByAccountAndCompany(
    accountId: string,
    companyId: string,
  ): Promise<AdminAccess[]> {
    // Get all user IDs in this company (via employee records)
    const companyEmployees = await this.employeeRepo.find({
      where: { company: { id: companyId } },
      relations: ['user'],
    });
    const companyUserIds = new Set(
      companyEmployees.filter((e) => e.user).map((e) => e.user.id),
    );

    const entries = await this.adminAccessRepo.find({
      where: { accountId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return entries.filter((e) => companyUserIds.has(e.userId));
  }

  /**
   * Get users in the same company that can be added as admin access entries.
   * Returns users who have an employee record in the company and are NOT
   * already in the admin_access table for this account.
   */
  async getEligibleUsers(
    accountId: string,
    companyId: string,
  ): Promise<
    Array<{ id: string; firstName: string; lastName: string; email: string }>
  > {
    const companyEmployees = await this.employeeRepo.find({
      where: { company: { id: companyId } },
      relations: ['user'],
    });

    const existingEntries = await this.adminAccessRepo.find({
      where: { accountId },
      select: ['userId'],
    });
    const existingUserIds = new Set(existingEntries.map((e) => e.userId));

    return companyEmployees
      .filter((e) => e.user && !existingUserIds.has(e.user.id))
      .map((e) => ({
        id: e.user.id,
        firstName: e.user.firstName,
        lastName: e.user.lastName,
        email: e.user.email,
      }));
  }

  async findByUserAndAccount(
    userId: string,
    accountId: string,
  ): Promise<AdminAccess | null> {
    return this.adminAccessRepo.findOne({
      where: { userId, accountId },
    });
  }

  async getUserPrivileges(
    userId: string,
    accountId: string,
  ): Promise<AdminPrivilege[]> {
    const entry = await this.findByUserAndAccount(userId, accountId);
    return entry?.privileges ?? [];
  }

  async grant(
    userId: string,
    accountId: string,
    companyId: string,
    privileges: AdminPrivilege[],
  ): Promise<AdminAccess> {
    // Validate user belongs to the same company
    const employee = await this.employeeRepo.findOne({
      where: { user: { id: userId }, company: { id: companyId } },
    });
    if (!employee) {
      throw new BadRequestException('User does not belong to your company.');
    }

    const existing = await this.findByUserAndAccount(userId, accountId);
    if (existing) {
      throw new ConflictException(
        'Admin access entry already exists for this user. Use update instead.',
      );
    }

    const entry = this.adminAccessRepo.create({
      userId,
      accountId,
      privileges,
    });
    const saved = await this.adminAccessRepo.save(entry);
    return this.adminAccessRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });
  }

  async update(
    id: string,
    accountId: string,
    privileges: AdminPrivilege[],
  ): Promise<AdminAccess> {
    const entry = await this.adminAccessRepo.findOne({
      where: { id, accountId },
      relations: ['user'],
    });
    if (!entry) {
      throw new NotFoundException('Admin access entry not found');
    }
    entry.privileges = privileges;
    return this.adminAccessRepo.save(entry);
  }

  async revoke(id: string, accountId: string): Promise<void> {
    const entry = await this.adminAccessRepo.findOne({
      where: { id, accountId },
    });
    if (!entry) {
      throw new NotFoundException('Admin access entry not found');
    }
    await this.adminAccessRepo.remove(entry);
  }

  async userHasPrivilege(
    userId: string,
    accountId: string,
    privilege: AdminPrivilege,
  ): Promise<boolean> {
    const entry = await this.findByUserAndAccount(userId, accountId);
    if (!entry) return false;
    return entry.privileges.includes(privilege);
  }
}
