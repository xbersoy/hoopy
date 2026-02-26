import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';
import {
  EmployeeEducationRepository,
  EmployeeRepository,
} from './employee.repository';

@Injectable()
export class EmployeeService {
  constructor(
    @Inject('EmployeeRepository')
    private readonly employeeRepository: EmployeeRepository,

    @Inject('EmployeeEducationRepository')
    private readonly educationRepository: EmployeeEducationRepository,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const { educations, ...employeeData } = createEmployeeDto;
    
    // Create employee
    const employee = this.employeeRepository.create(employeeData);
    const savedEmployee = await this.employeeRepository.save(employee);
    
    // Create educations if provided
    if (educations && educations.length > 0) {
      const educationEntities = educations.map(education => 
        this.educationRepository.create({
          ...education,
          employee: savedEmployee,
          employee_id: savedEmployee.id
        })
      );
      await this.educationRepository.saveAll(educationEntities);
    }
    
    // Return the employee with educations
    return this.findOne(savedEmployee.id);
  }

  async findAll(): Promise<Employee[]> {
    return this.employeeRepository.findAllWithEducations();
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOneWithEducations(id);

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const { educations, ...employeeData } = updateEmployeeDto;
    
    // Find employee
    const employee = await this.findOne(id);
    
    // Update employee data
    if (Object.keys(employeeData).length > 0) {
      Object.assign(employee, employeeData);
      await this.employeeRepository.save(employee);
    }
    
    // Update educations if provided
    if (educations && educations.length > 0) {
      // Remove existing educations
      await this.educationRepository.deleteByEmployeeId(id);
      
      // Create new educations
      const educationEntities = educations.map(education => 
        this.educationRepository.create({
          ...education,
          employee: employee,
          employee_id: id
        })
      );
      await this.educationRepository.saveAll(educationEntities);
    }
    
    // Return updated employee with educations
    return this.findOne(id);
  }

  async remove(id: string): Promise<Employee> {
    const employee = await this.findOne(id);
    
    // Delete educations first (should happen automatically with CASCADE)
    await this.educationRepository.deleteByEmployeeId(id);
    
    // Delete employee
    await this.employeeRepository.remove(employee);
    
    return { ...employee, id };
  }
} 