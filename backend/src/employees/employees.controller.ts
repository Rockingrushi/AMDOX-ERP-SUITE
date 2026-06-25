import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './employees.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  async findAll(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query('search') search?: string,
  ) {
    return this.employeesService.findAll(user.id, search);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.employeesService.findOne(id, user.id);
  }

  @Post()
  async create(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(user.id, dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, user.id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.employeesService.remove(id, user.id);
  }
}
