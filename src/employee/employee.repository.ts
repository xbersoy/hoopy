import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, ILike, FindOptionsWhere } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeeEducation } from './entities/employee-education.entity';
import { EmployeeEmergencyContact } from './entities/employee-emergency-contact.entity';
import { EmployeeDependent } from './entities/employee-dependent.entity';
import { EmployeeWorkExperience } from './entities/employee-work-experience.entity';
import { EmployeeJobInformation } from './entities/employee-job-information.entity';
import { EmployeeLicenseCertification } from './entities/employee-license-certification.entity';
import { EmployeeNationalId } from './entities/employee-national-id.entity';
import { EmployeeWorkAuthorization } from './entities/employee-work-authorization.entity';

// --- Interfaces ---

export interface EmployeeRepository {
  create(data: Partial<Employee>): Employee;
  save(employee: Employee): Promise<Employee>;
  findAllWithRelations(): Promise<Employee[]>;
  findPaginated(options: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: Employee[]; total: number }>;
  findOneWithRelations(id: string): Promise<Employee | null>;
  remove(employee: Employee): Promise<Employee>;
}

export interface EmployeeEducationRepository {
  create(data: Partial<EmployeeEducation>): EmployeeEducation;
  saveAll(educations: EmployeeEducation[]): Promise<EmployeeEducation[]>;
  deleteByEmployeeId(employeeId: string): Promise<void>;
}

export interface EmployeeEmergencyContactRepository {
  create(data: Partial<EmployeeEmergencyContact>): EmployeeEmergencyContact;
  saveAll(
    contacts: EmployeeEmergencyContact[],
  ): Promise<EmployeeEmergencyContact[]>;
  deleteByEmployeeId(employeeId: string): Promise<void>;
}

export interface EmployeeDependentRepository {
  create(data: Partial<EmployeeDependent>): EmployeeDependent;
  saveAll(dependents: EmployeeDependent[]): Promise<EmployeeDependent[]>;
  deleteByEmployeeId(employeeId: string): Promise<void>;
}

export interface EmployeeWorkExperienceRepository {
  create(data: Partial<EmployeeWorkExperience>): EmployeeWorkExperience;
  saveAll(
    experiences: EmployeeWorkExperience[],
  ): Promise<EmployeeWorkExperience[]>;
  deleteByEmployeeId(employeeId: string): Promise<void>;
}

export interface EmployeeJobInformationRepository {
  create(data: Partial<EmployeeJobInformation>): EmployeeJobInformation;
  saveAll(
    jobInfos: EmployeeJobInformation[],
  ): Promise<EmployeeJobInformation[]>;
  deleteByEmployeeId(employeeId: string): Promise<void>;
}

export interface EmployeeLicenseCertificationRepository {
  create(
    data: Partial<EmployeeLicenseCertification>,
  ): EmployeeLicenseCertification;
  saveAll(
    licenses: EmployeeLicenseCertification[],
  ): Promise<EmployeeLicenseCertification[]>;
  deleteByEmployeeId(employeeId: string): Promise<void>;
}

export interface EmployeeNationalIdRepository {
  create(data: Partial<EmployeeNationalId>): EmployeeNationalId;
  saveAll(nationalIds: EmployeeNationalId[]): Promise<EmployeeNationalId[]>;
  deleteByEmployeeId(employeeId: string): Promise<void>;
}

export interface EmployeeWorkAuthorizationRepository {
  create(data: Partial<EmployeeWorkAuthorization>): EmployeeWorkAuthorization;
  saveAll(
    workAuthorizations: EmployeeWorkAuthorization[],
  ): Promise<EmployeeWorkAuthorization[]>;
  deleteByEmployeeId(employeeId: string): Promise<void>;
}

// --- All relations to load ---

const EMPLOYEE_RELATIONS = [
  'educations',
  'emergencyContacts',
  'dependents',
  'workExperiences',
  'jobInformations',
  'licensesCertifications',
  'nationalIds',
  'workAuthorizations',
  'employeeSkills',
  'employeeSkills.skill',
  'employeeSkills.skill.skillType',
  'employeeCompetencies',
  'employeeCompetencies.competency',
  'user',
  'company',
];

// --- Implementations ---

@Injectable()
export class TypeOrmEmployeeRepository implements EmployeeRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(Employee);
  }

  private readonly repo: Repository<Employee>;

  create(data: Partial<Employee>): Employee {
    return this.repo.create(data);
  }

  save(employee: Employee): Promise<Employee> {
    return this.repo.save(employee);
  }

  findAllWithRelations(): Promise<Employee[]> {
    return this.repo.find({ relations: EMPLOYEE_RELATIONS });
  }

  async findPaginated(options: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ data: Employee[]; total: number }> {
    const { search, page, limit } = options;

    const where: FindOptionsWhere<Employee>[] | undefined = search
      ? [
          { firstName: ILike(`%${search}%`) },
          { lastName: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
          { position: ILike(`%${search}%`) },
          { department: ILike(`%${search}%`) },
        ]
      : undefined;

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: EMPLOYEE_RELATIONS,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  findOneWithRelations(id: string): Promise<Employee | null> {
    return this.repo.findOne({
      where: { id },
      relations: EMPLOYEE_RELATIONS,
    });
  }

  remove(employee: Employee): Promise<Employee> {
    return this.repo.remove(employee);
  }
}

@Injectable()
export class TypeOrmEmployeeEducationRepository implements EmployeeEducationRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(EmployeeEducation);
  }

  private readonly repo: Repository<EmployeeEducation>;

  create(data: Partial<EmployeeEducation>): EmployeeEducation {
    return this.repo.create(data);
  }

  saveAll(educations: EmployeeEducation[]): Promise<EmployeeEducation[]> {
    return this.repo.save(educations);
  }

  async deleteByEmployeeId(employeeId: string): Promise<void> {
    await this.repo.delete({ employee_id: employeeId });
  }
}

