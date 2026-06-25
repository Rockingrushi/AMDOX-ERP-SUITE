import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto, UpdateLeaveDto, RejectLeaveDto } from './leaves.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('leaves')
@UseGuards(RolesGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get()
  async findAll(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query() queryParams: any,
  ) {
    return this.leavesService.findAll(user.id, queryParams);
  }

  @Get('stats')
  async stats(@CurrentUser() user: Omit<User, 'password'>) {
    return this.leavesService.stats(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.leavesService.findOne(id, user.id);
  }

  @Post()
  async create(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: CreateLeaveDto,
  ) {
    return this.leavesService.create(user.id, dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: UpdateLeaveDto,
  ) {
    return this.leavesService.update(id, user.id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.leavesService.remove(id, user.id);
  }

  @Put(':id/approve')
  @Roles('admin')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.leavesService.approve(id, user.id);
  }

  @Put(':id/reject')
  @Roles('admin')
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: RejectLeaveDto,
  ) {
    return this.leavesService.reject(id, user.id, dto);
  }
}
