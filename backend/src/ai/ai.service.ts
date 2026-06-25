import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly mlServiceUrl = (() => {
    const raw = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    return raw.startsWith('http') ? raw : `https://${raw}`;
  })();


  constructor(private prisma: PrismaService) {}

  async getInsights(userId: string) {
    const insights: any[] = [];

    // 1. Fetch base data from database
    const employees = await this.prisma.employee.findMany({ where: { userId } });
    const products = await this.prisma.product.findMany({ where: { userId } });
    const incomes = await this.prisma.income.findMany({ where: { userId } });
    const expenses = await this.prisma.expense.findMany({ where: { userId } });

    const totalRevenue = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonthDate = new Date();
    lastMonthDate.setMonth(now.getMonth() - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    // Calculate current month vs last month revenue
    const currentMonthRevenue = incomes
      .filter((inc) => {
        const d = new Date(inc.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + item.amount, 0);

    const lastMonthRevenue = incomes
      .filter((inc) => {
        const d = new Date(inc.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      })
      .reduce((sum, item) => sum + item.amount, 0);

    // Insight 1: Revenue trend
    if (lastMonthRevenue > 0) {
      const pctChange = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
      if (pctChange > 0) {
        insights.push({
          id: 'insight-1',
          type: 'success',
          category: 'Finance',
          title: 'Revenue growth increased',
          description: `Monthly revenue has increased by ${pctChange.toFixed(1)}% compared to last month ($${currentMonthRevenue} vs $${lastMonthRevenue}).`,
          suggestion: 'High-performing cycle. Great time to reinvest in marketing or expand inventory.',
        });
      } else {
        insights.push({
          id: 'insight-1',
          type: 'warning',
          category: 'Finance',
          title: 'Revenue contraction detected',
          description: `Monthly revenue decreased by ${Math.abs(pctChange).toFixed(1)}% compared to last month ($${currentMonthRevenue} vs $${lastMonthRevenue}).`,
          suggestion: 'Analyze recent sales conversions or run targeted promotions to stimulate customer demand.',
        });
      }
    } else if (currentMonthRevenue > 0) {
      insights.push({
        id: 'insight-1',
        type: 'success',
        category: 'Finance',
        title: 'Initial revenue recorded',
        description: `Logged $${currentMonthRevenue} in revenue for this cycle. No matching baseline records found from previous month.`,
        suggestion: 'Keep recording sales to establish a baseline for comparative seasonal reports.',
      });
    } else {
      insights.push({
        id: 'insight-1',
        type: 'info',
        category: 'Finance',
        title: 'No sales logged this month',
        description: 'Revenue stands at $0 for the current calendar month.',
        suggestion: 'Create new income logs in the Finance section to activate financial reports.',
      });
    }

    // Insight 2: Low Stock Alerts
    const lowStockProducts = products.filter((prod) => prod.quantity <= 10);
    if (lowStockProducts.length > 0) {
      const topLow = lowStockProducts.slice(0, 3).map(p => `${p.productName} (${p.quantity} units)`).join(', ');
      const suffix = lowStockProducts.length > 3 ? ` and ${lowStockProducts.length - 3} other items` : '';
      insights.push({
        id: 'insight-2',
        type: 'danger',
        category: 'Inventory',
        title: 'Inventory stock is critical',
        description: `Low inventory levels detected for: ${topLow}${suffix}.`,
        suggestion: 'Recommend dispatching prompt procurement requests to the registered suppliers.',
      });
    } else if (products.length > 0) {
      insights.push({
        id: 'insight-2',
        type: 'success',
        category: 'Inventory',
        title: 'Healthy stock levels',
        description: 'All registered products in your inventory have a safe buffer stock (above 10 units).',
        suggestion: 'Maintain standard stock verification audits.',
      });
    } else {
      insights.push({
        id: 'insight-2',
        type: 'info',
        category: 'Inventory',
        title: 'Inventory catalog is empty',
        description: 'No product records found in the database.',
        suggestion: 'Add products in the Inventory Management module to start tracking stock levels.',
      });
    }

    // Insight 3: Employee growth
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newEmployees = employees.filter((emp) => new Date(emp.joiningDate) >= thirtyDaysAgo);
    
    if (newEmployees.length > 0) {
      insights.push({
        id: 'insight-3',
        type: 'info',
        category: 'Human Resources',
        title: 'Employee growth increased',
        description: `${newEmployees.length} new employee(s) joined the company in the last 30 days.`,
        suggestion: 'Schedule onboarding check-ins to support work transition and performance alignment.',
      });
    } else if (employees.length > 0) {
      insights.push({
        id: 'insight-3',
        type: 'neutral',
        category: 'Human Resources',
        title: 'Stable workforce size',
        description: `Total workforce remains stable at ${employees.length} active employee profiles.`,
        suggestion: 'Focus on talent development, training initiatives, and current performance reviews.',
      });
    }

    // Insight 4: Finance Profitability & Cash Flow
    if (totalRevenue > 0) {
      const profitMargin = ((totalRevenue - totalExpenses) / totalRevenue) * 100;
      const expenseRatio = (totalExpenses / totalRevenue) * 100;

      if (profitMargin >= 30) {
        insights.push({
          id: 'insight-4',
          type: 'success',
          category: 'Finance',
          title: 'Strong profit margins',
          description: `Your enterprise is generating high yields with a net profit margin of ${profitMargin.toFixed(1)}%.`,
          suggestion: 'Operational costs are well balanced. Maintain current budget boundaries.',
        });
      } else if (expenseRatio > 80) {
        insights.push({
          id: 'insight-4',
          type: 'danger',
          category: 'Finance',
          title: 'High overhead exposure',
          description: `Operating expenses account for ${expenseRatio.toFixed(1)}% of your total revenue.`,
          suggestion: 'Audit high-outlay categories under Expenses to reduce overhead costs.',
        });
      }
    }

    // Call Python ML service endpoints for predictions (with graceful fallback)
    try {
      if (incomes.length > 0 || expenses.length > 0) {
        const payload = {
          incomes: incomes.map(i => ({ date: i.date.toISOString().split('T')[0], amount: i.amount })),
          expenses: expenses.map(e => ({ date: e.date.toISOString().split('T')[0], amount: e.amount })),
          months_to_predict: 3
        };

        const response = await fetch(`${this.mlServiceUrl}/predict/finance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const resJson = await response.json();
          const pRev = resJson.predicted_revenue || [];
          const pExp = resJson.predicted_expenses || [];
          
          if (pRev.length > 0) {
            insights.push({
              id: 'insight-ml-finance',
              type: 'info',
              category: 'AI Finance Forecast',
              title: 'Next 3-Months Cash Flow Projection',
              description: `AI models project future monthly revenues at [ $${pRev.join(', $')} ] and future expenses at [ $${pExp.join(', $')} ].`,
              suggestion: 'Ensure liquidity match is sufficient to cover forecasted overhead expenditures.',
            });
          }
        }
      }
    } catch (err) {
      this.logger.warn(`AI Finance Forecast unavailable: ${err.message}`);
    }

    try {
      if (employees.length > 0) {
        const payload = {
          employees: employees.map(e => ({
            id: e.id,
            name: e.name,
            department: e.department,
            salary: e.salary,
            joiningDate: e.joiningDate.toISOString().split('T')[0]
          }))
        };

        const response = await fetch(`${this.mlServiceUrl}/predict/turnover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const resJson = await response.json();
          const risks = resJson.risks || [];
          const highRisk = risks.filter((r: any) => r.riskLevel === 'High');
          
          if (highRisk.length > 0) {
            const riskNames = highRisk.map((r: any) => `${r.name} (${r.riskScore}%)`).join(', ');
            insights.push({
              id: 'insight-ml-turnover',
              type: 'warning',
              category: 'AI Retention Warning',
              title: 'High Retention Risks Flagged',
              description: `Turnover prediction models flagged elevated attrition exposure for: ${riskNames}.`,
              suggestion: 'Schedule performance/satisfaction reviews and analyze relative salary margins.',
            });
          }
        }
      }
    } catch (err) {
      this.logger.warn(`AI Retention Forecast unavailable: ${err.message}`);
    }

    return { success: true, count: insights.length, data: insights };
  }
}
