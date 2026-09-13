import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResponsaveisService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.responsavel.findMany({ include: { alunos: true } }); }
  findOne(id: string) { return this.prisma.responsavel.findUnique({ where: { id }, include: { alunos: true } }); }
  create(data: any) { return this.prisma.responsavel.create({ data }); }
  update(id: string, data: any) { return this.prisma.responsavel.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.responsavel.delete({ where: { id } }); }
}
