import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.categoria.findMany(); }
  create(data: any) { return this.prisma.categoria.create({ data }); }
  update(id: string, data: any) { return this.prisma.categoria.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.categoria.delete({ where: { id } }); }
}
