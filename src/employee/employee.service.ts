import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { PaginatedResponse } from '../shared/dto';
import { Employee } from './entities/employee.entity';
import {
  EmployeeEducationRepository,
  EmployeeEmergencyContactRepository,
  EmployeeDependentRepository,
  EmployeeWorkExperienceRepository,
  EmployeeJobInformationRepository,
  EmployeeLicenseCertificationRepository,
  EmployeeNationalIdRepository,
  EmployeeRepository,
} from './employee.repository';

@Injectable()
export class EmployeeService {
  constructor(
    @Inject('EmployeeRepository')
    private readonly employeeRepository: EmployeeRepository,

    @Inject('EmployeeEducationRepository')
    private readonly educationRepository: EmployeeEducationRepository,

    @Inject('EmployeeEmergencyContactRepository')
    private readonly emergencyContactRepository: EmployeeEmergencyContactRepository,

    @Inject('EmployeeDependentRepository')
    private readonly dependentRepository: EmployeeDependentRepository,

    @Inject('EmployeeWorkExperienceRepository')
    private readonly workExperienceRepository: EmployeeWorkExperienceRepository,

    @Inject('EmployeeJobInformationRepository')
    private readonly jobInformationRepository: EmployeeJobInformationRepository,

    @Inject('EmployeeLicenseCertificationRepository')
    private readonly licenseCertificationRepository: EmployeeLicenseCertificationRepository,

    @Inject('EmployeeNationalIdRepository')
    private readonly nationalIdRepository: EmployeeNationalIdRepository,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const {
      educations,
      emergencyContacts,
      dependents,
      workExperiences,
      jobInformations,
      licensesCertifications,
      nationalIds,
      userId,
      companyId,
      ...employeeData
    } = createEmployeeDto;

    // Create employee, converting date fields and adding relations
    const employee = this.employeeRepository.create({
      ...employeeData,
      hireDate: employeeData.hireDate
        ? new Date(employeeData.hireDate)
        : undefined,
      ...(userId ? { user: { id: userId } as any } : {}),
      ...(companyId ? { company: { id: companyId } as any } : {}),
    });
    const savedEmployee = await this.employeeRepository.save(employee);

    // Create related entities
    await Promise.all([
      this.saveEducations(educations, savedEmployee),
      this.saveEmergencyContacts(emergencyContacts, savedEmployee),
      this.saveDependents(dependents, savedEmployee),
      this.saveWorkExperiences(workExperiences, savedEmployee),
      this.saveJobInformations(jobInformations, savedEmployee),
      this.saveLicensesCertifications(licensesCertifications, savedEmployee),
      this.saveNationalIds(nationalIds, savedEmployee),
    ]);

    return this.findOne(savedEmployee.id);
  }

  async findAll(): Promise<Employee[]> {
    return this.employeeRepository.findAllWithRelations();
  }

