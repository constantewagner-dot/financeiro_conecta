import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfessoresService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.professor.findMany({ include: { turmas: true } }); }
  findOne(id: string) { return this.prisma.professor.findUnique({ where: { id }, include: { turmas: true } }); }
  create(data: any) { return this.prisma.professor.create({ data }); }
  update(id: string, data: any) { return this.prisma.professor.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.professor.delete({ where: { id } }); }
}
