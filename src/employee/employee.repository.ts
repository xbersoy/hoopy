import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeeEducation } from './entities/employee-education.entity';

export interface EmployeeRepository {
  create(data: Partial<Employee>): Employee;
  save(employee: Employee): Promise<Employee>;
  findAllWithEducations(): Promise<Employee[]>;
  findOneWithEducations(id: string): Promise<Employee | null>;
  remove(employee: Employee): Promise<Employee>;
}

export interface EmployeeEducationRepository {
  create(data: Partial<EmployeeEducation>): EmployeeEducation;
  saveAll(educations: EmployeeEducation[]): Promise<EmployeeEducation[]>;
  deleteByEmployeeId(employeeId: string): Promise<void>;
}

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

  findAllWithEducations(): Promise<Employee[]> {
    return this.repo.find({ relations: ['educations'] });
  }

  findOneWithEducations(id: string): Promise<Employee | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['educations'],
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

