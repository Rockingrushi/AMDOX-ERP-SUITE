import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto, UpdateAttendanceDto } from './attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private calculateHours(checkInStr?: string | null, checkOutStr?: string | null) {
    if (!checkInStr || !checkOutStr) return { workingHours: 0, overtimeHours: 0 };
    try {
      const parseTime = (timeStr: string) => {
        let hours = 0;
        let minutes = 0;
        if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
          const matches = timeStr.match(/^(\d+):(\d+)\s*(am|pm)$/i);
          if (matches) {
            hours = parseInt(matches[1], 10);
            minutes = parseInt(matches[2], 10);
            const ampm = matches[3].toLowerCase();
            if (ampm === 'pm' && hours < 12) hours += 12;
            if (ampm === 'am' && hours === 12) hours = 0;
          }
        } else {
          const matches = timeStr.match(/^(\d+):(\d+)$/);
          if (matches) {
            hours = parseInt(matches[1], 10);
            minutes = parseInt(matches[2], 10);
          }
        }
        return hours * 60 + minutes;
      };

      const inMin = parseTime(checkInStr);
      const outMin = parseTime(checkOutStr);
      let diffMin = outMin - inMin;
      if (diffMin < 0) diffMin = 0;
      const workingHours = parseFloat((diffMin / 60).toFixed(2));
      const overtimeHours = workingHours > 8 ? parseFloat((workingHours - 8).toFixed(2)) : 0;
      return { workingHours, overtimeHours };
    } catch (err) {
      return { workingHours: 0, overtimeHours: 0 };
    }
  }

  async findAll(userId: string, queryParams: any) {
    const { employeeId, department, status, date, search, page = '1', limit = '10' } = queryParams;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const whereClause: any = { userId };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }
    if (department) {
      whereClause.department = department;
    }
    if (status) {
      whereClause.status = status;
    }
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      whereClause.date = { gte: targetDate, lt: nextDate };
    }

    if (search) {
      whereClause.OR = [
        { employeeName: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const count = await this.prisma.attendance.count({ where: whereClause });
    const skip = (pageNum - 1) * limitNum;

    const records = await this.prisma.attendance.findMany({
      where: whereClause,
      orderBy: [{ date: 'desc' }, { employeeName: 'asc' }],
      skip,
      take: limitNum,
    });

    return {
      success: true,
      count,
      page: pageNum,
      pages: Math.ceil(count / limitNum),
      data: records,
    };
  }

  async findOne(id: string, userId: string) {
    const record = await this.prisma.attendance.findFirst({
      where: { id, userId },
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    return { success: true, data: record };
  }

  async mark(userId: string, dto: MarkAttendanceDto) {
    const { employeeId, date, status, checkIn, checkOut, remarks } = dto;

    if (!employeeId || !date || !status) {
      throw new BadRequestException('Please provide employeeId, date, and status');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, userId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    if (attendanceDate > new Date()) {
      throw new BadRequestException('Attendance date cannot be in the future');
    }

    const { workingHours, overtimeHours } = this.calculateHours(checkIn, checkOut);

    // Check if record exists for this employee on this date
    let record = await this.prisma.attendance.findFirst({
      where: {
        userId,
        employeeId,
        date: attendanceDate,
      },
    });

    if (record) {
      // Update existing record
      const updatedRecord = await this.prisma.attendance.update({
        where: { id: record.id },
        data: {
          status,
          checkIn: checkIn || null,
          checkOut: checkOut || null,
          workingHours,
          overtimeHours,
          remarks: remarks || null,
          updatedBy: userId,
        },
      });
      return { success: true, message: 'Attendance updated successfully', data: updatedRecord };
    } else {
      // Create new record
      const newRecord = await this.prisma.attendance.create({
        data: {
          userId,
          employeeId,
          employeeName: employee.name,
          department: employee.department,
          designation: employee.designation,
          date: attendanceDate,
          status,
          checkIn: checkIn || null,
          checkOut: checkOut || null,
          workingHours,
          overtimeHours,
          remarks: remarks || null,
          createdBy: userId,
        },
      });
      return { success: true, message: 'Attendance marked successfully', data: newRecord };
    }
  }

  async update(id: string, userId: string, dto: UpdateAttendanceDto) {
    const record = await this.prisma.attendance.findFirst({
      where: { id, userId },
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    const { workingHours, overtimeHours } = this.calculateHours(dto.checkIn, dto.checkOut);

    const updatedRecord = await this.prisma.attendance.update({
      where: { id },
      data: {
        status: dto.status,
        checkIn: dto.checkIn || null,
        checkOut: dto.checkOut || null,
        workingHours,
        overtimeHours,
        remarks: dto.remarks || null,
        updatedBy: userId,
      },
    });

    return { success: true, message: 'Attendance updated successfully', data: updatedRecord };
  }

  async remove(id: string, userId: string) {
    const record = await this.prisma.attendance.findFirst({
      where: { id, userId },
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    await this.prisma.attendance.delete({
      where: { id },
    });

    return { success: true, message: 'Attendance record deleted' };
  }

  async stats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalEmployees = await this.prisma.employee.count({ where: { userId } });

    // Fetch today's records
    const todayRecords = await this.prisma.attendance.findMany({
      where: {
        userId,
        date: { gte: today, lt: tomorrow },
      },
    });

    const activePresences = todayRecords.filter((r) =>
      ['Present', 'Late', 'Work From Home', 'Half Day'].includes(r.status),
    );
    const todayPresent = activePresences.length;
    const todayAbsent = todayRecords.filter((r) => r.status === 'Absent').length;
    const todayLate = todayRecords.filter((r) => r.status === 'Late').length;
    const todayHalfDay = todayRecords.filter((r) => r.status === 'Half Day').length;

    const attendancePercentage = totalEmployees > 0
      ? parseFloat(((todayPresent / totalEmployees) * 100).toFixed(1))
      : 0;

    return {
      success: true,
      data: {
        totalEmployees,
        todayPresent,
        todayAbsent,
        todayLate,
        todayHalfDay,
        attendancePercentage,
      },
    };
  }

  async report(userId: string, queryParams: any) {
    const { startDate, endDate, employeeId, department } = queryParams;

    const whereClause: any = { userId };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }
    if (department) {
      whereClause.department = department;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    const records = await this.prisma.attendance.findMany({
      where: whereClause,
      orderBy: [{ date: 'desc' }, { employeeName: 'asc' }],
    });

    const totalRecords = records.length;
    const presentRecords = records.filter((r) =>
      ['Present', 'Work From Home', 'Late', 'Half Day'].includes(r.status),
    );
    const totalWorkingHours = presentRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0);
    const avgWorkingHours = presentRecords.length > 0 ? parseFloat((totalWorkingHours / presentRecords.length).toFixed(1)) : 0;
    const lateCount = records.filter((r) => r.status === 'Late').length;
    const halfDayCount = records.filter((r) => r.status === 'Half Day').length;
    const absentCount = records.filter((r) => r.status === 'Absent').length;

    return {
      success: true,
      data: {
        records,
        summary: {
          totalRecords,
          presentCount: presentRecords.length,
          absentCount,
          lateCount,
          halfDayCount,
          avgWorkingHours,
          totalWorkingHours,
        },
      },
    };
  }
}
