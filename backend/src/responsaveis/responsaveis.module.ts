import { Module } from '@nestjs/common';
import { ResponsaveisController } from './responsaveis.controller';
import { ResponsaveisService } from './responsaveis.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ResponsaveisController],
  providers: [ResponsaveisService, PrismaService],
})
export class ResponsaveisModule {}
