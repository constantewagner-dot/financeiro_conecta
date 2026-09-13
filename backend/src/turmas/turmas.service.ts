import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TurmasService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.turma.findMany({ include: { professor: true } }); }
  findOne(id: string) { return this.prisma.turma.findUnique({ where: { id }, include: { professor: true, matriculas: true } }); }
  create(data: any) { return this.prisma.turma.create({ data }); }
  update(id: string, data: any) { return this.prisma.turma.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.turma.delete({ where: { id } }); }
}
