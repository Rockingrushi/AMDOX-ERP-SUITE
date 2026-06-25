import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateProductDto, UpdateProductDto } from './inventory.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAll(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.findAll(user.id, search);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.inventoryService.findOne(id, user.id);
  }

  @Post()
  async create(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: CreateProductDto,
  ) {
    return this.inventoryService.create(user.id, dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: UpdateProductDto,
  ) {
    return this.inventoryService.update(id, user.id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.inventoryService.remove(id, user.id);
  }
}
