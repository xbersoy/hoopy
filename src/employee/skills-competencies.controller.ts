import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermissions } from '../permissions/decorators/require-permissions.decorator';
import { SkillsCompetenciesService } from './skills-competencies.service';
import { SkillType } from './entities/skill-type.entity';
import { Skill } from './entities/skill.entity';
import { Competency } from './entities/competency.entity';
import { CompetencyCategory } from './entities/competency-category.entity';
import { EmployeeSkill } from './entities/employee-skill.entity';
import { EmployeeCompetency } from './entities/employee-competency.entity';
import { CreateSkillTypeDto, UpdateSkillTypeDto } from './dto/skill-type.dto';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { CreateCompetencyDto, UpdateCompetencyDto } from './dto/competency.dto';
import {
  CreateCompetencyCategoryDto,
  UpdateCompetencyCategoryDto,
} from './dto/competency-category.dto';
import {
  CreateEmployeeSkillDto,
  UpdateEmployeeSkillDto,
} from './dto/employee-skill.dto';
import {
  CreateEmployeeCompetencyDto,
  UpdateEmployeeCompetencyDto,
} from './dto/employee-competency.dto';

// ────────────────────────────────────────────────────────────────
// SKILL TYPES CONTROLLER (Catalog Management)
// ────────────────────────────────────────────────────────────────

@ApiTags('Skill Types')
@ApiBearerAuth()
@Controller('skill-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SkillTypesController {
  constructor(private readonly service: SkillsCompetenciesService) {}

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'skill-type' })
  @ApiOperation({ summary: 'List all skill types' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter to active skill types only',
  })
  @ApiResponse({
    status: 200,
    description: 'List of skill types',
    type: [SkillType],
  })
  findAll(
    @Req() req: any,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<SkillType[]> {
    const companyId = req.user.companyId;
    return this.service.findAllSkillTypes(companyId, activeOnly === 'true');
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'skill-type' })
  @ApiOperation({ summary: 'Get a skill type by ID' })
  @ApiResponse({
    status: 200,
    description: 'Skill type details',
    type: SkillType,
  })
  @ApiResponse({ status: 404, description: 'Skill type not found' })
  findOne(@Param('id') id: string, @Req() req: any): Promise<SkillType> {
    return this.service.findSkillTypeById(id, req.user.companyId);
  }

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'skill-type' })
  @ApiOperation({ summary: 'Create a new skill type' })
  @ApiResponse({
    status: 201,
    description: 'Skill type created',
    type: SkillType,
  })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  create(@Body() dto: CreateSkillTypeDto, @Req() req: any): Promise<SkillType> {
    return this.service.createSkillType(dto, req.user.companyId);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'skill-type' })
  @ApiOperation({ summary: 'Update a skill type' })
  @ApiResponse({
    status: 200,
    description: 'Skill type updated',
    type: SkillType,
  })
  @ApiResponse({ status: 404, description: 'Skill type not found' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSkillTypeDto,
    @Req() req: any,
  ): Promise<SkillType> {
    return this.service.updateSkillType(id, dto, req.user.companyId);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'skill-type' })
  @ApiOperation({ summary: 'Archive a skill type (set inactive)' })
  @ApiResponse({
    status: 200,
    description: 'Skill type archived',
    type: SkillType,
  })
  @ApiResponse({ status: 404, description: 'Skill type not found' })
  archive(@Param('id') id: string, @Req() req: any): Promise<SkillType> {
    return this.service.archiveSkillType(id, req.user.companyId);
  }
}

// ────────────────────────────────────────────────────────────────
// SKILLS CONTROLLER (Catalog Management)
// ────────────────────────────────────────────────────────────────

