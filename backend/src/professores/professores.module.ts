import { Module } from '@nestjs/common';
import { ProfessoresController } from './professores.controller';
import { ProfessoresService } from './professores.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ProfessoresController],
  providers: [ProfessoresService, PrismaService],
})
export class ProfessoresModule {}
