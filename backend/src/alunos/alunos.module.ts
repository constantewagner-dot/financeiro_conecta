import { Module } from '@nestjs/common';
import { AlunosController } from './alunos.controller';
import { AlunosService } from './alunos.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AlunosController],
  providers: [AlunosService, PrismaService],
})
export class AlunosModule {}
