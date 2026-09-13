import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlunosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.aluno.findMany({ include: { responsavel: true } });
  }

  findOne(id: string) {
    return this.prisma.aluno.findUnique({ where: { id }, include: { responsavel: true, matriculas: true } });
  }

  create(data: any) {
    return this.prisma.aluno.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.aluno.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.aluno.delete({ where: { id } });
  }
}
