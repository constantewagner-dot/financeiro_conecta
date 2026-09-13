import { Module } from '@nestjs/common';
import { MatriculasController } from './matriculas.controller';
import { MatriculasService } from './matriculas.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MatriculasController],
  providers: [MatriculasService, PrismaService],
})
export class MatriculasModule {}
