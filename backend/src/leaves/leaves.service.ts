import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto, UpdateLeaveDto, RejectLeaveDto } from './leaves.dto';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class LeavesService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async findAll(userId: string, queryParams: any) {
    const { status, leaveType, department, search, page = '1', limit = '10' } = queryParams;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const whereClause: any = { userId };

    if (status) {
      whereClause.status = status;
    }
    if (leaveType) {
      whereClause.leaveType = leaveType;
    }
    if (department) {
      whereClause.department = department;
    }

    if (search) {
      whereClause.OR = [
        { employeeName: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
      ];
    }

    const count = await this.prisma.leave.count({ where: whereClause });
    const skip = (pageNum - 1) * limitNum;

    const leaves = await this.prisma.leave.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    return {
      success: true,
      count,
      page: pageNum,
      pages: Math.ceil(count / limitNum),
      data: leaves.map(l => this.mapLeave(l)),
    };
  }

  async findOne(id: string, userId: string) {
    const leave = await this.prisma.leave.findFirst({
      where: { id, userId },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    return { success: true, data: this.mapLeave(leave) };
  }

  async create(userId: string, dto: CreateLeaveDto) {
    const { employeeId, leaveType, startDate, endDate, reason, attachments } = dto;

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      throw new BadRequestException('Please provide all required fields');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, userId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      throw new BadRequestException('End date cannot be before start date');
    }

    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const leave = await this.prisma.leave.create({
      data: {
        userId,
        employeeId,
        employeeName: employee.name,
        department: employee.department,
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        attachments: attachments ? attachments.join(',') : '',
      },
    });

    await this.queueService.queueNotification(
      userId,
      'LEAVE_SUBMITTED',
      `New leave request submitted by ${employee.name} for ${leaveType} (${totalDays} days).`,
    );

    return { success: true, message: 'Leave request created successfully', data: this.mapLeave(leave) };
  }

  async update(id: string, userId: string, dto: UpdateLeaveDto) {
    const leave = await this.prisma.leave.findFirst({
      where: { id, userId },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (leave.status !== 'Pending') {
      throw new BadRequestException('Cannot edit leave request after approval action');
    }

    const updatedData: any = {
      leaveType: dto.leaveType,
      reason: dto.reason,
      status: dto.status,
      attachments: dto.attachments ? dto.attachments.join(',') : undefined,
    };

    if (dto.startDate && dto.endDate) {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);

      if (end < start) {
        throw new BadRequestException('End date cannot be before start date');
      }

      const timeDiff = Math.abs(end.getTime() - start.getTime());
      updatedData.startDate = start;
      updatedData.endDate = end;
      updatedData.totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    }

    const updatedLeave = await this.prisma.leave.update({
      where: { id },
      data: updatedData,
    });

    return { success: true, message: 'Leave request updated successfully', data: this.mapLeave(updatedLeave) };
  }

  async remove(id: string, userId: string) {
    const leave = await this.prisma.leave.findFirst({
      where: { id, userId },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    await this.prisma.leave.delete({
      where: { id },
    });

    return { success: true, message: 'Leave request removed successfully' };
  }

  async approve(id: string, userId: string) {
    const leave = await this.prisma.leave.findFirst({
      where: { id, userId },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    const updatedLeave = await this.prisma.leave.update({
      where: { id },
      data: {
        status: 'Approved',
        approvedBy: userId,
        approvedDate: new Date(),
        rejectionReason: '',
      },
    });

    await this.queueService.queueNotification(
      userId,
      'LEAVE_APPROVED',
      `Leave request for ${leave.employeeName} (${leave.leaveType}) has been approved.`,
    );

    return { success: true, message: 'Leave request approved', data: this.mapLeave(updatedLeave) };
  }

  async reject(id: string, userId: string, dto: RejectLeaveDto) {
    const { rejectionReason } = dto;
    if (!rejectionReason) {
      throw new BadRequestException('Please provide rejection reason');
    }

    const leave = await this.prisma.leave.findFirst({
      where: { id, userId },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    const updatedLeave = await this.prisma.leave.update({
      where: { id },
      data: {
        status: 'Rejected',
        approvedBy: userId,
        approvedDate: new Date(),
        rejectionReason,
      },
    });

    await this.queueService.queueNotification(
      userId,
      'LEAVE_REJECTED',
      `Leave request for ${leave.employeeName} (${leave.leaveType}) has been rejected. Reason: ${rejectionReason}`,
    );

    return { success: true, message: 'Leave request rejected', data: this.mapLeave(updatedLeave) };
  }

  async stats(userId: string) {
    const pendingLeaves = await this.prisma.leave.count({ where: { userId, status: 'Pending' } });
    const approvedLeaves = await this.prisma.leave.count({ where: { userId, status: 'Approved' } });
    const rejectedLeaves = await this.prisma.leave.count({ where: { userId, status: 'Rejected' } });

    const leavesList = await this.prisma.leave.findMany({
      where: { userId, status: 'Approved' },
    });

    const utilization: Record<string, number> = {
      Casual: 0,
      Sick: 0,
      Paid: 0,
      Unpaid: 0,
      Maternity: 0,
      Paternity: 0,
    };

    leavesList.forEach((l) => {
      if (utilization[l.leaveType] !== undefined) {
        utilization[l.leaveType] += l.totalDays;
      }
    });

    return {
      success: true,
      data: {
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        utilization,
      },
    };
  }

  private mapLeave(leave: any) {
    if (!leave) return leave;
    return {
      ...leave,
      attachments: leave.attachments ? leave.attachments.split(',') : [],
    };
  }
}
