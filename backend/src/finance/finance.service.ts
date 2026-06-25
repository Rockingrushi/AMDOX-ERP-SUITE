import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddTransactionDto } from './finance.dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getIncome(userId: string) {
    const incomes = await this.prisma.income.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return { success: true, count: incomes.length, data: incomes };
  }

  async addIncome(userId: string, dto: AddTransactionDto) {
    const { title, amount, category, date } = dto;

    if (!title || amount === undefined || !category || !date) {
      throw new BadRequestException('Please provide all fields');
    }

    const income = await this.prisma.income.create({
      data: {
        userId,
        title,
        amount: Number(amount),
        category,
        date: new Date(date),
      },
    });

    await this.cacheService.del(`finance:summary:${userId}`);

    return { success: true, data: income };
  }

  async deleteIncome(id: string, userId: string) {
    const income = await this.prisma.income.findFirst({
      where: { id, userId },
    });

    if (!income) {
      throw new NotFoundException('Income record not found');
    }

    await this.prisma.income.delete({
      where: { id },
    });

    await this.cacheService.del(`finance:summary:${userId}`);

    return { success: true, message: 'Income record removed' };
  }

  async getExpense(userId: string) {
    const expenses = await this.prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return { success: true, count: expenses.length, data: expenses };
  }

  async addExpense(userId: string, dto: AddTransactionDto) {
    const { title, amount, category, date } = dto;

    if (!title || amount === undefined || !category || !date) {
      throw new BadRequestException('Please provide all fields');
    }

    const expense = await this.prisma.expense.create({
      data: {
        userId,
        title,
        amount: Number(amount),
        category,
        date: new Date(date),
      },
    });

    await this.cacheService.del(`finance:summary:${userId}`);

    return { success: true, data: expense };
  }

  async deleteExpense(id: string, userId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!expense) {
      throw new NotFoundException('Expense record not found');
    }

    await this.prisma.expense.delete({
      where: { id },
    });

    await this.cacheService.del(`finance:summary:${userId}`);

    return { success: true, message: 'Expense record removed' };
  }

  async getSummary(userId: string) {
    const cacheKey = `finance:summary:${userId}`;
    const cachedSummary = await this.cacheService.get<any>(cacheKey);
    if (cachedSummary) {
      return { success: true, data: cachedSummary };
    }

    // Total counts & aggregates
    const totalEmployees = await this.prisma.employee.count({ where: { userId } });
    const totalProducts = await this.prisma.product.count({ where: { userId } });

    const incomes = await this.prisma.income.findMany({ where: { userId } });
    const expenses = await this.prisma.expense.findMany({ where: { userId } });

    const totalRevenue = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Monthly Chart Data (combining last 6 months)
    const monthlyDataMap: Record<string, any> = {};

    // Seed last 6 months with 0s to make sure chart is full
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyDataMap[key] = {
        month: d.toLocaleString('default', { month: 'short' }),
        revenue: 0,
        expense: 0,
        sortKey: key,
      };
    }

    // Accumulate Incomes
    incomes.forEach((inc) => {
      const date = new Date(inc.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyDataMap[key]) {
        monthlyDataMap[key].revenue += inc.amount;
      }
    });

    // Accumulate Expenses
    expenses.forEach((exp) => {
      const date = new Date(exp.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyDataMap[key]) {
        monthlyDataMap[key].expense += exp.amount;
      }
    });

    const monthlyChartData = Object.values(monthlyDataMap).sort((a: any, b: any) =>
      a.sortKey.localeCompare(b.sortKey),
    );

    // Inventory status chart by category
    const products = await this.prisma.product.findMany({ where: { userId } });
    const categoryMap: Record<string, number> = {};
    products.forEach((prod) => {
      const cat = prod.category;
      categoryMap[cat] = (categoryMap[cat] || 0) + prod.quantity;
    });

    const inventoryChartData = Object.keys(categoryMap).map((cat) => ({
      name: cat,
      value: categoryMap[cat],
    }));

    // Recent Activities List (Fetch recent employees, products, incomes, expenses and merge them)
    const recentEmployees = await this.prisma.employee.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const recentProducts = await this.prisma.product.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const recentIncomes = await this.prisma.income.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const recentExpenses = await this.prisma.expense.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const activities: any[] = [];

    recentEmployees.forEach((emp) => {
      activities.push({
        type: 'employee',
        title: `New Employee Joined: ${emp.name}`,
        desc: `${emp.designation} in ${emp.department}`,
        date: emp.createdAt,
      });
    });

    recentProducts.forEach((prod) => {
      activities.push({
        type: 'product',
        title: `Product Added: ${prod.productName}`,
        desc: `${prod.quantity} units added to stock at $${prod.price}/ea`,
        date: prod.createdAt,
      });
    });

    recentIncomes.forEach((inc) => {
      activities.push({
        type: 'income',
        title: `Revenue Logged: ${inc.title}`,
        desc: `Amount: +$${inc.amount} (${inc.category})`,
        date: inc.date,
      });
    });

    recentExpenses.forEach((exp) => {
      activities.push({
        type: 'expense',
        title: `Expense Logged: ${exp.title}`,
        desc: `Amount: -$${exp.amount} (${exp.category})`,
        date: exp.date,
      });
    });

    // Sort combined activities by date descending
    const recentActivities = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    const summaryData = {
      stats: {
        totalEmployees,
        totalProducts,
        totalRevenue,
        totalExpenses,
        netProfit,
      },
      monthlyChartData,
      inventoryChartData,
      recentActivities,
    };

    await this.cacheService.set(cacheKey, summaryData, 60); // Cache for 60 seconds

    return {
      success: true,
      data: summaryData,
    };
  }
}
