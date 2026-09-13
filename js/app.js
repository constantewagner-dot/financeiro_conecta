// app.js — lógica e navegação das abas

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
    this.renderConfig();
  },

  // --- DASHBOARD ---
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

    const pendentes = receber.filter(r => r.status === 'pendente');
    const atrasados = receber.filter(r => r.status === 'atrasado' || (r.status === 'pendente' && r.vencimento < hoje));
    const totalReceber = pendentes.reduce((s, r) => s + r.valor, 0);
    const totalPagar = pagar.filter(p => p.status !== 'pago').reduce((s, p) => s + p.valor, 0);

    const sec = document.getElementById('tab-dashboard');
    sec.innerHTML = `
      <div class="resumo">
        <div class="item"><strong>R$ ${numero(totalReceber)}</strong><span>Total a receber</span></div>
        <div class="item"><strong>R$ ${numero(totalPagar)}</strong><span>Total a pagar</span></div>
        <div class="item"><strong>${atrasados.length}</strong><span>Cobranças atrasadas</span></div>
        <div class="item"><strong>${contratosProximos.length}</strong><span>Contratos próximos do fim</span></div>
      </div>
      <div class="card">
        <h2>Contratos próximos do encerramento</h2>
        ${contratosProximos.length === 0 ? '<p style="color:#777;">Nenhum contrato próximo do fim.</p>' : `
          <table>
            <thead><tr><th>Aluno</th><th>Tipo</th><th>Término</th><th>Dias restantes</th></tr></thead>
            <tbody>
              ${contratosProximos.map(m => {
                const aluno = alunos.find(a => a.id === m.alunoId) || { nome: '—' };
                return `<tr>
                  <td>${aluno.nome}</td>
                  <td>${m.tipo}</td>
                  <td>${formatDate(m.termino)}</td>
                  <td>${diasAte(m.termino)} dias</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;
  },

  // --- CONTAS A PAGAR ---
  renderPagar() {
    const sec = document.getElementById('tab-pagar');
    sec.innerHTML = `
      <div class="card">
        <h2>Contas a Pagar</h2>
        <p>(será implementado na Etapa 3)</p>
      </div>
    `;
  },

  // --- CONTAS A RECEBER ---
  renderReceber() {
    const sec = document.getElementById('tab-receber');
    sec.innerHTML = `
      <div class="card">
        <h2>Contas a Receber</h2>
        <p>(será implementado na Etapa 3)</p>
      </div>
    `;
  },

  // --- MATRÍCULAS ---
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
      ? '<p style="color:#777;">Nenhuma matrícula cadastrada ainda.</p>'
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
    if (!nome) { this.setStatus('Informe o nome do aluno.', 'warn'); return; }
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
      this.setStatus('Informe valor mensal ou valor de material.', 'warn'); return;
    }

    const matriculas = DB.get('matriculas.json');
    const receber = DB.get('receber.json');
    matriculas.push(mt);

    // Gera cobranças de mensalidade
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

    // Gera cobranças de material
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

  // --- RELATÓRIOS ---
  renderRelatorios() {
    const sec = document.getElementById('tab-relatorios');
    sec.innerHTML = `
      <div class="card">
        <h2>Relatórios</h2>
        <p>(será implementado na Etapa 3)</p>
      </div>
    `;
  },

  // --- CONFIGURAÇÕES ---
  renderConfig() {
    const cfg = GH.getConfig();
    const sec = document.getElementById('tab-config');
    sec.innerHTML = `
      <div class="card">
        <h2>Configurações do GitHub</h2>
        <div class="form-row">
          <label>Owner <input id="cfg-owner" value="${cfg.owner}" /></label>
          <label>Repositório <input id="cfg-repo" value="${cfg.repo}" /></label>
          <label>Branch <input id="cfg-branch" value="${cfg.branch}" /></label>
        </div>
        <div class="form-row">
          <label>Token de acesso pessoal (PAT) — salvo apenas no seu navegador
            <input id="cfg-token" type="password" value="${cfg.token}" placeholder="ghp_..." />
          </label>
        </div>
        <button class="primary" id="btn-save-gh">Salvar e testar conexão</button>
        <div id="gh-result" style="margin-top:12px;"></div>
      </div>

      <div class="card">
        <h2>Categorias</h2>
        <p>(edição de categorias e tipos de contrato será implementada na Etapa 3)</p>
      </div>

      <div class="card">
        <h2>Backup e Restore</h2>
        <p>(será implementado na Etapa 3)</p>
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
  }
};

// --- FUNÇÕES UTILITÁRIAS ---

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function numero(v) {
  return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

document.addEventListener('DOMContentLoaded', () => App.init());
