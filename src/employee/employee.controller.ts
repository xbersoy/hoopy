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
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { PaginatedResponse } from '../shared/dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermissions } from '../permissions/decorators/require-permissions.decorator';
import { Employee } from './entities/employee.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @RequirePermissions({ action: 'create', resourceType: 'employee' })
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({
    status: 201,
    description: 'Employee successfully created',
    type: Employee,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  @RequirePermissions({ action: 'read', resourceType: 'employee' })
  @ApiOperation({ summary: 'Get employees (paginated, searchable)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of employees',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query() query: QueryEmployeeDto,
  ): Promise<PaginatedResponse<Employee>> {
    return this.employeeService.findPaginated(query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resourceType: 'employee' })
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiResponse({
    status: 200,
    description: 'Employee details',
    type: Employee,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findOne(@Param('id') id: string): Promise<Employee> {
    return this.employeeService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resourceType: 'employee' })
  @ApiOperation({ summary: 'Update an employee' })
  @ApiResponse({
    status: 200,
    description: 'Employee successfully updated',
    type: Employee,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resourceType: 'employee' })
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiResponse({
    status: 200,
    description: 'Employee successfully deleted',
    type: Employee,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  remove(@Param('id') id: string): Promise<Employee> {
    return this.employeeService.remove(id);
  }
}
