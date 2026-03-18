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
import { EmployeeWorkAuthorization } from './entities/employee-work-authorization.entity';
import { SkillType } from './entities/skill-type.entity';
import { Skill } from './entities/skill.entity';
import { Competency } from './entities/competency.entity';
import { CompetencyCategory } from './entities/competency-category.entity';
import { EmployeeSkill } from './entities/employee-skill.entity';
import { EmployeeCompetency } from './entities/employee-competency.entity';
import {
  TypeOrmEmployeeRepository,
  TypeOrmEmployeeEducationRepository,
  TypeOrmEmployeeEmergencyContactRepository,
  TypeOrmEmployeeDependentRepository,
  TypeOrmEmployeeWorkExperienceRepository,
  TypeOrmEmployeeJobInformationRepository,
  TypeOrmEmployeeLicenseCertificationRepository,
  TypeOrmEmployeeNationalIdRepository,
  TypeOrmEmployeeWorkAuthorizationRepository,
} from './employee.repository';
import { PermissionsModule } from '../permissions/permissions.module';
import { SkillsCompetenciesService } from './skills-competencies.service';
import {
  SkillTypesController,
  SkillsController,
  CompetencyCategoriesController,
  CompetenciesController,
  EmployeeSkillsController,
  EmployeeCompetenciesController,
} from './skills-competencies.controller';

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
      EmployeeWorkAuthorization,
      SkillType,
      Skill,
      Competency,
      CompetencyCategory,
      EmployeeSkill,
      EmployeeCompetency,
    ]),
    PermissionsModule,
  ],
  controllers: [
    EmployeeController,
    SkillTypesController,
    SkillsController,
    CompetencyCategoriesController,
    CompetenciesController,
    EmployeeSkillsController,
    EmployeeCompetenciesController,
  ],
  providers: [
    EmployeeService,
    SkillsCompetenciesService,
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
    {
      provide: 'EmployeeWorkAuthorizationRepository',
      useClass: TypeOrmEmployeeWorkAuthorizationRepository,
    },
  ],
  exports: [EmployeeService, SkillsCompetenciesService],
})
export class EmployeeModule {}
