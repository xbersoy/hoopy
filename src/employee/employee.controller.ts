import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Employee } from './entities/employee.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ 
    status: 201, 
    description: 'Employee successfully created',
    type: Employee
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of employees',
    type: [Employee]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(): Promise<Employee[]> {
    return this.employeeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Employee details',
    type: Employee
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findOne(@Param('id') id: string): Promise<Employee> {
    return this.employeeService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an employee' })
  @ApiResponse({ 
    status: 200, 
    description: 'Employee successfully updated',
    type: Employee
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiResponse({ 
    status: 200, 
    description: 'Employee successfully deleted',
    type: Employee
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  remove(@Param('id') id: string): Promise<Employee> {
    return this.employeeService.remove(id);
  }
} 