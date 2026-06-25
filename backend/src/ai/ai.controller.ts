import { Controller, Get } from '@nestjs/common';
import { AiService } from './ai.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('insights')
  async getInsights(@CurrentUser() user: Omit<User, 'password'>) {
    return this.aiService.getInsights(user.id);
  }
}
