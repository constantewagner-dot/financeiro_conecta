import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AlunosModule } from './alunos/alunos.module';
import { ResponsaveisModule } from './responsaveis/responsaveis.module';
import { ProfessoresModule } from './professores/professores.module';
import { TurmasModule } from './turmas/turmas.module';
import { MatriculasModule } from './matriculas/matriculas.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { CategoriasModule } from './categorias/categorias.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    AlunosModule,
    ResponsaveisModule,
    ProfessoresModule,
    TurmasModule,
    MatriculasModule,
    FinanceiroModule,
    CategoriasModule,
    DashboardModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
