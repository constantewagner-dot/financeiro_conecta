import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly service: FinanceiroService) {}

  @Get('contas-receber')
  findContasReceber() { return this.service.findContasReceber(); }

  @Get('contas-pagar')
  findContasPagar() { return this.service.findContasPagar(); }

  @Post('contas-receber')
  createContaReceber(@Body() data: any) { return this.service.createContaReceber(data); }

  @Post('contas-pagar')
  createContaPagar(@Body() data: any) { return this.service.createContaPagar(data); }

  @Put('contas-receber/:id/pagar')
  pagarContaReceber(@Param('id') id: string) { return this.service.pagarContaReceber(id); }

  @Put('contas-pagar/:id/pagar')
  pagarContaPagar(@Param('id') id: string) { return this.service.pagarContaPagar(id); }

  @Delete('contas-receber/:id')
  removeContaReceber(@Param('id') id: string) { return this.service.removeContaReceber(id); }

  @Delete('contas-pagar/:id')
  removeContaPagar(@Param('id') id: string) { return this.service.removeContaPagar(id); }
}
