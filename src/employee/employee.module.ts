import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { Employee } from './entities/employee.entity';
import { EmployeeEducation } from './entities/employee-education.entity';
import { EmployeeEmergencyContact } from './entities/employee-emergency-contact.entity';
import { EmployeeDependent } from './entities/employee-dependent.entity';
import { EmployeeWorkExperience } from './entities/employee-work-experience.entity';
import { EmployeeJobInformation } from './entities/employee-job-information.entity';
import { EmployeeLicenseCertification } from './entities/employee-license-certification.entity';
import { EmployeeNationalId } from './entities/employee-national-id.entity';
import {
  TypeOrmEmployeeRepository,
  TypeOrmEmployeeEducationRepository,
  TypeOrmEmployeeEmergencyContactRepository,
  TypeOrmEmployeeDependentRepository,
  TypeOrmEmployeeWorkExperienceRepository,
  TypeOrmEmployeeJobInformationRepository,
  TypeOrmEmployeeLicenseCertificationRepository,
  TypeOrmEmployeeNationalIdRepository,
} from './employee.repository';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      EmployeeEducation,
      EmployeeEmergencyContact,
      EmployeeDependent,
      EmployeeWorkExperience,
      EmployeeJobInformation,
      EmployeeLicenseCertification,
      EmployeeNationalId,
    ]),
    PermissionsModule,
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
    {
      provide: 'EmployeeEmergencyContactRepository',
      useClass: TypeOrmEmployeeEmergencyContactRepository,
    },
    {
      provide: 'EmployeeDependentRepository',
      useClass: TypeOrmEmployeeDependentRepository,
    },
    {
      provide: 'EmployeeWorkExperienceRepository',
      useClass: TypeOrmEmployeeWorkExperienceRepository,
    },
    {
      provide: 'EmployeeJobInformationRepository',
      useClass: TypeOrmEmployeeJobInformationRepository,
    },
    {
      provide: 'EmployeeLicenseCertificationRepository',
      useClass: TypeOrmEmployeeLicenseCertificationRepository,
    },
    {
      provide: 'EmployeeNationalIdRepository',
      useClass: TypeOrmEmployeeNationalIdRepository,
    },
  ],
  exports: [EmployeeService],
})
export class EmployeeModule {}
