import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(private prisma: PrismaService) {}

  async log(userId: string, action: string, entity: string, entityId?: string, details?: string) {
    try {
      const logEntry = await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          details,
        },
      });
      this.logger.log(`[Telemetry Log] User ${userId} performed ${action} on ${entity} (${entityId || 'N/A'})`);
      return logEntry;
    } catch (err) {
      this.logger.error(`Failed to write telemetry log: ${err.message}`);
    }
  }

  async getLogs(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}
