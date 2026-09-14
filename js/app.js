// ============================================================
// app.js — VERSÃO COMPLETA (Etapa 3)
// Financeiro Conecta
// ============================================================

const App = {
  async init() {
    this.bindTabs();
    this.renderConfig();

    if (!GH.isConfigured()) {
      this.switchTab('config');
      this.setStatus('Configure o acesso ao GitHub em Configurações.', 'warn');
      return;
    }

    try {
      this.setStatus('Carregando dados...');
      await DB.loadAll();
      this.setStatus('Conectado ao GitHub ✓');
      this.renderAll();
    } catch (e) {
      this.setStatus('Erro: ' + e.message, 'error');
      this.switchTab('config');
    }
  },

  bindTabs() {
    document.querySelectorAll('#tabs button').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
  },

  switchTab(name) {
    document.querySelectorAll('#tabs button').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === name);
    });
    document.querySelectorAll('.tab').forEach(sec => {
      sec.classList.toggle('hidden', sec.id !== `tab-${name}`);
    });
  },

  setStatus(msg, type = 'info') {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.style.color = type === 'error' ? '#991b1b' : type === 'warn' ? '#92400e' : '#555';
  },

  renderAll() {
    this.renderDashboard();
    this.renderPagar();
    this.renderReceber();
    this.renderMatriculas();
    this.renderRelatorios();
    this.renderConfig(true);
  },

  // ==================== DASHBOARD ====================
  renderDashboard() {
    const hoje = hojeISO();
    const matriculas = DB.get('matriculas.json');
    const alunos = DB.get('alunos.json');
    const receber = DB.get('receber.json');
    const pagar = DB.get('pagar.json');

    const contratosProximos = matriculas.filter(m => {
      if (!m.termino) return false;
      const dias = diasAte(m.termino);
      return dias >= 0 && dias <= 30;
    });

    const hojeAnoMes = hoje.slice(0, 7);
    const aReceberMes = receber.filter(r => r.vencimento.slice(0, 7) === hojeAnoMes).reduce((s, r) => s + r.valor, 0);
    const aPagarMes = pagar.filter(p => p.vencimento.slice(0, 7) === hojeAnoMes).reduce((s, p) => s + p.valor, 0);

    const atrasados = receber.filter(r => r.status !== 'pago' && r.vencimento < hoje);
    const pagarAtrasado = pagar.filter(p => p.status !== 'pago' && p.vencimento < hoje);
    const totalAtrasadoReceber = atrasados.reduce((s, r) => s + r.valor, 0);
    const totalAtrasadoPagar = pagarAtrasado.reduce((s, p) => s + p.valor, 0);

    const ativos = matriculas.filter(m => m.termino >= hoje).length;

    const sec = document.getElementById('tab-dashboard');
    sec.innerHTML = `
      <div class="resumo">
        <div class="item"><strong>${alunos.length}</strong><span>Alunos cadastrados</span></div>
        <div class="item"><strong>${ativos}</strong><span>Matrículas ativas</span></div>
        <div class="item"><strong>R$ ${numero(aReceberMes)}</strong><span>A receber no mês</span></div>
        <div class="item"><strong>R$ ${numero(aPagarMes)}</strong><span>A pagar no mês</span></div>
        <div class="item"><strong>R$ ${numero(totalAtrasadoReceber)}</strong><span>Atrasado (a receber)</span></div>
        <div class="item"><strong>R$ ${numero(totalAtrasadoPagar)}</strong><span>Atrasado (a pagar)</span></div>
      </div>

      <div class="card">
        <h2>Contratos próximos do encerramento (30 dias)</h2>
        ${contratosProximos.length === 0 ? '<p style="color:#777;">Nenhum contrato próximo do fim.</p>' : `
          <table>
            <thead><tr><th>Aluno</th><th>Tipo</th><th>Término</th><th>Dias</th></tr></thead>
            <tbody>
              ${contratosProximos.map(m => {
                const aluno = alunos.find(a => a.id === m.alunoId) || { nome: '—' };
                return `<tr><td>${aluno.nome}</td><td>${m.tipo}</td><td>${formatDate(m.termino)}</td><td>${diasAte(m.termino)}</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;
  },

  // ==================== CONTAS A PAGAR ====================
  renderPagar() {
    const sec = document.getElementById('tab-pagar');
    const pagar = DB.get('pagar.json');
    const categorias = DB.get('categorias.json').despesas || [];

    const form = `
      <div class="card">
        <h2><span id="pagar-titulo">Nova</span> Conta a Pagar</h2>
        <input type="hidden" id="pagar-id" />
        <div class="form-row">
          <label>Descrição <input id="pagar-desc" placeholder="Ex: Aluguel de julho" /></label>
          <label>Categoria
            <select id="pagar-cat">${categorias.map(c => `<option>${c}</option>`).join('')}</select>
          </label>
        </div>
        <div class="form-row">
          <label>Valor (R$) <input type="number" id="pagar-valor" step="0.01" min="0" /></label>
          <label>Vencimento <input type="date" id="pagar-venc" /></label>
        </div>
        <button class="primary" id="btn-salvar-pagar">Salvar conta</button>
        <button class="secondary" id="btn-cancelar-pagar" style="display:none;">Cancelar edição</button>
      </div>
    `;

    const lista = pagar.length === 0
      ? '<p style="color:#777;">Nenhuma conta a pagar.</p>'
      : `<table>
           <thead><tr><th>Descrição</th><th>Categoria</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
           <tbody>
             ${pagar.map(p => `<tr>
               <td>${p.descricao}</td>
               <td>${p.categoria || '—'}</td>
               <td>${formatDate(p.vencimento)}</td>
               <td>R$ ${numero(p.valor)}</td>
               <td>${statusBadge(p.status)}</td>
               <td class="acoes">
                 ${p.status !== 'pago' ? `<button class="secondary" onclick="App.pagarConta('${p.id}')">Pagar</button>` : ''}
                 <button class="secondary" onclick="App.editarPagar('${p.id}')">Editar</button>
                 <button class="secondary" onclick="App.excluirPagar('${p.id}')">Excluir</button>
               </td>
             </tr>`).join('')}
           </tbody>
         </table>`;

    sec.innerHTML = form + `<div class="card"><h2>Contas a Pagar</h2>${lista}</div>`;

    document.getElementById('btn-salvar-pagar').addEventListener('click', () => this.salvarPagar());
    document.getElementById('btn-cancelar-pagar').addEventListener('click', () => {
      preencherFormPagar({});
    });
  },

  async salvarPagar() {
    const id = document.getElementById('pagar-id').value;
    const descricao = document.getElementById('pagar-desc').value.trim();
    const categoria = document.getElementById('pagar-cat').value;
    const valor = parseFloat(document.getElementById('pagar-valor').value);
    const vencimento = document.getElementById('pagar-venc').value;

    if (!descricao || !valor || !vencimento) { this.setStatus('Preencha descrição, valor e vencimento.', 'warn'); return; }

    const pagar = DB.get('pagar.json');
    if (id) {
      const i = pagar.findIndex(p => p.id === id);
      pagar[i].descricao = descricao;
      pagar[i].categoria = categoria;
      pagar[i].valor = valor;
      pagar[i].vencimento = vencimento;
    } else {
      pagar.push({ id: 'pg' + Date.now(), descricao, categoria, valor, vencimento, status: 'pendente' });
    }
    try {
      await DB.set('pagar.json', pagar, id ? 'Edita conta a pagar' : 'Nova conta a pagar');
      this.setStatus(id ? 'Conta editada ✓' : 'Conta salva ✓');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  editarPagar(id) {
    const p = DB.get('pagar.json').find(x => x.id === id);
    if (!p) return;
    document.getElementById('pagar-id').value = p.id;
    document.getElementById('pagar-desc').value = p.descricao;
    document.getElementById('pagar-cat').value = p.categoria || '';
    document.getElementById('pagar-valor').value = p.valor;
    document.getElementById('pagar-venc').value = p.vencimento;
    document.getElementById('pagar-titulo').textContent = 'Editar';
    document.getElementById('btn-cancelar-pagar').style.display = 'inline-block';
    document.getElementById('btn-salvar-pagar').scrollIntoView({ behavior: 'smooth' });
  },

  async pagarConta(id) {
    const pagar = DB.get('pagar.json');
    const p = pagar.find(x => x.id === id);
    if (!p) return;
    p.status = 'pago';
    p.dataPagamento = hojeISO();
    try {
      await DB.set('pagar.json', pagar, 'Baixa conta a pagar');
      this.setStatus('Conta marcada como paga ✓');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  async excluirPagar(id) {
    if (!confirm('Excluir esta conta a pagar?')) return;
    const pagar = DB.get('pagar.json').filter(p => p.id !== id);
    try {
      await DB.set('pagar.json', pagar, 'Exclui conta a pagar');
      this.setStatus('Conta excluída.');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  // ==================== CONTAS A RECEBER ====================
  renderReceber() {
    const sec = document.getElementById('tab-receber');
    const receber = DB.get('receber.json');
    const alunos = DB.get('alunos.json');

    const ordenado = receber
      .slice()
      .sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1));

    const lista = ordenado.length === 0
      ? '<p style="color:#777;">Nenhuma cobrança gerada. Crie uma matrícula para gerar mensalidades.</p>'
      : `<table>
           <thead><tr><th>Aluno</th><th>Tipo</th><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
           <tbody>
             ${ordenado.map(r => {
               const aluno = alunos.find(a => a.id === r.alunoId) || { nome: '—' };
               return `<tr>
                 <td>${aluno.nome}</td>
                 <td>${r.tipo === 'material' ? 'Material' : 'Mensalidade'}</td>
                 <td>${r.parcela}ª</td>
                 <td>${formatDate(r.vencimento)}</td>
                 <td>R$ ${numero(r.valor)}</td>
                 <td>${statusBadge(r.status)}</td>
                 <td class="acoes">
                   ${r.status !== 'pago' ? `<button class="secondary" onclick="App.receber('${r.id}')">Receber</button>` : ''}
                   ${r.status === 'pago' ? `<button class="secondary" onclick="App.reverter('${r.id}')">Reverter</button>` : ''}
                 </td>
               </tr>`;
             }).join('')}
           </tbody>
         </table>`;

    const totalPendente = receber.filter(r => r.status !== 'pago').reduce((s, r) => s + r.valor, 0);
    const totalPago = receber.filter(r => r.status === 'pago').reduce((s, r) => s + r.valor, 0);

    sec.innerHTML = `
      <div class="resumo">
        <div class="item"><strong>R$ ${numero(totalPendente)}</strong><span>Total pendente</span></div>
        <div class="item"><strong>R$ ${numero(totalPago)}</strong><span>Total recebido</span></div>
      </div>
      <div class="card"><h2>Contas a Receber</h2>${lista}</div>
    `;
  },

  async receber(id) {
    const receber = DB.get('receber.json');
    const r = receber.find(x => x.id === id);
    if (!r) return;
    r.status = 'pago';
    r.dataRecebimento = hojeISO();
    try {
      await DB.set('receber.json', receber, 'Baixa conta a receber');
      this.setStatus('Pagamento registrado ✓');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  async reverter(id) {
    const receber = DB.get('receber.json');
    const r = receber.find(x => x.id === id);
    if (!r) return;
    r.status = 'pendente';
    delete r.dataRecebimento;
    try {
      await DB.set('receber.json', receber, 'Reverte baixa');
      this.setStatus('Baixa revertida.');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  // ==================== MATRÍCULAS ====================
  renderMatriculas() {
    const matriculas = DB.get('matriculas.json');
    const alunos = DB.get('alunos.json');
    const config = DB.get('config.json');
    const tipos = config.tiposContrato || ['Mensal', 'Semestral', 'Anual', 'Por módulo'];
    const sec = document.getElementById('tab-matriculas');

    const alunoForm = `
      <div class="card">
        <h2>Novo Aluno</h2>
        <div class="form-row">
          <label>Nome <input id="al-nome" placeholder="Nome completo" /></label>
          <label>Telefone <input id="al-fone" placeholder="(16) 99999-9999" /></label>
          <label>E-mail <input id="al-email" placeholder="email@exemplo.com" /></label>
        </div>
        <button class="primary" id="btn-salvar-aluno">Salvar aluno</button>
      </div>
    `;

    const alunosOptions = alunos
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map(a => `<option value="${a.id}">${a.nome}</option>`)
      .join('');

    const matriculaForm = `
      <div class="card">
        <h2>Nova Matrícula</h2>
        <div class="form-row">
          <label>Aluno
            <select id="mt-aluno"><option value="">Selecione...</option>${alunosOptions}</select>
          </label>
          <label>Tipo de contrato
            <select id="mt-tipo">${tipos.map(t => `<option>${t}</option>`).join('')}</select>
          </label>
        </div>
        <div class="form-row">
          <label>Data início <input type="date" id="mt-inicio" /></label>
          <label>Data término <input type="date" id="mt-termino" /></label>
          <label>Dia de vencimento <input type="number" id="mt-dia" min="1" max="28" value="10" /></label>
        </div>
        <div class="form-row">
          <label>Valor mensal (R$) <input type="number" id="mt-valor" step="0.01" min="0" /></label>
          <label>Desconto (%) <input type="number" id="mt-desconto" step="0.01" min="0" value="0" /></label>
          <label>Bolsa (%) <input type="number" id="mt-bolsa" step="0.01" min="0" value="0" /></label>
        </div>
        <div class="form-row">
          <label>Parcelas da mensalidade <input type="number" id="mt-parcelas" min="1" value="12" /></label>
        </div>
        <hr />
        <h3>Taxa de material</h3>
        <div class="form-row">
          <label>Valor total do material (R$) <input type="number" id="mt-mat-valor" step="0.01" min="0" value="0" /></label>
          <label>Parcelas do material <input type="number" id="mt-mat-parcelas" min="1" value="1" /></label>
        </div>
        <button class="primary" id="btn-salvar-matricula" style="margin-top:8px;">Salvar matrícula e gerar cobranças</button>
      </div>
    `;

    const lista = matriculas.length === 0
      ? '<p style="color:#777;">Nenhuma matrícula cadastrada.</p>'
      : `<table>
           <thead><tr><th>Aluno</th><th>Tipo</th><th>Início</th><th>Término</th><th>Valor mensal</th><th>Parcelas</th><th>Material</th><th>Ações</th></tr></thead>
           <tbody>
             ${matriculas.map(m => {
               const aluno = alunos.find(a => a.id === m.alunoId) || { nome: '—' };
               return `<tr>
                 <td>${aluno.nome}</td>
                 <td>${m.tipo}</td>
                 <td>${formatDate(m.inicio)}</td>
                 <td>${formatDate(m.termino)}</td>
                 <td>R$ ${numero(m.valorMensal)}</td>
                 <td>${m.parcelasMensalidade}</td>
                 <td>${m.material?.valorTotal ? `R$ ${numero(m.material.valorTotal)} (${m.material.parcelas}x)` : '—'}</td>
                 <td class="acoes"><button class="primary" onclick="App.removerMatricula('${m.id}')">Excluir</button></td>
               </tr>`;
             }).join('')}
           </tbody>
         </table>`;

    sec.innerHTML = alunoForm + matriculaForm + `
      <div class="card">
        <h2>Matrículas cadastradas</h2>
        <div style="overflow-x:auto;">${lista}</div>
      </div>
    `;

    document.getElementById('btn-salvar-aluno').addEventListener('click', () => this.salvarAluno());
    document.getElementById('btn-salvar-matricula').addEventListener('click', () => this.salvarMatricula());
  },

  async salvarAluno() {
    const nome = document.getElementById('al-nome').value.trim();
    if (!nome) { this.setStatus('Informe o nome.', 'warn'); return; }
    const alunos = DB.get('alunos.json');
    alunos.push({
      id: 'a' + Date.now(),
      nome,
      telefone: document.getElementById('al-fone').value.trim(),
      email: document.getElementById('al-email').value.trim()
    });
    try {
      await DB.set('alunos.json', alunos, 'Adiciona aluno ' + nome);
      this.setStatus('Aluno salvo ✓');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  async salvarMatricula() {
    const alunoId = document.getElementById('mt-aluno').value;
    if (!alunoId) { this.setStatus('Selecione um aluno.', 'warn'); return; }

    const mt = {
      id: 'm' + Date.now(),
      alunoId,
      tipo: document.getElementById('mt-tipo').value,
      inicio: document.getElementById('mt-inicio').value,
      termino: document.getElementById('mt-termino').value,
      valorMensal: parseFloat(document.getElementById('mt-valor').value) || 0,
      desconto: parseFloat(document.getElementById('mt-desconto').value) || 0,
      bolsa: parseFloat(document.getElementById('mt-bolsa').value) || 0,
      parcelasMensalidade: parseInt(document.getElementById('mt-parcelas').value) || 1,
      diaVencimento: parseInt(document.getElementById('mt-dia').value) || 10,
      material: {
        valorTotal: parseFloat(document.getElementById('mt-mat-valor').value) || 0,
        parcelas: parseInt(document.getElementById('mt-mat-parcelas').value) || 1
      }
    };

    if (!mt.inicio || !mt.termino) { this.setStatus('Informe início e término.', 'warn'); return; }
    if (mt.valorMensal <= 0 && mt.material.valorTotal <= 0) {
      this.setStatus('Informe valor mensal ou de material.', 'warn'); return;
    }

    const matriculas = DB.get('matriculas.json');
    const receber = DB.get('receber.json');
    matriculas.push(mt);

    const valorComDesc = aplicarDescontos(mt.valorMensal, mt.desconto, mt.bolsa);
    for (let p = 1; p <= mt.parcelasMensalidade; p++) {
      receber.push({
        id: 'r' + Date.now() + p,
        matriculaId: mt.id,
        alunoId,
        tipo: 'mensalidade',
        parcela: p,
        vencimento: proximoVencimento(mt.inicio, mt.diaVencimento, p - 1),
        valor: valorComDesc,
        status: 'pendente'
      });
    }

    if (mt.material.valorTotal > 0) {
      const valorMaterial = mt.material.valorTotal / mt.material.parcelas;
      for (let p = 1; p <= mt.material.parcelas; p++) {
        receber.push({
          id: 'r' + Date.now() + 'm' + p,
          matriculaId: mt.id,
          alunoId,
          tipo: 'material',
          parcela: p,
          vencimento: proximoVencimento(mt.inicio, mt.diaVencimento, p - 1),
          valor: Math.round(valorMaterial * 100) / 100,
          status: 'pendente'
        });
      }
    }

    try {
      await DB.set('matriculas.json', matriculas, 'Nova matrícula');
      await DB.set('receber.json', receber, 'Gera cobranças da matrícula');
      this.setStatus('Matrícula salva e cobranças geradas ✓');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  async removerMatricula(id) {
    if (!confirm('Remover matrícula e todas as suas cobranças?')) return;
    const matriculas = DB.get('matriculas.json').filter(m => m.id !== id);
    const receber = DB.get('receber.json').filter(r => r.matriculaId !== id);
    try {
      await DB.set('matriculas.json', matriculas, 'Remove matrícula');
      await DB.set('receber.json', receber, 'Remove cobranças da matrícula');
      this.setStatus('Matrícula removida.');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  // ==================== RELATÓRIOS ====================
  renderRelatorios() {
    const sec = document.getElementById('tab-relatorios');
    const anoAtual = new Date().getFullYear();

    const mesSelect = `
      <div class="form-row">
        <label>Mês
          <select id="rel-mes">
            ${Array.from({ length: 12 }, (_, i) => {
              const m = i + 1;
              return `<option value="${m}" ${m === new Date().getMonth() + 1 ? 'selected' : ''}>${meses[m - 1]}</option>`;
            }).join('')}
          </select>
        </label>
        <label>Ano <input type="number" id="rel-ano" value="${anoAtual}" /></label>
        <button class="primary" id="btn-gerar-rel">Gerar relatório</button>
      </div>
    `;

    sec.innerHTML = `<div class="card"><h2>Relatórios</h2>${mesSelect}<div id="rel-resultado"></div></div>`;

    document.getElementById('btn-gerar-rel').addEventListener('click', () => this.gerarRelatorio());
    this.gerarRelatorio();
  },

  gerarRelatorio() {
    const mes = parseInt(document.getElementById('rel-mes').value);
    const ano = parseInt(document.getElementById('rel-ano').value);
    const chave = `${ano}-${String(mes).padStart(2, '0')}`;

    const receber = DB.get('receber.json');
    const pagar = DB.get('pagar.json');

    // FLUXO DE CAIXA
    const recebido = receber.filter(r => r.status === 'pago' && (r.dataRecebimento || r.vencimento).slice(0, 7) === chave);
    const totalRecebido = recebido.reduce((s, r) => s + r.valor, 0);
    const pago = pagar.filter(p => p.status === 'pago' && (p.dataPagamento || p.vencimento).slice(0, 7) === chave);
    const totalPago = pago.reduce((s, p) => s + p.valor, 0);
    const saldoMes = totalRecebido - totalPago;

    // INADIMPLÊNCIA (em aberto)
    const inadimplentes = receber.filter(r => r.status !== 'pago');
    const totalInadimplencia = inadimplentes.reduce((s, r) => s + r.valor, 0);

    // DRE (realizado no mês)
    const receitasTotais = receber.filter(r => r.status === 'pago' && (r.dataRecebimento || r.vencimento).slice(0, 7) === chave).reduce((s, r) => s + r.valor, 0);
    const despesasTotais = pagar.filter(p => p.status === 'pago' && (p.dataPagamento || p.vencimento).slice(0, 7) === chave).reduce((s, p) => s + p.valor, 0);
    const resultado = receitasTotais - despesasTotais;

    // Despesas por categoria
    const despesasPorCat = {};
    pagar.filter(p => p.vencimento.slice(0, 7) === chave).forEach(p => {
      const c = p.categoria || 'Outros';
      despesasPorCat[c] = (despesasPorCat[c] || 0) + p.valor;
    });

    // Receitas por tipo
    const receitasPorTipo = { mensalidade: 0, material: 0 };
    receber.forEach(r => {
      if (r.status === 'pago' && (r.dataRecebimento || r.vencimento).slice(0, 7) === chave) {
        receitasPorTipo[r.tipo] = (receitasPorTipo[r.tipo] || 0) + r.valor;
      }
    });

    const nomeMes = mes + '/' + ano;

    document.getElementById('rel-resultado').innerHTML = `
      <h3 style="margin:16px 0 8px;">Fluxo de Caixa — ${nomeMes}</h3>
      <table>
        <tr><td>Entradas (recebido)</td><td>R$ ${numero(totalRecebido)}</td></tr>
        <tr><td>Saídas (pago)</td><td>R$ ${numero(totalPago)}</td></tr>
        <tr><td><strong>Saldo do mês</strong></td><td><strong>R$ ${numero(saldoMes)}</strong></td></tr>
      </table>

      <h3 style="margin:16px 0 8px;">Inadimplência</h3>
      <table>
        <tr><td>Cobranças em aberto</td><td>${inadimplentes.length} parcela(s)</td></tr>
        <tr><td>Total em aberto</td><td>R$ ${numero(totalInadimplencia)}</td></tr>
      </table>

      <h3 style="margin:16px 0 8px;">DRE — ${nomeMes}</h3>
      <table>
        <tr><td>Receitas (mensalidade)</td><td>R$ ${numero(receitasPorTipo.mensalidade || 0)}</td></tr>
        <tr><td>Receitas (material)</td><td>R$ ${numero(receitasPorTipo.material || 0)}</td></tr>
        <tr><td><strong>Total de receitas</strong></td><td><strong>R$ ${numero(receitasTotais)}</strong></td></tr>
        <tr><td colspan="2"><hr /></td></tr>
        ${Object.entries(despesasPorCat).map(([cat, v]) => `<tr><td>Despesa: ${cat}</td><td>R$ ${numero(v)}</td></tr>`).join('')}
        <tr><td><strong>Total de despesas</strong></td><td><strong>R$ ${numero(despesasTotais)}</strong></td></tr>
        <tr><td colspan="2"><hr /></td></tr>
        <tr><td><strong>Resultado do período</strong></td><td><strong>R$ ${numero(resultado)}</strong></td></tr>
      </table>
    `;
  },

  // ==================== CONFIGURAÇÕES ====================
  renderConfig(jaRenderizado = false) {
    const cfg = GH.getConfig();
    const categorias = DB.get('categorias.json');
    const config = DB.get('config.json');

    // Se já foi renderizado antes, preserva os valores digitados
    const owner = jaRenderizado && document.getElementById('cfg-owner') ? document.getElementById('cfg-owner').value : cfg.owner;
    const repo = jaRenderizado && document.getElementById('cfg-repo') ? document.getElementById('cfg-repo').value : cfg.repo;
    const branch = jaRenderizado && document.getElementById('cfg-branch') ? document.getElementById('cfg-branch').value : cfg.branch;
    const token = jaRenderizado && document.getElementById('cfg-token') ? document.getElementById('cfg-token').value : cfg.token;

    const sec = document.getElementById('tab-config');
    sec.innerHTML = `
      <div class="card">
        <h2>Configurações do GitHub</h2>
        <div class="form-row">
          <label>Owner <input id="cfg-owner" value="${owner}" /></label>
          <label>Repositório <input id="cfg-repo" value="${repo}" /></label>
          <label>Branch <input id="cfg-branch" value="${branch}" /></label>
        </div>
        <div class="form-row">
          <label>Token (salvo no navegador)
            <input id="cfg-token" type="password" value="${token}" placeholder="ghp_..." />
          </label>
        </div>
        <button class="primary" id="btn-save-gh">Salvar e testar conexão</button>
        <div id="gh-result" style="margin-top:12px;"></div>
      </div>

      <div class="card">
        <h2>Categorias</h2>
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
          <div style="flex:1; min-width:280px;">
            <h3>Despesas</h3>
            <div id="cat-despesas">
              ${categorias.despesas.map(c => `
                <div style="display:flex; gap:8px; margin-bottom:6px; align-items:center;">
                  <input type="text" class="cat-desp" value="${c}" style="flex:1;" />
                  <button class="secondary" onclick="App.removerCategoria('despesa','${c}')">✕</button>
                </div>`).join('')}
            </div>
            <div style="display:flex; gap:8px; margin-top:8px;">
              <input type="text" id="nova-cat-despesa" placeholder="Nova despesa" style="flex:1;" />
              <button class="primary" onclick="App.adicionarCategoria('despesa')">+</button>
            </div>
          </div>
          <div style="flex:1; min-width:280px;">
            <h3>Receitas</h3>
            <div id="cat-receitas">
              ${categorias.receitas.map(c => `
                <div style="display:flex; gap:8px; margin-bottom:6px; align-items:center;">
                  <input type="text" class="cat-rec" value="${c}" style="flex:1;" />
                  <button class="secondary" onclick="App.removerCategoria('receita','${c}')">✕</button>
                </div>`).join('')}
            </div>
            <div style="display:flex; gap:8px; margin-top:8px;">
              <input type="text" id="nova-cat-receita" placeholder="Nova receita" style="flex:1;" />
              <button class="primary" onclick="App.adicionarCategoria('receita')">+</button>
            </div>
          </div>
        </div>
        <button class="primary" id="btn-salvar-categorias" style="margin-top:16px;">Salvar categorias</button>
      </div>

      <div class="card">
        <h2>Tipos de Contrato</h2>
        <div>
          ${config.tiposContrato.map(t => `
            <div style="display:flex; gap:8px; margin-bottom:6px; align-items:center;">
              <input type="text" class="tipo-contrato" value="${t}" style="flex:1;" />
              <button class="secondary" onclick="App.removerTipoContrato('${t}')">✕</button>
            </div>`).join('')}
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <input type="text" id="novo-tipo" placeholder="Novo tipo de contrato" style="flex:1;" />
          <button class="primary" onclick="App.adicionarTipoContrato()">+</button>
        </div>
        <button class="primary" id="btn-salvar-tipos" style="margin-top:16px;">Salvar tipos de contrato</button>
      </div>

      <div class="card">
        <h2>Backup e Restore</h2>
        <p style="margin-bottom:12px;">Os dados já são salvos automaticamente no GitHub a cada alteração. Aqui você pode exportar ou restaurar manualmente.</p>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button class="primary" id="btn-backup">⬇ Exportar backup (JSON)</button>
          <button class="secondary" id="btn-restore">⬆ Restaurar backup</button>
          <input type="file" id="arquivo-restore" accept=".json" style="display:none;" />
        </div>
        <div id="backup-result" style="margin-top:12px;"></div>
      </div>
    `;

    document.getElementById('btn-save-gh').addEventListener('click', async () => {
      const newCfg = {
        owner: document.getElementById('cfg-owner').value.trim(),
        repo: document.getElementById('cfg-repo').value.trim(),
        branch: document.getElementById('cfg-branch').value.trim() || 'main',
        token: document.getElementById('cfg-token').value.trim()
      };
      GH.setConfig(newCfg);
      const result = document.getElementById('gh-result');
      result.innerHTML = '<div class="alert info">Testando conexão...</div>';
      try {
        await GH.testConnection();
        result.innerHTML = '<div class="alert success">✓ Conexão OK. Recarregando dados...</div>';
        await DB.loadAll();
        this.setStatus('Conectado ao GitHub ✓');
        this.renderAll();
      } catch (e) {
        result.innerHTML = `<div class="alert error">Erro: ${e.message}</div>`;
        this.setStatus('Falha na conexão', 'error');
      }
    });

    document.getElementById('btn-salvar-categorias').addEventListener('click', () => this.salvarCategorias());
    document.getElementById('btn-salvar-tipos').addEventListener('click', () => this.salvarTiposContrato());
    document.getElementById('btn-backup').addEventListener('click', () => this.exportarBackup());
    document.getElementById('btn-restore').addEventListener('click', () => {
      document.getElementById('arquivo-restore').click();
    });
    document.getElementById('arquivo-restore').addEventListener('change', (e) => this.restaurarBackup(e));
  },

  // ---- Categorias ----
  adicionarCategoria(tipo) {
    const inputId = tipo === 'despesa' ? 'nova-cat-despesa' : 'nova-cat-receita';
    const nome = document.getElementById(inputId).value.trim();
    if (!nome) return;
    const categorias = DB.get('categorias.json');
    const lista = tipo === 'despesa' ? categorias.despesas : categorias.receitas;
    if (!lista.includes(nome)) lista.push(nome);
    DB._cache['categorias.json'] = { data: categorias, sha: DB._cache['categorias.json']?.sha };
    this.renderConfig(true);
  },

  removerCategoria(tipo, nome) {
    const categorias = DB.get('categorias.json');
    if (tipo === 'despesa') categorias.despesas = categorias.despesas.filter(c => c !== nome);
    else categorias.receitas = categorias.receitas.filter(c => c !== nome);
    DB._cache['categorias.json'] = { data: categorias, sha: DB._cache['categorias.json']?.sha };
    this.renderConfig(true);
  },

  async salvarCategorias() {
    const categorias = DB.get('categorias.json');
    document.querySelectorAll('.cat-desp').forEach((el, i) => {
      if (categorias.despesas[i]) categorias.despesas[i] = el.value.trim();
    });
    document.querySelectorAll('.cat-rec').forEach((el, i) => {
      if (categorias.receitas[i]) categorias.receitas[i] = el.value.trim();
    });
    try {
      await DB.set('categorias.json', categorias, 'Atualiza categorias');
      this.setStatus('Categorias salvas ✓');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  // ---- Tipos de contrato ----
  adicionarTipoContrato() {
    const nome = document.getElementById('novo-tipo').value.trim();
    if (!nome) return;
    const config = DB.get('config.json');
    if (!config.tiposContrato.includes(nome)) config.tiposContrato.push(nome);
    DB._cache['config.json'] = { data: config, sha: DB._cache['config.json']?.sha };
    this.renderConfig(true);
  },

  removerTipoContrato(nome) {
    const config = DB.get('config.json');
    config.tiposContrato = config.tiposContrato.filter(t => t !== nome);
    DB._cache['config.json'] = { data: config, sha: DB._cache['config.json']?.sha };
    this.renderConfig(true);
  },

  async salvarTiposContrato() {
    const config = DB.get('config.json');
    config.tiposContrato = [];
    document.querySelectorAll('.tipo-contrato').forEach(el => {
      const v = el.value.trim();
      if (v) config.tiposContrato.push(v);
    });
    try {
      await DB.set('config.json', config, 'Atualiza tipos de contrato');
      this.setStatus('Tipos de contrato salvos ✓');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  // ---- Backup e Restore ----
  exportarBackup() {
    const todos = {};
    DB._files.forEach(f => { todos[f] = DB.get(f); });
    const blob = new Blob([JSON.stringify(todos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financeiro_conecta_backup_' + hojeISO() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById('backup-result').innerHTML = '<div class="alert success">✓ Backup exportado.</div>';
  },

  async restaurarBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const result = document.getElementById('backup-result');
    const texto = await file.text();
    try {
      const dados = JSON.parse(texto);
      result.innerHTML = '<div class="alert info">Restaurando dados...</div>';
      for (const f of DB._files) {
        if (dados[f]) {
          await DB.set(f, dados[f], 'Restaura backup ' + f);
        }
      }
      await DB.loadAll();
      result.innerHTML = '<div class="alert success">✓ Backup restaurado com sucesso.</div>';
      this.setStatus('Backup restaurado ✓');
      this.renderAll(); // atualiza hidden input
      this.renderConfig(true);
    } catch (err) {
      result.innerHTML = `<div class="alert error">Erro ao ler backup: ${err.message}</div>`;
    }
    e.target.value = '';
  }
};

// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function numero(v) {
  return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadge(status) {
  const map = {
    pendente: '<span class="badge pendente">Pendente</span>',
    pago: '<span class="badge pago">Pago</span>',
    atrasado: '<span class="badge atrasado">Atrasado</span>'
  };
  return map[status] || status;
}

function hojeISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}

function diasAte(iso) {
  const hoje = new Date(hojeISO() + 'T00:00:00');
  const alvo = new Date(iso + 'T00:00:00');
  const diff = alvo.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function proximoVencimento(dataInicio, dia, mesOffset) {
  const d = new Date(dataInicio + 'T00:00:00');
  d.setDate(dia);
  d.setMonth(d.getMonth() + mesOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function aplicarDescontos(valor, descontoPct, bolsaPct) {
  let v = valor;
  if (descontoPct) v -= v * (descontoPct / 100);
  if (bolsaPct) v -= v * (bolsaPct / 100);
  return Math.round(v * 100) / 100;
}

function preencherFormPagar(p) {
  document.getElementById('pagar-id').value = p.id || '';
  document.getElementById('pagar-desc').value = p.descricao || '';
  document.getElementById('pagar-cat').value = p.categoria || '';
  document.getElementById('pagar-valor').value = p.valor || '';
  document.getElementById('pagar-venc').value = p.vencimento || '';
  document.getElementById('pagar-titulo').textContent = p.id ? 'Editar' : 'Nova';
  document.getElementById('btn-cancelar-pagar').style.display = p.id ? 'inline-block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => App.init());