@Injectable()
export class TypeOrmEmployeeEmergencyContactRepository implements EmployeeEmergencyContactRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(EmployeeEmergencyContact);
  }

  private readonly repo: Repository<EmployeeEmergencyContact>;

  create(data: Partial<EmployeeEmergencyContact>): EmployeeEmergencyContact {
    return this.repo.create(data);
  }

  saveAll(
    contacts: EmployeeEmergencyContact[],
  ): Promise<EmployeeEmergencyContact[]> {
    return this.repo.save(contacts);
  }

  async deleteByEmployeeId(employeeId: string): Promise<void> {
    await this.repo.delete({ employee_id: employeeId });
  }
}

@Injectable()
export class TypeOrmEmployeeDependentRepository implements EmployeeDependentRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(EmployeeDependent);
  }

  private readonly repo: Repository<EmployeeDependent>;

  create(data: Partial<EmployeeDependent>): EmployeeDependent {
    return this.repo.create(data);
  }

  saveAll(dependents: EmployeeDependent[]): Promise<EmployeeDependent[]> {
    return this.repo.save(dependents);
  }

  async deleteByEmployeeId(employeeId: string): Promise<void> {
    await this.repo.delete({ employee_id: employeeId });
  }
}

@Injectable()
export class TypeOrmEmployeeWorkExperienceRepository implements EmployeeWorkExperienceRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(EmployeeWorkExperience);
  }

  private readonly repo: Repository<EmployeeWorkExperience>;

  create(data: Partial<EmployeeWorkExperience>): EmployeeWorkExperience {
    return this.repo.create(data);
  }

  saveAll(
    experiences: EmployeeWorkExperience[],
  ): Promise<EmployeeWorkExperience[]> {
    return this.repo.save(experiences);
  }

  async deleteByEmployeeId(employeeId: string): Promise<void> {
    await this.repo.delete({ employee_id: employeeId });
  }
}

@Injectable()
export class TypeOrmEmployeeJobInformationRepository implements EmployeeJobInformationRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(EmployeeJobInformation);
  }

  private readonly repo: Repository<EmployeeJobInformation>;

  create(data: Partial<EmployeeJobInformation>): EmployeeJobInformation {
    return this.repo.create(data);
  }

  saveAll(
    jobInfos: EmployeeJobInformation[],
  ): Promise<EmployeeJobInformation[]> {
    return this.repo.save(jobInfos);
  }

  async deleteByEmployeeId(employeeId: string): Promise<void> {
    await this.repo.delete({ employee_id: employeeId });
  }
}

@Injectable()
export class TypeOrmEmployeeLicenseCertificationRepository implements EmployeeLicenseCertificationRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(EmployeeLicenseCertification);
  }

  private readonly repo: Repository<EmployeeLicenseCertification>;

  create(
    data: Partial<EmployeeLicenseCertification>,
  ): EmployeeLicenseCertification {
    return this.repo.create(data);
  }

  saveAll(
    licenses: EmployeeLicenseCertification[],
  ): Promise<EmployeeLicenseCertification[]> {
    return this.repo.save(licenses);
  }

  async deleteByEmployeeId(employeeId: string): Promise<void> {
    await this.repo.delete({ employee_id: employeeId });
  }
}

@Injectable()
export class TypeOrmEmployeeNationalIdRepository implements EmployeeNationalIdRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(EmployeeNationalId);
  }

  private readonly repo: Repository<EmployeeNationalId>;

  create(data: Partial<EmployeeNationalId>): EmployeeNationalId {
    return this.repo.create(data);
  }

  saveAll(nationalIds: EmployeeNationalId[]): Promise<EmployeeNationalId[]> {
    return this.repo.save(nationalIds);
  }

  async deleteByEmployeeId(employeeId: string): Promise<void> {
    await this.repo.delete({ employee_id: employeeId });
  }
}

@Injectable()
export class TypeOrmEmployeeWorkAuthorizationRepository implements EmployeeWorkAuthorizationRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(EmployeeWorkAuthorization);
  }

  private readonly repo: Repository<EmployeeWorkAuthorization>;

  create(data: Partial<EmployeeWorkAuthorization>): EmployeeWorkAuthorization {
    return this.repo.create(data);
  }

  saveAll(
    workAuthorizations: EmployeeWorkAuthorization[],
  ): Promise<EmployeeWorkAuthorization[]> {
    return this.repo.save(workAuthorizations);
  }

  async deleteByEmployeeId(employeeId: string): Promise<void> {
    await this.repo.delete({ employee_id: employeeId });
  }
}
