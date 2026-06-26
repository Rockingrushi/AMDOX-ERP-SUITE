import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();



const seedAdmin = {
  name: 'AMX Master Admin',
  email: 'admin@amx.com',
  password: 'admin123',
  role: 'admin' as const,
};

const seedEmployees = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.s@amx.com',
    phone: '+91 98765 43210',
    department: 'Engineering',
    designation: 'Senior Developer',
    salary: 95000,
    joiningDate: new Date('2024-03-15'),
  },
  {
    name: 'Diya Patel',
    email: 'diya.p@amx.com',
    phone: '+91 98765 43211',
    department: 'Sales',
    designation: 'Account Executive',
    salary: 68000,
    joiningDate: new Date('2024-06-10'),
  },
  {
    name: 'Kabir Mehta',
    email: 'kabir.m@amx.com',
    phone: '+91 98765 43212',
    department: 'Marketing',
    designation: 'Campaign Manager',
    salary: 62000,
    joiningDate: new Date('2024-09-01'),
  },
  {
    name: 'Isha Sen',
    email: 'isha.s@amx.com',
    phone: '+91 98765 43213',
    department: 'Human Resources',
    designation: 'HR Coordinator',
    salary: 55000,
    joiningDate: new Date('2025-01-15'),
  },
  {
    name: 'Rohan Verma',
    email: 'rohan.v@amx.com',
    phone: '+91 98765 43214',
    department: 'Engineering',
    designation: 'QA Specialist',
    salary: 70000,
    joiningDate: new Date('2025-02-28'),
  },
  {
    name: 'Ananya Iyer',
    email: 'ananya.i@amx.com',
    phone: '+91 98765 43215',
    department: 'Design',
    designation: 'UI/UX Designer',
    salary: 80000,
    joiningDate: new Date('2025-04-10'),
  },
  {
    name: 'Samar Singhania',
    email: 'samar.s@amx.com',
    phone: '+91 98765 43216',
    department: 'Finance',
    designation: 'Financial Analyst',
    salary: 75000,
    joiningDate: new Date('2025-05-18'),
  },
  {
    name: 'Neha Roy',
    email: 'neha.r@amx.com',
    phone: '+91 98765 43217',
    department: 'Sales',
    designation: 'Regional Lead',
    salary: 90000,
    joiningDate: new Date('2025-06-01'),
  }
];

const seedProducts = [
  {
    productName: 'ThinkPad L14 Gen 4',
    category: 'Hardware',
    price: 1100,
    quantity: 15,
    supplier: 'Lenovo Enterprise Solutions',
  },
  {
    productName: 'Dell 27" 4K Monitor',
    category: 'Hardware',
    price: 350,
    quantity: 8,
    supplier: 'Dell India Pvt Ltd',
  },
  {
    productName: 'Slack Enterprise License',
    category: 'Software',
    price: 120,
    quantity: 150,
    supplier: 'Slack Technologies Inc.',
  },
  {
    productName: 'AWS Cloud Credit Voucher',
    category: 'Software',
    price: 500,
    quantity: 20,
    supplier: 'Amazon Web Services',
  },
  {
    productName: 'Logitech MX Master 3S',
    category: 'Accessories',
    price: 99,
    quantity: 35,
    supplier: 'Logitech distributor',
  },
  {
    productName: 'Ergonomic Office Chair',
    category: 'Furniture',
    price: 250,
    quantity: 5,
    supplier: 'Godrej Interio',
  },
  {
    productName: 'GitHub Enterprise Copilot (Annual)',
    category: 'Software',
    price: 240,
    quantity: 80,
    supplier: 'Microsoft India',
  }
];

const generateIncomes = (adminId: string) => {
  const list = [];
  const categories = ['SaaS Subscriptions', 'Consulting Fees', 'Service Contracts', 'Product Licensing'];
  const baseRevenue = [32000, 36000, 39000, 42000, 48000, 52000];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(15);
    
    const revVal = baseRevenue[5 - i];
    list.push(
      {
        userId: adminId,
        title: 'Monthly SaaS Billing',
        amount: Math.round(revVal * 0.6),
        category: categories[0],
        date: new Date(d),
      },
      {
        userId: adminId,
        title: 'Enterprise Support SLA',
        amount: Math.round(revVal * 0.3),
        category: categories[2],
        date: new Date(d),
      },
      {
        userId: adminId,
        title: 'Tech Advisory Invoice',
        amount: Math.round(revVal * 0.1),
        category: categories[1],
        date: new Date(d),
      }
    );
  }
  return list;
};

