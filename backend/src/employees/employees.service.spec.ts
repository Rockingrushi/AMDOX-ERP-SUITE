import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../prisma/prisma.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockPrismaService = {
  employee: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  attendance: {
    deleteMany: vi.fn(),
  },
  leave: {
    deleteMany: vi.fn(),
  },
};

describe('EmployeesService', () => {
  let service: EmployeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    
    // Clear mocks
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all employees for a user', async () => {
      const mockEmployees = [
        { id: '1', name: 'John Doe', email: 'john@example.com', userId: 'user-1' },
      ];
      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);

      const result = await service.findAll('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmployees);
      expect(mockPrismaService.employee.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
