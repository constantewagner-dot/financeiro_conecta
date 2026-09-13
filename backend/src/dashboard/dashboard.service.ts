import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [totalAlunos, totalProfessores, totalTurmas, contasReceber, contasPagar] = await Promise.all([
      this.prisma.aluno.count({ where: { ativo: true } }),
      this.prisma.professor.count({ where: { ativo: true } }),
      this.prisma.turma.count({ where: { ativa: true } }),
      this.prisma.contaReceber.findMany(),
      this.prisma.contaPagar.findMany(),
    ]);

    const receitas = contasReceber
      .filter((c) => c.status === 'PAGO')
      .reduce((acc, c) => acc + Number(c.valor), 0);

    const despesas = contasPagar
      .filter((c) => c.status === 'PAGO')
      .reduce((acc, c) => acc + Number(c.valor), 0);

    const inadimplencia = contasReceber
      .filter((c) => c.status === 'PENDENTE' && new Date(c.dataVencimento) < new Date())
      .reduce((acc, c) => acc + Number(c.valor), 0);

    return {
      totalAlunos,
      totalProfessores,
      totalTurmas,
      receitas,
      despesas,
      resultado: receitas - despesas,
      inadimplencia,
    };
  }
}
