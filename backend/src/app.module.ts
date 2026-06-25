import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeavesModule } from './leaves/leaves.module';
import { InventoryModule } from './inventory/inventory.module';
import { FinanceModule } from './finance/finance.module';
import { AiModule } from './ai/ai.module';
import { JwtGuard } from './auth/jwt.guard';
import { CacheModule } from './cache/cache.module';
import { QueueModule } from './queue/queue.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EmployeesModule,
    AttendanceModule,
    LeavesModule,
    InventoryModule,
    FinanceModule,
    AiModule,
    CacheModule,
    QueueModule,
    TelemetryModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
  ],
})
export class AppModule {}
