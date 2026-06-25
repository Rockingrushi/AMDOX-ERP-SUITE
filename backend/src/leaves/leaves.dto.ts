export class CreateLeaveDto {
  employeeId!: string;
  leaveType!: string;
  startDate!: string;
  endDate!: string;
  reason!: string;
  attachments?: string[];
}

export class UpdateLeaveDto {
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  status?: string;
  attachments?: string[];
}

export class RejectLeaveDto {
  rejectionReason!: string;
}
