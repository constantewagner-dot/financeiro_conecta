import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceiroService {
  constructor(private prisma: PrismaService) {}

  findContasReceber() { return this.prisma.contaReceber.findMany({ include: { categoria: true } }); }
  findContasPagar() { return this.prisma.contaPagar.findMany({ include: { categoria: true } }); }

  createContaReceber(data: any) { return this.prisma.contaReceber.create({ data }); }
  createContaPagar(data: any) { return this.prisma.contaPagar.create({ data }); }

  pagarContaReceber(id: string) {
    return this.prisma.contaReceber.update({
      where: { id },
      data: { status: 'PAGO', dataPagamento: new Date() },
    });
  }

  pagarContaPagar(id: string) {
    return this.prisma.contaPagar.update({
      where: { id },
      data: { status: 'PAGO', dataPagamento: new Date() },
    });
  }

  removeContaReceber(id: string) { return this.prisma.contaReceber.delete({ where: { id } }); }
  removeContaPagar(id: string) { return this.prisma.contaPagar.delete({ where: { id } }); }
}