@ApiTags('Skills')
@ApiBearerAuth()
@Controller('skills')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SkillsController {
  constructor(private readonly service: SkillsCompetenciesService) {}

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'skill' })
  @ApiOperation({ summary: 'List all skills' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter to active skills only',
  })
  @ApiQuery({
    name: 'skillTypeId',
    required: false,
    type: String,
    description: 'Filter by skill type ID',
  })
  @ApiResponse({ status: 200, description: 'List of skills', type: [Skill] })
  findAll(
    @Req() req: any,
    @Query('activeOnly') activeOnly?: string,
    @Query('skillTypeId') skillTypeId?: string,
  ): Promise<Skill[]> {
    const companyId = req.user.companyId;
    return this.service.findAllSkills(companyId, {
      activeOnly: activeOnly === 'true',
      skillTypeId,
    });
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'skill' })
  @ApiOperation({ summary: 'Get a skill by ID' })
  @ApiResponse({ status: 200, description: 'Skill details', type: Skill })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  findOne(@Param('id') id: string, @Req() req: any): Promise<Skill> {
    return this.service.findSkillById(id, req.user.companyId);
  }

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'skill' })
  @ApiOperation({ summary: 'Create a new skill' })
  @ApiResponse({ status: 201, description: 'Skill created', type: Skill })
  @ApiResponse({ status: 404, description: 'Skill type not found' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  create(@Body() dto: CreateSkillDto, @Req() req: any): Promise<Skill> {
    return this.service.createSkill(dto, req.user.companyId);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'skill' })
  @ApiOperation({ summary: 'Update a skill' })
  @ApiResponse({ status: 200, description: 'Skill updated', type: Skill })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
    @Req() req: any,
  ): Promise<Skill> {
    return this.service.updateSkill(id, dto, req.user.companyId);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'skill' })
  @ApiOperation({ summary: 'Archive a skill (set inactive)' })
  @ApiResponse({ status: 200, description: 'Skill archived', type: Skill })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  archive(@Param('id') id: string, @Req() req: any): Promise<Skill> {
    return this.service.archiveSkill(id, req.user.companyId);
  }
}

// ────────────────────────────────────────────────────────────────
// COMPETENCY CATEGORIES CONTROLLER (Catalog Management)
// ────────────────────────────────────────────────────────────────

@ApiTags('Competency Categories')
@ApiBearerAuth()
@Controller('competency-categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompetencyCategoriesController {
  constructor(private readonly service: SkillsCompetenciesService) {}

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'competency-category' })
  @ApiOperation({ summary: 'List all competency categories' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter to active competency categories only',
  })
  @ApiResponse({
    status: 200,
    description: 'List of competency categories',
    type: [CompetencyCategory],
  })
  findAll(
    @Req() req: any,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<CompetencyCategory[]> {
    const companyId = req.user.companyId;
    return this.service.findAllCompetencyCategories(
      companyId,
      activeOnly === 'true',
    );
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'competency-category' })
  @ApiOperation({ summary: 'Get a competency category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Competency category details',
    type: CompetencyCategory,
  })
  @ApiResponse({ status: 404, description: 'Competency category not found' })
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<CompetencyCategory> {
    return this.service.findCompetencyCategoryById(id, req.user.companyId);
  }

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'competency-category' })
  @ApiOperation({ summary: 'Create a new competency category' })
  @ApiResponse({
    status: 201,
    description: 'Competency category created',
    type: CompetencyCategory,
  })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  create(
    @Body() dto: CreateCompetencyCategoryDto,
    @Req() req: any,
  ): Promise<CompetencyCategory> {
    return this.service.createCompetencyCategory(dto, req.user.companyId);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'competency-category' })
  @ApiOperation({ summary: 'Update a competency category' })
  @ApiResponse({
    status: 200,
    description: 'Competency category updated',
    type: CompetencyCategory,
  })
  @ApiResponse({ status: 404, description: 'Competency category not found' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompetencyCategoryDto,
    @Req() req: any,
  ): Promise<CompetencyCategory> {
    return this.service.updateCompetencyCategory(id, dto, req.user.companyId);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'competency-category' })
  @ApiOperation({ summary: 'Archive a competency category (set inactive)' })
  @ApiResponse({
    status: 200,
    description: 'Competency category archived',
    type: CompetencyCategory,
  })
  @ApiResponse({ status: 404, description: 'Competency category not found' })
  archive(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<CompetencyCategory> {
    return this.service.archiveCompetencyCategory(id, req.user.companyId);
  }
}

