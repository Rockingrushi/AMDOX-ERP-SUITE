import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto, UpdateAttendanceDto } from './attendance.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('attendance')
@UseGuards(RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  async findAll(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query() queryParams: any,
  ) {
    return this.attendanceService.findAll(user.id, queryParams);
  }

  @Get('stats')
  async stats(@CurrentUser() user: Omit<User, 'password'>) {
    return this.attendanceService.stats(user.id);
  }

  @Get('report')
  async report(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query() queryParams: any,
  ) {
    return this.attendanceService.report(user.id, queryParams);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.attendanceService.findOne(id, user.id);
  }

  @Post()
  @Roles('admin')
  async mark(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.mark(user.id, dto);
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.attendanceService.remove(id, user.id);
  }
}