const generateExpenses = (adminId: string) => {
  const list = [];
  const categories = ['Infrastructure', 'Office Space', 'Marketing', 'Payroll', 'Software Subscriptions'];
  const baseExpenses = [20000, 21000, 23000, 24500, 26000, 28000];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(25);
    
    const expVal = baseExpenses[5 - i];
    list.push(
      {
        userId: adminId,
        title: 'AWS Hosting Bills',
        amount: Math.round(expVal * 0.3),
        category: categories[0],
        date: new Date(d),
      },
      {
        userId: adminId,
        title: 'Co-working Rent',
        amount: Math.round(expVal * 0.2),
        category: categories[1],
        date: new Date(d),
      },
      {
        userId: adminId,
        title: 'AdWords Campaigns',
        amount: Math.round(expVal * 0.15),
        category: categories[2],
        date: new Date(d),
      },
      {
        userId: adminId,
        title: 'Staff Payroll Payout',
        amount: Math.round(expVal * 0.35),
        category: categories[3],
        date: new Date(d),
      }
    );
  }
  return list;
};

const generateAttendance = (employees: any[], adminId: string) => {
  const attendanceLogs: any[] = [];
  const statuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Late', 'Half Day', 'Absent'];
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    employees.forEach((emp) => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      let checkIn = null;
      let checkOut = null;
      let workingHours = 0;
      let overtimeHours = 0;

      if (status === 'Present') {
        checkIn = '09:00 AM';
        checkOut = '05:00 PM';
        workingHours = 8;
        overtimeHours = 0;
      } else if (status === 'Late') {
        checkIn = '09:45 AM';
        checkOut = '05:00 PM';
        workingHours = 7.25;
        overtimeHours = 0;
      } else if (status === 'Half Day') {
        checkIn = '09:00 AM';
        checkOut = '01:00 PM';
        workingHours = 4;
        overtimeHours = 0;
      }

      attendanceLogs.push({
        userId: adminId,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        designation: emp.designation,
        date: new Date(d),
        status,
        checkIn,
        checkOut,
        workingHours,
        overtimeHours,
        remarks: status === 'Late' ? 'Late check-in due to traffic' : status === 'Half Day' ? 'Doctor appointment' : '',
        createdBy: adminId
      });
    });
  }
  return attendanceLogs;
};

const generateLeaves = (employees: any[], adminId: string) => {
  const leaves = [];
  const leaveTypes = ['Casual', 'Sick', 'Paid', 'Unpaid'];
  const statuses = ['Approved', 'Rejected', 'Pending'];
  const reasons = [
    'Family function to attend in home town',
    'Suffering from viral fever, advised bed rest',
    'Personal work at government office',
    'Urgent medical checkup for parents',
    'Moving to a new apartment'
  ];

  for (let i = 0; i < 10; i++) {
    const emp = employees[i % employees.length];
    const leaveType = leaveTypes[i % leaveTypes.length];
    const status = statuses[i % statuses.length];
    const reason = reasons[i % reasons.length];

    const start = new Date();
    start.setDate(start.getDate() - (i * 2) + 5);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + (i % 3));

    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    leaves.push({
      userId: adminId,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status,
      approvedBy: status !== 'Pending' ? adminId : null,
      approvedDate: status !== 'Pending' ? new Date() : null,
      rejectionReason: status === 'Rejected' ? 'Insufficient leave balance or team workload' : null
    });
  }
  return leaves;
};

async function main() {
  console.log('Seeding process started...');

  // Delete all existing data
  await prisma.expense.deleteMany();
  await prisma.income.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.product.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing records.');

  // Create User
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(seedAdmin.password, salt);
  const admin = await prisma.user.create({
    data: {
      name: seedAdmin.name,
      email: seedAdmin.email,
      password: hashedPassword,
      role: seedAdmin.role,
    },
  });

  console.log(`Admin user created: ${admin.email}`);

  // Create Employees
  const createdEmployees = [];
  for (const emp of seedEmployees) {
    const createdEmp = await prisma.employee.create({
      data: {
        ...emp,
        userId: admin.id,
      },
    });
    createdEmployees.push(createdEmp);
  }
  console.log(`${createdEmployees.length} employees created.`);

  // Create Products
  for (const prod of seedProducts) {
    await prisma.product.create({
      data: {
        ...prod,
        userId: admin.id,
      },
    });
  }
  console.log(`${seedProducts.length} products created.`);

  // Create Incomes
  const incomes = generateIncomes(admin.id);
  for (const inc of incomes) {
    await prisma.income.create({ data: inc });
  }
  console.log(`${incomes.length} incomes created.`);

  // Create Expenses
  const expenses = generateExpenses(admin.id);
  for (const exp of expenses) {
    await prisma.expense.create({ data: exp });
  }
  console.log(`${expenses.length} expenses created.`);

  // Create Attendance
  const attendanceLogs = generateAttendance(createdEmployees, admin.id);
  for (const att of attendanceLogs) {
    await prisma.attendance.create({ data: att });
  }
  console.log(`${attendanceLogs.length} attendance records created.`);

  // Create Leaves
  const leaves = generateLeaves(createdEmployees, admin.id);
  for (const lv of leaves) {
    await prisma.leave.create({ data: lv });
  }
  console.log(`${leaves.length} leave requests created.`);

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