  async findPaginated(
    query: QueryEmployeeDto,
  ): Promise<PaginatedResponse<Employee>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.employeeRepository.findPaginated({
      search: query.search,
      page,
      limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOneWithRelations(id);

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    return employee;
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const {
      educations,
      emergencyContacts,
      dependents,
      workExperiences,
      jobInformations,
      licensesCertifications,
      nationalIds,
      ...employeeData
    } = updateEmployeeDto;

    // Find employee
    const employee = await this.findOne(id);

    // Update employee data, converting date fields
    if (Object.keys(employeeData).length > 0) {
      Object.assign(employee, {
        ...employeeData,
        hireDate: employeeData.hireDate
          ? new Date(employeeData.hireDate)
          : employee.hireDate,
      });
      await this.employeeRepository.save(employee);
    }

    // Update related entities (delete-and-recreate pattern)
    await Promise.all([
      this.replaceEducations(educations, employee, id),
      this.replaceEmergencyContacts(emergencyContacts, employee, id),
      this.replaceDependents(dependents, employee, id),
      this.replaceWorkExperiences(workExperiences, employee, id),
      this.replaceJobInformations(jobInformations, employee, id),
      this.replaceLicensesCertifications(licensesCertifications, employee, id),
      this.replaceNationalIds(nationalIds, employee, id),
    ]);

    return this.findOne(id);
  }

  async remove(id: string): Promise<Employee> {
    const employee = await this.findOne(id);

    // Delete all related entities (CASCADE should handle this, but explicit for safety)
    await Promise.all([
      this.educationRepository.deleteByEmployeeId(id),
      this.emergencyContactRepository.deleteByEmployeeId(id),
      this.dependentRepository.deleteByEmployeeId(id),
      this.workExperienceRepository.deleteByEmployeeId(id),
      this.jobInformationRepository.deleteByEmployeeId(id),
      this.licenseCertificationRepository.deleteByEmployeeId(id),
      this.nationalIdRepository.deleteByEmployeeId(id),
    ]);

    await this.employeeRepository.remove(employee);

    return { ...employee, id };
  }

  // --- Private helpers for creating related entities ---

  private async saveEducations(
    educations: CreateEmployeeDto['educations'],
    employee: Employee,
  ): Promise<void> {
    if (!educations?.length) return;
    const entities = educations.map((dto) =>
      this.educationRepository.create({
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        employee,
        employee_id: employee.id,
      }),
    );
    await this.educationRepository.saveAll(entities);
  }

  private async saveEmergencyContacts(
    contacts: CreateEmployeeDto['emergencyContacts'],
    employee: Employee,
  ): Promise<void> {
    if (!contacts?.length) return;
    const entities = contacts.map((dto) =>
      this.emergencyContactRepository.create({
        ...dto,
        employee,
        employee_id: employee.id,
      }),
    );
    await this.emergencyContactRepository.saveAll(entities);
  }

  private async saveDependents(
    dependents: CreateEmployeeDto['dependents'],
    employee: Employee,
  ): Promise<void> {
    if (!dependents?.length) return;
    const entities = dependents.map((dto) =>
      this.dependentRepository.create({
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        employee,
        employee_id: employee.id,
      }),
    );
    await this.dependentRepository.saveAll(entities);
  }

  private async saveWorkExperiences(
    experiences: CreateEmployeeDto['workExperiences'],
    employee: Employee,
  ): Promise<void> {
    if (!experiences?.length) return;
    const entities = experiences.map((dto) =>
      this.workExperienceRepository.create({
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        employee,
        employee_id: employee.id,
      }),
    );
    await this.workExperienceRepository.saveAll(entities);
  }

  private async saveJobInformations(
    jobInfos: CreateEmployeeDto['jobInformations'],
    employee: Employee,
  ): Promise<void> {
    if (!jobInfos?.length) return;
    const entities = jobInfos.map((dto) =>
      this.jobInformationRepository.create({
        ...dto,
        effectiveDate: new Date(dto.effectiveDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        ...(dto.managerId ? { manager: { id: dto.managerId } as any } : {}),
        employee,
        employee_id: employee.id,
      }),
    );
    await this.jobInformationRepository.saveAll(entities);
  }

  private async saveLicensesCertifications(
    licenses: CreateEmployeeDto['licensesCertifications'],
    employee: Employee,
  ): Promise<void> {
    if (!licenses?.length) return;
    const entities = licenses.map((dto) =>
      this.licenseCertificationRepository.create({
        ...dto,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expirationDate: dto.expirationDate
          ? new Date(dto.expirationDate)
          : undefined,
        employee,
        employee_id: employee.id,
      }),
    );
    await this.licenseCertificationRepository.saveAll(entities);
  }

  private async saveNationalIds(
    nationalIds: CreateEmployeeDto['nationalIds'],
    employee: Employee,
  ): Promise<void> {
    if (!nationalIds?.length) return;
    const entities = nationalIds.map((dto) =>
      this.nationalIdRepository.create({
        ...dto,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expirationDate: dto.expirationDate
          ? new Date(dto.expirationDate)
          : undefined,
        employee,
        employee_id: employee.id,
      }),
    );
    await this.nationalIdRepository.saveAll(entities);
  }

  // --- Private helpers for replace (delete + create) ---

  private async replaceEducations(
    educations: UpdateEmployeeDto['educations'],
    employee: Employee,
    employeeId: string,
  ): Promise<void> {
    if (!educations) return;
    await this.educationRepository.deleteByEmployeeId(employeeId);
    await this.saveEducations(educations, employee);
  }

  private async replaceEmergencyContacts(
    contacts: UpdateEmployeeDto['emergencyContacts'],
    employee: Employee,
    employeeId: string,
  ): Promise<void> {
    if (!contacts) return;
    await this.emergencyContactRepository.deleteByEmployeeId(employeeId);
    await this.saveEmergencyContacts(contacts, employee);
  }

  private async replaceDependents(
    dependents: UpdateEmployeeDto['dependents'],
    employee: Employee,
    employeeId: string,
  ): Promise<void> {
    if (!dependents) return;
    await this.dependentRepository.deleteByEmployeeId(employeeId);
    await this.saveDependents(dependents, employee);
  }

  private async replaceWorkExperiences(
    experiences: UpdateEmployeeDto['workExperiences'],
    employee: Employee,
    employeeId: string,
  ): Promise<void> {
    if (!experiences) return;
    await this.workExperienceRepository.deleteByEmployeeId(employeeId);
    await this.saveWorkExperiences(experiences, employee);
  }

  private async replaceJobInformations(
    jobInfos: UpdateEmployeeDto['jobInformations'],
    employee: Employee,
    employeeId: string,
  ): Promise<void> {
    if (!jobInfos) return;
    await this.jobInformationRepository.deleteByEmployeeId(employeeId);
    await this.saveJobInformations(jobInfos, employee);
  }

  private async replaceLicensesCertifications(
    licenses: UpdateEmployeeDto['licensesCertifications'],
    employee: Employee,
    employeeId: string,
  ): Promise<void> {
    if (!licenses) return;
    await this.licenseCertificationRepository.deleteByEmployeeId(employeeId);
    await this.saveLicensesCertifications(licenses, employee);
  }

  private async replaceNationalIds(
    nationalIds: UpdateEmployeeDto['nationalIds'],
    employee: Employee,
    employeeId: string,
  ): Promise<void> {
    if (!nationalIds) return;
    await this.nationalIdRepository.deleteByEmployeeId(employeeId);
    await this.saveNationalIds(nationalIds, employee);
  }
}
