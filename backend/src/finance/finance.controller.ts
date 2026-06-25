import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { AddTransactionDto } from './finance.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: Omit<User, 'password'>) {
    return this.financeService.getSummary(user.id);
  }

  @Get('income')
  async getIncome(@CurrentUser() user: Omit<User, 'password'>) {
    return this.financeService.getIncome(user.id);
  }

  @Post('income')
  async addIncome(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: AddTransactionDto,
  ) {
    return this.financeService.addIncome(user.id, dto);
  }

  @Delete('income/:id')
  async deleteIncome(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.financeService.deleteIncome(id, user.id);
  }

  @Get('expense')
  async getExpense(@CurrentUser() user: Omit<User, 'password'>) {
    return this.financeService.getExpense(user.id);
  }

  @Post('expense')
  async addExpense(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: AddTransactionDto,
  ) {
    return this.financeService.addExpense(user.id, dto);
  }

  @Delete('expense/:id')
  async deleteExpense(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.financeService.deleteExpense(id, user.id);
  }
}
