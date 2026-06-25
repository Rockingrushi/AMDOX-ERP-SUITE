import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './employees.dto';
import { TelemetryService } from '../telemetry/telemetry.service';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private telemetryService: TelemetryService,
  ) {}

  async findAll(userId: string, search?: string) {
    const whereClause: any = { userId };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const employees = await this.prisma.employee.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      count: employees.length,
      data: employees,
    };
  }

  async findOne(id: string, userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, userId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return { success: true, data: employee };
  }

  async create(userId: string, dto: CreateEmployeeDto) {
    const { name, email, phone, department, designation, salary, joiningDate } = dto;

    if (!name || !email || !phone || !department || !designation || !salary || !joiningDate) {
      throw new BadRequestException('Please provide all fields');
    }

    // Check if email already registered as employee for this user
    const emailExists = await this.prisma.employee.findFirst({
      where: { email, userId },
    });

    if (emailExists) {
      throw new BadRequestException('Employee with this email already exists');
    }

    const employee = await this.prisma.employee.create({
      data: {
        userId,
        name,
        email,
        phone,
        department,
        designation,
        salary: Number(salary),
        joiningDate: new Date(joiningDate),
      },
    });

    await this.telemetryService.log(
      userId,
      'CREATE_EMPLOYEE',
      'Employee',
      employee.id,
      `Created employee profile for ${employee.name} in department ${employee.department}.`,
    );

    return { success: true, data: employee };
  }

  async update(id: string, userId: string, dto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, userId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (dto.email && dto.email !== employee.email) {
      const emailExists = await this.prisma.employee.findFirst({
        where: { email: dto.email, userId },
      });
      if (emailExists) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        department: dto.department,
        designation: dto.designation,
        salary: dto.salary ? Number(dto.salary) : undefined,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
      },
    });

    await this.telemetryService.log(
      userId,
      'UPDATE_EMPLOYEE',
      'Employee',
      updatedEmployee.id,
      `Updated employee profile details for ${updatedEmployee.name}.`,
    );

    return { success: true, data: updatedEmployee };
  }

  async remove(id: string, userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, userId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Delete associated leaves & attendance records first
    await this.prisma.attendance.deleteMany({ where: { employeeId: id } });
    await this.prisma.leave.deleteMany({ where: { employeeId: id } });

    await this.prisma.employee.delete({
      where: { id },
    });

    await this.telemetryService.log(
      userId,
      'DELETE_EMPLOYEE',
      'Employee',
      id,
      `Removed employee profile for ${employee.name} (${employee.email}) and purged association logs.`,
    );

    return { success: true, message: 'Employee removed successfully' };
  }
}
