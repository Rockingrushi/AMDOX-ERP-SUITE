export class CreateEmployeeDto {
  name!: string;
  email!: string;
  phone!: string;
  department!: string;
  designation!: string;
  salary!: number;
  joiningDate!: string;
}

export class UpdateEmployeeDto {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  salary?: number;
  joiningDate?: string;
}
