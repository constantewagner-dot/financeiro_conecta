import { Module } from '@nestjs/common';
import { TurmasController } from './turmas.controller';
import { TurmasService } from './turmas.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TurmasController],
  providers: [TurmasService, PrismaService],
})
export class TurmasModule {}
