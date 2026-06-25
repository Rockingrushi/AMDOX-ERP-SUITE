export class MarkAttendanceDto {
  employeeId!: string;
  date!: string;
  status!: string;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}

export class UpdateAttendanceDto {
  status!: string;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}
