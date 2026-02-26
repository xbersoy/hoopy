import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { Employee } from './entities/employee.entity';
import { EmployeeEducation } from './entities/employee-education.entity';
import {
  TypeOrmEmployeeEducationRepository,
  TypeOrmEmployeeRepository,
} from './employee.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, EmployeeEducation]),
  ],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    {
      provide: 'EmployeeRepository',
      useClass: TypeOrmEmployeeRepository,
    },
    {
      provide: 'EmployeeEducationRepository',
      useClass: TypeOrmEmployeeEducationRepository,
    },
  ],
  exports: [EmployeeService],
})
export class EmployeeModule {} 