// ────────────────────────────────────────────────────────────────
// COMPETENCIES CONTROLLER (Catalog Management)
// ────────────────────────────────────────────────────────────────

@ApiTags('Competencies')
@ApiBearerAuth()
@Controller('competencies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompetenciesController {
  constructor(private readonly service: SkillsCompetenciesService) {}

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'competency' })
  @ApiOperation({ summary: 'List all competencies' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter to active competencies only',
  })
  @ApiQuery({
    name: 'competencyCategoryId',
    required: false,
    type: String,
    description: 'Filter by competency category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of competencies',
    type: [Competency],
  })
  findAll(
    @Req() req: any,
    @Query('activeOnly') activeOnly?: string,
    @Query('competencyCategoryId') competencyCategoryId?: string,
  ): Promise<Competency[]> {
    const companyId = req.user.companyId;
    return this.service.findAllCompetencies(companyId, {
      activeOnly: activeOnly === 'true',
      competencyCategoryId,
    });
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'competency' })
  @ApiOperation({ summary: 'Get a competency by ID' })
  @ApiResponse({
    status: 200,
    description: 'Competency details',
    type: Competency,
  })
  @ApiResponse({ status: 404, description: 'Competency not found' })
  findOne(@Param('id') id: string, @Req() req: any): Promise<Competency> {
    return this.service.findCompetencyById(id, req.user.companyId);
  }

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'competency' })
  @ApiOperation({ summary: 'Create a new competency' })
  @ApiResponse({
    status: 201,
    description: 'Competency created',
    type: Competency,
  })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  create(
    @Body() dto: CreateCompetencyDto,
    @Req() req: any,
  ): Promise<Competency> {
    return this.service.createCompetency(dto, req.user.companyId);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'competency' })
  @ApiOperation({ summary: 'Update a competency' })
  @ApiResponse({
    status: 200,
    description: 'Competency updated',
    type: Competency,
  })
  @ApiResponse({ status: 404, description: 'Competency not found' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompetencyDto,
    @Req() req: any,
  ): Promise<Competency> {
    return this.service.updateCompetency(id, dto, req.user.companyId);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'competency' })
  @ApiOperation({ summary: 'Archive a competency (set inactive)' })
  @ApiResponse({
    status: 200,
    description: 'Competency archived',
    type: Competency,
  })
  @ApiResponse({ status: 404, description: 'Competency not found' })
  archive(@Param('id') id: string, @Req() req: any): Promise<Competency> {
    return this.service.archiveCompetency(id, req.user.companyId);
  }
}

// ────────────────────────────────────────────────────────────────
// EMPLOYEE SKILLS CONTROLLER
// ────────────────────────────────────────────────────────────────

@ApiTags('Employee Skills')
@ApiBearerAuth()
@Controller('employees/:employeeId/skills')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeeSkillsController {
  constructor(private readonly service: SkillsCompetenciesService) {}

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'employee' })
  @ApiOperation({ summary: 'List skills for an employee' })
  @ApiResponse({
    status: 200,
    description: 'List of employee skills',
    type: [EmployeeSkill],
  })
  findAll(
    @Param('employeeId') employeeId: string,
    @Req() req: any,
  ): Promise<EmployeeSkill[]> {
    return this.service.findEmployeeSkills(employeeId, req.user.companyId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'employee' })
  @ApiOperation({ summary: 'Get an employee skill by ID' })
  @ApiResponse({
    status: 200,
    description: 'Employee skill details',
    type: EmployeeSkill,
  })
  @ApiResponse({ status: 404, description: 'Employee skill not found' })
  findOne(
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<EmployeeSkill> {
    return this.service.findEmployeeSkillById(
      id,
      employeeId,
      req.user.companyId,
    );
  }

  @Post()
  @RequirePermissions({ action: 'update', resourceType: 'employee' })
  @ApiOperation({ summary: 'Add a skill to an employee' })
  @ApiResponse({
    status: 201,
    description: 'Employee skill created',
    type: EmployeeSkill,
  })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  @ApiResponse({ status: 409, description: 'Employee already has this skill' })
  create(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateEmployeeSkillDto,
    @Req() req: any,
  ): Promise<EmployeeSkill> {
    return this.service.createEmployeeSkill(
      employeeId,
      dto,
      req.user.companyId,
    );
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'employee' })
  @ApiOperation({ summary: 'Update an employee skill' })
  @ApiResponse({
    status: 200,
    description: 'Employee skill updated',
    type: EmployeeSkill,
  })
  @ApiResponse({ status: 404, description: 'Employee skill not found' })
  update(
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeSkillDto,
    @Req() req: any,
  ): Promise<EmployeeSkill> {
    return this.service.updateEmployeeSkill(
      id,
      employeeId,
      dto,
      req.user.companyId,
    );
  }

  @Delete(':id')
  @RequirePermissions({ action: 'update', resourceType: 'employee' })
  @ApiOperation({ summary: 'Remove a skill from an employee' })
  @ApiResponse({ status: 200, description: 'Employee skill removed' })
  @ApiResponse({ status: 404, description: 'Employee skill not found' })
  async remove(
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<{ deleted: boolean }> {
    await this.service.deleteEmployeeSkill(id, employeeId, req.user.companyId);
    return { deleted: true };
  }
}

