'use strict';
/**
 * Plain JS seed file — runs with `node prisma/seed.js`
 * No ts-node required. Safe for Render production builds.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const seedAdmin = {
  name: 'AMX Master Admin',
  email: 'admin@amx.com',
  password: 'admin123',
  role: 'admin',
};

const seedEmployees = [
  { name: 'Aarav Sharma', email: 'aarav.s@amx.com', phone: '+91 98765 43210', department: 'Engineering', designation: 'Senior Developer', salary: 95000, joiningDate: new Date('2024-03-15') },
  { name: 'Diya Patel', email: 'diya.p@amx.com', phone: '+91 98765 43211', department: 'Sales', designation: 'Account Executive', salary: 68000, joiningDate: new Date('2024-06-10') },
  { name: 'Kabir Mehta', email: 'kabir.m@amx.com', phone: '+91 98765 43212', department: 'Marketing', designation: 'Campaign Manager', salary: 62000, joiningDate: new Date('2024-09-01') },
  { name: 'Isha Sen', email: 'isha.s@amx.com', phone: '+91 98765 43213', department: 'Human Resources', designation: 'HR Coordinator', salary: 55000, joiningDate: new Date('2025-01-15') },
  { name: 'Rohan Verma', email: 'rohan.v@amx.com', phone: '+91 98765 43214', department: 'Engineering', designation: 'QA Specialist', salary: 70000, joiningDate: new Date('2025-02-28') },
  { name: 'Ananya Iyer', email: 'ananya.i@amx.com', phone: '+91 98765 43215', department: 'Design', designation: 'UI/UX Designer', salary: 80000, joiningDate: new Date('2025-04-10') },
  { name: 'Samar Singhania', email: 'samar.s@amx.com', phone: '+91 98765 43216', department: 'Finance', designation: 'Financial Analyst', salary: 75000, joiningDate: new Date('2025-05-18') },
  { name: 'Neha Roy', email: 'neha.r@amx.com', phone: '+91 98765 43217', department: 'Sales', designation: 'Regional Lead', salary: 90000, joiningDate: new Date('2025-06-01') },
];

const seedProducts = [
  { productName: 'ThinkPad L14 Gen 4', category: 'Hardware', price: 1100, quantity: 15, supplier: 'Lenovo Enterprise Solutions' },
  { productName: 'Dell 27" 4K Monitor', category: 'Hardware', price: 350, quantity: 8, supplier: 'Dell India Pvt Ltd' },
  { productName: 'Slack Enterprise License', category: 'Software', price: 120, quantity: 150, supplier: 'Slack Technologies Inc.' },
  { productName: 'AWS Cloud Credit Voucher', category: 'Software', price: 500, quantity: 20, supplier: 'Amazon Web Services' },
  { productName: 'Logitech MX Master 3S', category: 'Accessories', price: 99, quantity: 35, supplier: 'Logitech distributor' },
  { productName: 'Ergonomic Office Chair', category: 'Furniture', price: 250, quantity: 5, supplier: 'Godrej Interio' },
  { productName: 'GitHub Enterprise Copilot (Annual)', category: 'Software', price: 240, quantity: 80, supplier: 'Microsoft India' },
];

function generateIncomes(adminId) {
  const list = [];
  const baseRevenue = [32000, 36000, 39000, 42000, 48000, 52000];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(15);
    const v = baseRevenue[5 - i];
    list.push(
      { userId: adminId, title: 'Monthly SaaS Billing', amount: Math.round(v * 0.6), category: 'SaaS Subscriptions', date: new Date(d) },
      { userId: adminId, title: 'Enterprise Support SLA', amount: Math.round(v * 0.3), category: 'Service Contracts', date: new Date(d) },
      { userId: adminId, title: 'Tech Advisory Invoice', amount: Math.round(v * 0.1), category: 'Consulting Fees', date: new Date(d) },
    );
  }
  return list;
}

function generateExpenses(adminId) {
  const list = [];
  const baseExpenses = [20000, 21000, 23000, 24500, 26000, 28000];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(25);
    const v = baseExpenses[5 - i];
    list.push(
      { userId: adminId, title: 'AWS Hosting Bills', amount: Math.round(v * 0.3), category: 'Infrastructure', date: new Date(d) },
      { userId: adminId, title: 'Co-working Rent', amount: Math.round(v * 0.2), category: 'Office Space', date: new Date(d) },
      { userId: adminId, title: 'AdWords Campaigns', amount: Math.round(v * 0.15), category: 'Marketing', date: new Date(d) },
      { userId: adminId, title: 'Staff Payroll Payout', amount: Math.round(v * 0.35), category: 'Payroll', date: new Date(d) },
    );
  }
  return list;
}

function generateAttendance(employees, adminId) {
  const logs = [];
  const statuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Late', 'Half Day', 'Absent'];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    employees.forEach((emp) => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      let checkIn = null, checkOut = null, workingHours = 0, overtimeHours = 0;
      if (status === 'Present') { checkIn = '09:00 AM'; checkOut = '05:00 PM'; workingHours = 8; }
      else if (status === 'Late') { checkIn = '09:45 AM'; checkOut = '05:00 PM'; workingHours = 7.25; }
      else if (status === 'Half Day') { checkIn = '09:00 AM'; checkOut = '01:00 PM'; workingHours = 4; }
      logs.push({ userId: adminId, employeeId: emp.id, employeeName: emp.name, department: emp.department, designation: emp.designation, date: new Date(d), status, checkIn, checkOut, workingHours, overtimeHours, remarks: status === 'Late' ? 'Late check-in' : status === 'Half Day' ? 'Doctor appointment' : '', createdBy: adminId });
    });
  }
  return logs;
}

function generateLeaves(employees, adminId) {
  const leaves = [];
  const leaveTypes = ['Casual', 'Sick', 'Paid', 'Unpaid'];
  const statuses = ['Approved', 'Rejected', 'Pending'];
  const reasons = ['Family function', 'Viral fever', 'Personal work', 'Medical checkup', 'Moving apartments'];
  for (let i = 0; i < 10; i++) {
    const emp = employees[i % employees.length];
    const start = new Date(); start.setDate(start.getDate() - (i * 2) + 5); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + (i % 3));
    const totalDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    const status = statuses[i % statuses.length];
    leaves.push({ userId: adminId, employeeId: emp.id, employeeName: emp.name, department: emp.department, leaveType: leaveTypes[i % leaveTypes.length], startDate: start, endDate: end, totalDays, reason: reasons[i % reasons.length], status, approvedBy: status !== 'Pending' ? adminId : null, approvedDate: status !== 'Pending' ? new Date() : null, rejectionReason: status === 'Rejected' ? 'Insufficient leave balance' : null });
  }
  return leaves;
}

async function main() {
  console.log('Seeding started...');

  // Check if already seeded
  const existing = await prisma.user.findUnique({ where: { email: seedAdmin.email } });
  if (existing) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  await prisma.expense.deleteMany();
  await prisma.income.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.product.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const admin = await prisma.user.create({
    data: { name: seedAdmin.name, email: seedAdmin.email, password: await bcrypt.hash(seedAdmin.password, salt), role: seedAdmin.role },
  });
  console.log(`Admin created: ${admin.email}`);

  const createdEmployees = [];
  for (const emp of seedEmployees) {
    createdEmployees.push(await prisma.employee.create({ data: { ...emp, userId: admin.id } }));
  }
  console.log(`${createdEmployees.length} employees created.`);

  for (const prod of seedProducts) {
    await prisma.product.create({ data: { ...prod, userId: admin.id } });
  }
  console.log(`${seedProducts.length} products created.`);

  for (const inc of generateIncomes(admin.id)) {
    await prisma.income.create({ data: inc });
  }
  for (const exp of generateExpenses(admin.id)) {
    await prisma.expense.create({ data: exp });
  }
  console.log('Finance records created.');

  for (const att of generateAttendance(createdEmployees, admin.id)) {
    await prisma.attendance.create({ data: att });
  }
  console.log('Attendance records created.');

  for (const lv of generateLeaves(createdEmployees, admin.id)) {
    await prisma.leave.create({ data: lv });
  }
  console.log('Leave records created.');

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
