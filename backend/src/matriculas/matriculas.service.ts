import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatriculasService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.matricula.findMany({ include: { aluno: true, turma: true } }); }
  findOne(id: string) { return this.prisma.matricula.findUnique({ where: { id }, include: { aluno: true, turma: true } }); }
  create(data: any) { return this.prisma.matricula.create({ data }); }
  update(id: string, data: any) { return this.prisma.matricula.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.matricula.delete({ where: { id } }); }
}
