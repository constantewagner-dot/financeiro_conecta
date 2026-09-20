# Financeiro Conecta

Sistema de gestão financeira e de matrículas para escola.

## Configuração inicial

1. Acesse o site publicado em https://constantewagner-dot.github.io/financeiro_conecta/
2. Na aba **Configurações**, informe:
   - **Owner**: `constantewagner-dot`
   - **Repositório**: `financeiro_conecta`
   - **Branch**: `main`
   - **Token**: um Personal Access Token do GitHub com permissão `Contents: Read and write` no repositório.
3. Clique em **Salvar e testar conexão**.

O token fica salvo apenas no seu navegador (localStorage). Os dados são armazenados como arquivos JSON no repositório GitHub (cada salvamento gera um commit = histórico automático).

## Funcionalidades da Etapa 2

- Cadastro de alunos
- Cadastro de matrículas com:
  - Tipo de contrato (Mensal, Semestral, Anual, Por módulo)
  - Período de início e término
  - Valor mensal, desconto e bolsa
  - Parcelas da mensalidade
  - Taxa de material parcelada
- Geração automática de contas a receber (mensalidade + material)
- Dashboard com alerta de contratos próximos do fim

## Estrutura

- `index.html` — página única com as 6 abas
- `css/style.css`
- `js/github.js` — camada de leitura/escrita no GitHub
- `js/app.js` — lógica e navegação