// ────────────────────────────────────────────────────────────────
// EMPLOYEE COMPETENCIES CONTROLLER
// ────────────────────────────────────────────────────────────────

@ApiTags('Employee Competencies')
@ApiBearerAuth()
@Controller('employees/:employeeId/competencies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeeCompetenciesController {
  constructor(private readonly service: SkillsCompetenciesService) {}

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'employee' })
  @ApiOperation({ summary: 'List competency assessments for an employee' })
  @ApiResponse({
    status: 200,
    description: 'List of employee competencies',
    type: [EmployeeCompetency],
  })
  findAll(
    @Param('employeeId') employeeId: string,
    @Req() req: any,
  ): Promise<EmployeeCompetency[]> {
    return this.service.findEmployeeCompetencies(
      employeeId,
      req.user.companyId,
    );
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'employee' })
  @ApiOperation({ summary: 'Get an employee competency by ID' })
  @ApiResponse({
    status: 200,
    description: 'Employee competency details',
    type: EmployeeCompetency,
  })
  @ApiResponse({ status: 404, description: 'Employee competency not found' })
  findOne(
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<EmployeeCompetency> {
    return this.service.findEmployeeCompetencyById(
      id,
      employeeId,
      req.user.companyId,
    );
  }

  @Post()
  @RequirePermissions({ action: 'update', resourceType: 'employee' })
  @ApiOperation({ summary: 'Add a competency assessment for an employee' })
  @ApiResponse({
    status: 201,
    description: 'Employee competency created',
    type: EmployeeCompetency,
  })
  @ApiResponse({ status: 404, description: 'Competency not found' })
  @ApiResponse({
    status: 409,
    description: 'Employee already has this competency assessed',
  })
  create(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateEmployeeCompetencyDto,
    @Req() req: any,
  ): Promise<EmployeeCompetency> {
    return this.service.createEmployeeCompetency(
      employeeId,
      dto,
      req.user.companyId,
    );
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'employee' })
  @ApiOperation({ summary: 'Update an employee competency assessment' })
  @ApiResponse({
    status: 200,
    description: 'Employee competency updated',
    type: EmployeeCompetency,
  })
  @ApiResponse({ status: 404, description: 'Employee competency not found' })
  update(
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeCompetencyDto,
    @Req() req: any,
  ): Promise<EmployeeCompetency> {
    return this.service.updateEmployeeCompetency(
      id,
      employeeId,
      dto,
      req.user.companyId,
    );
  }

  @Delete(':id')
  @RequirePermissions({ action: 'update', resourceType: 'employee' })
  @ApiOperation({ summary: 'Remove a competency assessment from an employee' })
  @ApiResponse({ status: 200, description: 'Employee competency removed' })
  @ApiResponse({ status: 404, description: 'Employee competency not found' })
  async remove(
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<{ deleted: boolean }> {
    await this.service.deleteEmployeeCompetency(
      id,
      employeeId,
      req.user.companyId,
    );
    return { deleted: true };
  }
}
