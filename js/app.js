// ============================================================
// app.js — Financeiro Conecta (versão com aba Alunos e filtros)
// ============================================================

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PARENTESCOS = ['Pai','Mãe','Avô','Avó','Tio','Tia','Irmão','Irmã','Responsável legal','Outro'];
const STATUS_OPTIONS = [
  { v: '', t: 'Todos' },
  { v: 'pendente', t: 'Pendente' },
  { v: 'pago', t: 'Pago' },
  { v: 'atrasado', t: 'Atrasado' }
];

const App = {
  filtrosPagar: { descricao: '', categoria: '', mes: '', status: '' },
  filtrosReceber: { aluno: '', tipo: '', mes: '', status: '' },
  filtrosMatriculas: { aluno: '', responsavel: '', tipo: '' },

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
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tab').forEach(sec => sec.classList.toggle('hidden', sec.id !== `tab-${name}`));
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
    this.renderAlunos();
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

    const contratosProximos = matriculas.filter(m => m.termino && diasAte(m.termino) >= 0 && diasAte(m.termino) <= 30);
    const atrasados = receber.filter(r => statusEfetivo(r) === 'atrasado');
    const ativos = matriculas.filter(m => m.termino >= hoje).length;
    const totalAtrasadoReceber = atrasados.reduce((s, r) => s + r.valor, 0);

    const sec = document.getElementById('tab-dashboard');
    sec.innerHTML = `
      <div class="resumo">
        <div class="item"><strong>${alunos.length}</strong><span>Alunos</span></div>
        <div class="item"><strong>${ativos}</strong><span>Matrículas ativas</span></div>
        <div class="item"><strong>R$ ${numero(totalAtrasadoReceber)}</strong><span>Atrasado (a receber)</span></div>
        <div class="item"><strong>${contratosProximos.length}</strong><span>Contratos perto do fim</span></div>
      </div>
      <div class="card">
        <h2>Contratos próximos do encerramento (30 dias)</h2>
        ${contratosProximos.length === 0 ? '<p class="text-muted">Nenhum contrato próximo do fim.</p>' : `
          <table>
            <thead><tr><th>Aluno</th><th>Modalidade</th><th>Tipo</th><th>Término</th><th>Dias</th></tr></thead>
            <tbody>
              ${contratosProximos.map(m => {
                const aluno = alunos.find(a => a.id === m.alunoId) || { nome: '—' };
                return `<tr><td>${esc(aluno.nome)}</td><td>${esc(m.modalidade || '—')}</td><td>${esc(m.tipo)}</td><td>${formatDate(m.termino)}</td><td>${diasAte(m.termino)}</td></tr>`;
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
    const mesesFiltro = mesesDisponiveis(pagar);
    const f = this.filtrosPagar;

    sec.innerHTML = `
      <div class="card">
        <h2><span id="pagar-titulo">Nova</span> Conta a Pagar</h2>
        <input type="hidden" id="pagar-id" />
        <div class="form-row">
          <label>Descrição <input id="pagar-desc" placeholder="Ex: Aluguel de setembro" /></label>
          <label>Categoria
            <select id="pagar-cat">${categorias.map(c => `<option>${esc(c)}</option>`).join('')}</select>
          </label>
        </div>
        <div class="form-row">
          <label>Valor (R$) <input type="number" id="pagar-valor" step="0.01" min="0" /></label>
          <label>Vencimento <input type="date" id="pagar-venc" /></label>
          <label>Parcelas <input type="number" id="pagar-parcelas" min="1" value="1" /></label>
        </div>
        <button class="primary" id="btn-salvar-pagar">Salvar conta</button>
        <button class="secondary" id="btn-cancelar-pagar" style="display:none;">Cancelar edição</button>
      </div>

      <div class="card">
        <h2>Contas a Pagar</h2>
        <div class="filtros">
          <div class="campo">Descrição <input id="filtro-pagar-desc" value="${esc(f.descricao)}" placeholder="Buscar..." /></div>
          <div class="campo">Categoria
            <select id="filtro-pagar-cat">
              <option value="">Todas</option>
              ${categorias.map(c => `<option value="${esc(c)}" ${c === f.categoria ? 'selected' : ''}>${esc(c)}</option>`).join('')}
            </select>
          </div>
          <div class="campo">Mês
            <select id="filtro-pagar-mes">
              <option value="">Todos</option>
              ${mesesFiltro.map(m => `<option value="${m}" ${m === f.mes ? 'selected' : ''}>${formatMes(m)}</option>`).join('')}
            </select>
          </div>
          <div class="campo">Status
            <select id="filtro-pagar-status">
              ${STATUS_OPTIONS.map(o => `<option value="${o.v}" ${o.v === f.status ? 'selected' : ''}>${o.t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="pagar-lista"></div>
      </div>
    `;

    document.getElementById('btn-salvar-pagar').addEventListener('click', () => this.salvarPagar());
    document.getElementById('btn-cancelar-pagar').addEventListener('click', () => this.cancelarEdicaoPagar());

    document.getElementById('filtro-pagar-desc').addEventListener('input', e => { this.filtrosPagar.descricao = e.target.value; this.renderPagarLista(); });
    document.getElementById('filtro-pagar-cat').addEventListener('change', e => { this.filtrosPagar.categoria = e.target.value; this.renderPagarLista(); });
    document.getElementById('filtro-pagar-mes').addEventListener('change', e => { this.filtrosPagar.mes = e.target.value; this.renderPagarLista(); });
    document.getElementById('filtro-pagar-status').addEventListener('change', e => { this.filtrosPagar.status = e.target.value; this.renderPagarLista(); });

    this.renderPagarLista();
  },

  renderPagarLista() {
    const f = this.filtrosPagar;
    let lista = DB.get('pagar.json').slice().sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || ''));

    if (f.descricao) lista = lista.filter(p => (p.descricao || '').toLowerCase().includes(f.descricao.toLowerCase()));
    if (f.categoria) lista = lista.filter(p => p.categoria === f.categoria);
    if (f.mes) lista = lista.filter(p => (p.vencimento || '').slice(0, 7) === f.mes);
    if (f.status) lista = lista.filter(p => statusEfetivo(p) === f.status);

    const el = document.getElementById('pagar-lista');
    if (!el) return;

    if (lista.length === 0) { el.innerHTML = '<p class="text-muted">Nenhuma conta encontrada.</p>'; return; }

    const total = lista.reduce((s, p) => s + p.valor, 0);
    el.innerHTML = `
      <div class="resumo" style="margin-top:12px;">
        <div class="item"><strong>${lista.length}</strong><span>Contas</span></div>
        <div class="item"><strong>R$ ${numero(total)}</strong><span>Total</span></div>
      </div>
      <table>
        <thead><tr><th>Descrição</th><th>Categoria</th><th>Vencimento</th><th>Parcela</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>
          ${lista.map(p => `<tr>
            <td>${esc(p.descricao)}</td>
            <td>${esc(p.categoria || '—')}</td>
            <td>${formatDate(p.vencimento)}</td>
            <td>${p.totalParcelas > 1 ? `${p.parcela}/${p.totalParcelas}` : '—'}</td>
            <td>R$ ${numero(p.valor)}</td>
            <td>${statusBadge(statusEfetivo(p))}</td>
            <td class="acoes">
              ${statusEfetivo(p) !== 'pago' ? `<button class="secondary" onclick="App.pagarConta('${p.id}')">Pagar</button>` : ''}
              <button class="secondary" onclick="App.editarPagar('${p.id}')">Editar</button>
              <button class="secondary" onclick="App.excluirPagar('${p.id}')">Excluir</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    `;
  },

  async salvarPagar() {
    const id = document.getElementById('pagar-id').value;
    const descricao = document.getElementById('pagar-desc').value.trim();
    const categoria = document.getElementById('pagar-cat').value;
    const valor = parseFloat(document.getElementById('pagar-valor').value);
    const vencimento = document.getElementById('pagar-venc').value;
    const parcelas = parseInt(document.getElementById('pagar-parcelas').value) || 1;

    if (!descricao || !valor || !vencimento) { this.setStatus('Preencha descrição, valor e vencimento.', 'warn'); return; }

    const pagar = DB.get('pagar.json');

    try {
      if (id) {
        const i = pagar.findIndex(p => p.id === id);
        if (i === -1) return;
        pagar[i].descricao = descricao;
        pagar[i].categoria = categoria;
        pagar[i].valor = valor;
        pagar[i].vencimento = vencimento;
        await DB.set('pagar.json', pagar, 'Edita conta a pagar');
        this.setStatus('Conta editada ✓');
      } else {
        const grupoId = uid('g');
        for (let p = 0; p < parcelas; p++) {
          pagar.push({
            id: uid('pg'),
            grupoId,
            descricao,
            categoria,
            valor,
            vencimento: addMeses(vencimento, p),
            parcela: p + 1,
            totalParcelas: parcelas,
            status: 'pendente'
          });
        }
        await DB.set('pagar.json', pagar, 'Nova conta a pagar');
        this.setStatus(parcelas > 1 ? `${parcelas} parcelas salvas ✓` : 'Conta salva ✓');
      }
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
    const parcelasInput = document.getElementById('pagar-parcelas');
    parcelasInput.value = p.totalParcelas || 1;
    parcelasInput.disabled = true;
    document.getElementById('pagar-titulo').textContent = 'Editar';
    document.getElementById('btn-cancelar-pagar').style.display = 'inline-block';
    document.getElementById('btn-salvar-pagar').scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  cancelarEdicaoPagar() {
    document.getElementById('pagar-id').value = '';
    document.getElementById('pagar-desc').value = '';
    document.getElementById('pagar-cat').value = '';
    document.getElementById('pagar-valor').value = '';
    document.getElementById('pagar-venc').value = '';
    const parcelasInput = document.getElementById('pagar-parcelas');
    parcelasInput.value = 1;
    parcelasInput.disabled = false;
    document.getElementById('pagar-titulo').textContent = 'Nova';
    document.getElementById('btn-cancelar-pagar').style.display = 'none';
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
    const mesesFiltro = mesesDisponiveis(receber);
    const f = this.filtrosReceber;

    sec.innerHTML = `
      <div class="card">
        <h2>Contas a Receber</h2>
        <div class="filtros">
          <div class="campo">Aluno
            <select id="filtro-receber-aluno">
              <option value="">Todos</option>
              ${alunos.slice().sort((a,b)=>a.nome.localeCompare(b.nome)).map(a => `<option value="${a.id}" ${a.id === f.aluno ? 'selected' : ''}>${esc(a.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="campo">Tipo
            <select id="filtro-receber-tipo">
              <option value="">Todos</option>
              <option value="mensalidade" ${f.tipo === 'mensalidade' ? 'selected' : ''}>Mensalidade</option>
              <option value="material" ${f.tipo === 'material' ? 'selected' : ''}>Material</option>
            </select>
          </div>
          <div class="campo">Mês
            <select id="filtro-receber-mes">
              <option value="">Todos</option>
              ${mesesFiltro.map(m => `<option value="${m}" ${m === f.mes ? 'selected' : ''}>${formatMes(m)}</option>`).join('')}
            </select>
          </div>
          <div class="campo">Status
            <select id="filtro-receber-status">
              ${STATUS_OPTIONS.map(o => `<option value="${o.v}" ${o.v === f.status ? 'selected' : ''}>${o.t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="receber-lista"></div>
      </div>
    `;

    document.getElementById('filtro-receber-aluno').addEventListener('change', e => { this.filtrosReceber.aluno = e.target.value; this.renderReceberLista(); });
    document.getElementById('filtro-receber-tipo').addEventListener('change', e => { this.filtrosReceber.tipo = e.target.value; this.renderReceberLista(); });
    document.getElementById('filtro-receber-mes').addEventListener('change', e => { this.filtrosReceber.mes = e.target.value; this.renderReceberLista(); });
    document.getElementById('filtro-receber-status').addEventListener('change', e => { this.filtrosReceber.status = e.target.value; this.renderReceberLista(); });

    this.renderReceberLista();
  },

  renderReceberLista() {
    const f = this.filtrosReceber;
    const alunos = DB.get('alunos.json');
    let lista = DB.get('receber.json').slice().sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || ''));

    if (f.aluno) lista = lista.filter(r => r.alunoId === f.aluno);
    if (f.tipo) lista = lista.filter(r => r.tipo === f.tipo);
    if (f.mes) lista = lista.filter(r => (r.vencimento || '').slice(0, 7) === f.mes);
    if (f.status) lista = lista.filter(r => statusEfetivo(r) === f.status);

    const el = document.getElementById('receber-lista');
    if (!el) return;

    if (lista.length === 0) { el.innerHTML = '<p class="text-muted">Nenhuma cobrança encontrada.</p>'; return; }

    const total = lista.reduce((s, r) => s + r.valor, 0);
    el.innerHTML = `
      <div class="resumo" style="margin-top:12px;">
        <div class="item"><strong>${lista.length}</strong><span>Cobranças</span></div>
        <div class="item"><strong>R$ ${numero(total)}</strong><span>Total</span></div>
      </div>
      <table>
        <thead><tr><th>Aluno</th><th>Tipo</th><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>
          ${lista.map(r => {
            const aluno = alunos.find(a => a.id === r.alunoId) || { nome: '—' };
            return `<tr>
              <td>${esc(aluno.nome)}</td>
              <td>${r.tipo === 'material' ? 'Material' : 'Mensalidade'}</td>
              <td>${r.parcela}ª</td>
              <td>${formatDate(r.vencimento)}</td>
              <td>R$ ${numero(r.valor)}</td>
              <td>${statusBadge(statusEfetivo(r))}</td>
              <td class="acoes">
                ${statusEfetivo(r) !== 'pago' ? `<button class="secondary" onclick="App.receber('${r.id}')">Receber</button>` : `<button class="secondary" onclick="App.reverter('${r.id}')">Reverter</button>`}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
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

  // ==================== ALUNOS ====================
  renderAlunos() {
    const sec = document.getElementById('tab-alunos');
    const alunos = DB.get('alunos.json');

    const form = `
      <div class="card">
        <h2><span id="al-titulo">Novo</span> Aluno</h2>
        <input type="hidden" id="al-id" />
        <h3>Dados do aluno</h3>
        <div class="form-row">
          <label>Nome completo <input id="al-nome" /></label>
          <label>E-mail <input id="al-email" /></label>
        </div>
        <div class="form-row">
          <label>Telefone 1 <input id="al-fone1" /></label>
          <label>Telefone 2 <input id="al-fone2" /></label>
        </div>
        <h3>Pessoa autorizada a buscar o aluno</h3>
        <div class="form-row">
          <label>Nome <input id="al-aut-nome" /></label>
          <label>Telefone <input id="al-aut-fone" /></label>
        </div>
        <h3>Responsável financeiro</h3>
        <div class="form-row">
          <label>Nome <input id="al-resp-nome" /></label>
          <label>Grau de parentesco
            <select id="al-resp-parentesco">${PARENTESCOS.map(p => `<option>${p}</option>`).join('')}</select>
          </label>
        </div>
        <div class="form-row">
          <label>CPF <input id="al-resp-cpf" /></label>
          <label>Telefone <input id="al-resp-fone" /></label>
        </div>
        <div class="form-row">
          <label>E-mail <input id="al-resp-email" /></label>
          <label>Endereço <input id="al-resp-end" /></label>
        </div>
        <button class="primary" id="btn-salvar-aluno">Salvar aluno</button>
        <button class="secondary" id="btn-cancelar-aluno" style="display:none;">Cancelar edição</button>
      </div>
    `;

    const lista = alunos.length === 0
      ? '<p class="text-muted">Nenhum aluno cadastrado.</p>'
      : alunos.map(a => this.alunoCard(a)).join('');

    sec.innerHTML = form + `<h2 style="margin-bottom:12px; color:#1e3a8a;">Alunos cadastrados</h2>${lista}`;

    document.getElementById('btn-salvar-aluno').addEventListener('click', () => this.salvarAluno());
    document.getElementById('btn-cancelar-aluno').addEventListener('click', () => this.cancelarEdicaoAluno());
  },

  alunoCard(a) {
    const aut = a.autorizado || {};
    const resp = a.responsavel || {};
    return `
      <div class="aluno-card">
        <div class="topo">
          <h3>${esc(a.nome)}</h3>
          <div>
            <button class="secondary" onclick="App.editarAluno('${a.id}')">Editar</button>
            <button class="secondary" onclick="App.excluirAluno('${a.id}')">Excluir</button>
          </div>
        </div>
        <div class="aluno-grid">
          <div><span class="rotulo">Telefone 1:</span> ${esc(a.telefone1 || a.telefone || '—')}</div>
          <div><span class="rotulo">Telefone 2:</span> ${esc(a.telefone2 || '—')}</div>
          <div><span class="rotulo">E-mail:</span> ${esc(a.email || '—')}</div>
          <div><span class="rotulo">Autorizado a buscar:</span> ${esc(aut.nome || '—')}${aut.telefone ? ' — ' + esc(aut.telefone) : ''}</div>
          <div><span class="rotulo">Responsável:</span> ${esc(resp.nome || '—')}</div>
          <div><span class="rotulo">Parentesco:</span> ${esc(resp.parentesco || '—')}</div>
          <div><span class="rotulo">CPF:</span> ${esc(resp.cpf || '—')}</div>
          <div><span class="rotulo">Telefone resp.:</span> ${esc(resp.telefone || '—')}</div>
          <div><span class="rotulo">E-mail resp.:</span> ${esc(resp.email || '—')}</div>
          <div><span class="rotulo">Endereço:</span> ${esc(resp.endereco || '—')}</div>
        </div>
      </div>
    `;
  },

  async salvarAluno() {
    const id = document.getElementById('al-id').value;
    const nome = document.getElementById('al-nome').value.trim();
    if (!nome) { this.setStatus('Informe o nome do aluno.', 'warn'); return; }

    const dados = {
      id: id || uid('a'),
      nome,
      email: document.getElementById('al-email').value.trim(),
      telefone1: document.getElementById('al-fone1').value.trim(),
      telefone2: document.getElementById('al-fone2').value.trim(),
      autorizado: {
        nome: document.getElementById('al-aut-nome').value.trim(),
        telefone: document.getElementById('al-aut-fone').value.trim()
      },
      responsavel: {
        nome: document.getElementById('al-resp-nome').value.trim(),
        parentesco: document.getElementById('al-resp-parentesco').value,
        cpf: document.getElementById('al-resp-cpf').value.trim(),
        telefone: document.getElementById('al-resp-fone').value.trim(),
        email: document.getElementById('al-resp-email').value.trim(),
        endereco: document.getElementById('al-resp-end').value.trim()
      }
    };

    const alunos = DB.get('alunos.json');
    if (id) {
      const idx = alunos.findIndex(a => a.id === id);
      if (idx === -1) return;
      alunos[idx] = dados;
    } else {
      alunos.push(dados);
    }

    try {
      await DB.set('alunos.json', alunos, id ? 'Edita aluno' : 'Adiciona aluno');
      this.setStatus(id ? 'Aluno atualizado ✓' : 'Aluno salvo ✓');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  editarAluno(id) {
    const a = DB.get('alunos.json').find(x => x.id === id);
    if (!a) return;
    document.getElementById('al-id').value = a.id;
    document.getElementById('al-nome').value = a.nome;
    document.getElementById('al-email').value = a.email || '';
    document.getElementById('al-fone1').value = a.telefone1 || a.telefone || '';
    document.getElementById('al-fone2').value = a.telefone2 || '';
    document.getElementById('al-aut-nome').value = a.autorizado?.nome || '';
    document.getElementById('al-aut-fone').value = a.autorizado?.telefone || '';
    document.getElementById('al-resp-nome').value = a.responsavel?.nome || '';
    document.getElementById('al-resp-parentesco').value = a.responsavel?.parentesco || 'Pai';
    document.getElementById('al-resp-cpf').value = a.responsavel?.cpf || '';
    document.getElementById('al-resp-fone').value = a.responsavel?.telefone || '';
    document.getElementById('al-resp-email').value = a.responsavel?.email || '';
    document.getElementById('al-resp-end').value = a.responsavel?.endereco || '';
    document.getElementById('al-titulo').textContent = 'Editar';
    document.getElementById('btn-cancelar-aluno').style.display = 'inline-block';
    document.getElementById('btn-salvar-aluno').scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  cancelarEdicaoAluno() {
    document.getElementById('al-id').value = '';
    ['al-nome','al-email','al-fone1','al-fone2','al-aut-nome','al-aut-fone','al-resp-nome','al-resp-cpf','al-resp-fone','al-resp-email','al-resp-end']
      .forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('al-resp-parentesco').value = 'Pai';
    document.getElementById('al-titulo').textContent = 'Novo';
    document.getElementById('btn-cancelar-aluno').style.display = 'none';
  },

  async excluirAluno(id) {
    const a = DB.get('alunos.json').find(x => x.id === id);
    if (!confirm(`Excluir o aluno ${a?.nome || ''}?`)) return;
    const alunos = DB.get('alunos.json').filter(x => x.id !== id);
    try {
      await DB.set('alunos.json', alunos, 'Exclui aluno');
      this.setStatus('Aluno excluído.');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  // ==================== MATRÍCULAS ====================
  renderMatriculas() {
    const sec = document.getElementById('tab-matriculas');
    const alunos = DB.get('alunos.json');
    const config = DB.get('config.json');
    const tipos = config.tiposContrato || ['Mensal', 'Semestral', 'Anual', 'Por módulo'];
    const modalidades = config.modalidades || [];
    const f = this.filtrosMatriculas;

    const alunosOptions = alunos.slice().sort((a, b) => a.nome.localeCompare(b.nome))
      .map(a => `<option value="${a.id}">${esc(a.nome)}</option>`).join('');

    const modalidadesOptions = modalidades.length === 0
      ? '<option value="">Cadastre modalidades em Configurações</option>'
      : '<option value="">Selecione...</option>' + modalidades.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');

    sec.innerHTML = `
      <div class="card">
        <h2><span id="mt-titulo">Nova</span> Matrícula</h2>
        <input type="hidden" id="mt-id" />
        <div class="form-row">
          <label>Aluno <select id="mt-aluno"><option value="">Selecione...</option>${alunosOptions}</select></label>
          <label>Modalidade <select id="mt-modalidade">${modalidadesOptions}</select></label>
          <label>Tipo de contrato <select id="mt-tipo">${tipos.map(t => `<option>${esc(t)}</option>`).join('')}</select></label>
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
          <label>Valor total (R$) <input type="number" id="mt-mat-valor" step="0.01" min="0" value="0" /></label>
          <label>Parcelas do material <input type="number" id="mt-mat-parcelas" min="1" value="1" /></label>
        </div>
        <button class="primary" id="btn-salvar-matricula">Salvar matrícula e gerar cobranças</button>
        <button class="secondary" id="btn-cancelar-matricula" style="display:none;">Cancelar edição</button>
      </div>

      <div class="card">
        <h2>Matrículas realizadas</h2>
        <div class="filtros">
          <div class="campo">Nome do aluno <input id="filtro-mt-aluno" value="${esc(f.aluno)}" placeholder="Buscar..." /></div>
          <div class="campo">Responsável <input id="filtro-mt-resp" value="${esc(f.responsavel)}" placeholder="Buscar..." /></div>
          <div class="campo">Tipo
            <select id="filtro-mt-tipo">
              <option value="">Todos</option>
              ${tipos.map(t => `<option value="${esc(t)}" ${t === f.tipo ? 'selected' : ''}>${esc(t)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="matriculas-lista"></div>
      </div>
    `;

    document.getElementById('btn-salvar-matricula').addEventListener('click', () => this.salvarMatricula());
    document.getElementById('btn-cancelar-matricula').addEventListener('click', () => this.cancelarEdicaoMatricula());

    document.getElementById('filtro-mt-aluno').addEventListener('input', e => { this.filtrosMatriculas.aluno = e.target.value; this.renderMatriculasLista(); });
    document.getElementById('filtro-mt-resp').addEventListener('input', e => { this.filtrosMatriculas.responsavel = e.target.value; this.renderMatriculasLista(); });
    document.getElementById('filtro-mt-tipo').addEventListener('change', e => { this.filtrosMatriculas.tipo = e.target.value; this.renderMatriculasLista(); });

    this.renderMatriculasLista();
  },

  renderMatriculasLista() {
    const f = this.filtrosMatriculas;
    const matriculas = DB.get('matriculas.json');
    const alunos = DB.get('alunos.json');

    let lista = matriculas.slice();
    if (f.aluno) lista = lista.filter(m => {
      const a = alunos.find(x => x.id === m.alunoId);
      return (a?.nome || '').toLowerCase().includes(f.aluno.toLowerCase());
    });
    if (f.responsavel) lista = lista.filter(m => {
      const a = alunos.find(x => x.id === m.alunoId);
      return (a?.responsavel?.nome || '').toLowerCase().includes(f.responsavel.toLowerCase());
    });
    if (f.tipo) lista = lista.filter(m => m.tipo === f.tipo);

    const el = document.getElementById('matriculas-lista');
    if (!el) return;

    if (lista.length === 0) { el.innerHTML = '<p class="text-muted">Nenhuma matrícula encontrada.</p>'; return; }

    el.innerHTML = `
      <table>
        <thead><tr><th>Aluno</th><th>Modalidade</th><th>Tipo</th><th>Início</th><th>Término</th><th>Valor mensal</th><th>Parcelas</th><th>Material</th><th>Ações</th></tr></thead>
        <tbody>
          ${lista.map(m => {
            const a = alunos.find(x => x.id === m.alunoId) || {};
            return `<tr>
              <td>${esc(a.nome || '—')}</td>
              <td>${esc(m.modalidade || '—')}</td>
              <td>${esc(m.tipo)}</td>
              <td>${formatDate(m.inicio)}</td>
              <td>${formatDate(m.termino)}</td>
              <td>R$ ${numero(m.valorMensal)}</td>
              <td>${m.parcelasMensalidade}</td>
              <td>${m.material?.valorTotal ? `R$ ${numero(m.material.valorTotal)} (${m.material.parcelas}x)` : '—'}</td>
              <td class="acoes">
                <button class="secondary" onclick="App.editarMatricula('${m.id}')">Editar</button>
                <button class="secondary" onclick="App.excluirMatricula('${m.id}')">Excluir</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  async salvarMatricula() {
    const id = document.getElementById('mt-id').value;
    const alunoId = document.getElementById('mt-aluno').value;
    if (!alunoId) { this.setStatus('Selecione um aluno.', 'warn'); return; }

    const mt = {
      id: id || uid('m'),
      alunoId,
      modalidade: document.getElementById('mt-modalidade').value,
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
    if (mt.valorMensal <= 0 && mt.material.valorTotal <= 0) { this.setStatus('Informe valor mensal ou valor de material.', 'warn'); return; }

    const matriculas = DB.get('matriculas.json');
    const receber = DB.get('receber.json');

    try {
      if (id) {
        const idx = matriculas.findIndex(m => m.id === id);
        if (idx === -1) return;
        matriculas[idx] = mt;

        const pagas = receber.filter(r => r.matriculaId === id && r.status === 'pago')
          .map(r => ({ tipo: r.tipo, parcela: r.parcela, dataRecebimento: r.dataRecebimento }));
        const restante = receber.filter(r => r.matriculaId !== id);
        const novas = gerarCobrancas(mt);
        novas.forEach(n => {
          const paga = pagas.find(p => p.tipo === n.tipo && p.parcela === n.parcela);
          if (paga) { n.status = 'pago'; n.dataRecebimento = paga.dataRecebimento; }
        });
        await DB.set('matriculas.json', matriculas, 'Edita matrícula');
        await DB.set('receber.json', restante.concat(novas), 'Atualiza cobranças da matrícula');
        this.setStatus('Matrícula atualizada ✓');
      } else {
        matriculas.push(mt);
        await DB.set('matriculas.json', matriculas, 'Nova matrícula');
        await DB.set('receber.json', receber.concat(gerarCobrancas(mt)), 'Gera cobranças da matrícula');
        this.setStatus('Matrícula salva e cobranças geradas ✓');
      }
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  editarMatricula(id) {
    const m = DB.get('matriculas.json').find(x => x.id === id);
    if (!m) return;
    document.getElementById('mt-id').value = m.id;
    document.getElementById('mt-aluno').value = m.alunoId;
    document.getElementById('mt-modalidade').value = m.modalidade || '';
    document.getElementById('mt-tipo').value = m.tipo;
    document.getElementById('mt-inicio').value = m.inicio;
    document.getElementById('mt-termino').value = m.termino;
    document.getElementById('mt-dia').value = m.diaVencimento;
    document.getElementById('mt-valor').value = m.valorMensal;
    document.getElementById('mt-desconto').value = m.desconto || 0;
    document.getElementById('mt-bolsa').value = m.bolsa || 0;
    document.getElementById('mt-parcelas').value = m.parcelasMensalidade;
    document.getElementById('mt-mat-valor').value = m.material?.valorTotal || 0;
    document.getElementById('mt-mat-parcelas').value = m.material?.parcelas || 1;
    document.getElementById('mt-titulo').textContent = 'Editar';
    document.getElementById('btn-salvar-matricula').textContent = 'Salvar alterações';
    document.getElementById('btn-cancelar-matricula').style.display = 'inline-block';
    document.getElementById('btn-salvar-matricula').scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  cancelarEdicaoMatricula() {
    document.getElementById('mt-id').value = '';
    ['mt-aluno','mt-modalidade','mt-tipo','mt-inicio','mt-termino','mt-valor','mt-mat-valor']
      .forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('mt-dia').value = 10;
    document.getElementById('mt-desconto').value = 0;
    document.getElementById('mt-bolsa').value = 0;
    document.getElementById('mt-parcelas').value = 12;
    document.getElementById('mt-mat-parcelas').value = 1;
    document.getElementById('mt-titulo').textContent = 'Nova';
    document.getElementById('btn-salvar-matricula').textContent = 'Salvar matrícula e gerar cobranças';
    document.getElementById('btn-cancelar-matricula').style.display = 'none';
  },

  async excluirMatricula(id) {
    if (!confirm('Excluir esta matrícula e todas as suas cobranças?')) return;
    const matriculas = DB.get('matriculas.json').filter(m => m.id !== id);
    const receber = DB.get('receber.json').filter(r => r.matriculaId !== id);
    try {
      await DB.set('matriculas.json', matriculas, 'Exclui matrícula');
      await DB.set('receber.json', receber, 'Exclui cobranças da matrícula');
      this.setStatus('Matrícula excluída.');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  // ==================== RELATÓRIOS ====================
  renderRelatorios() {
    const sec = document.getElementById('tab-relatorios');
    const anoAtual = new Date().getFullYear();

    sec.innerHTML = `
      <div class="card">
        <h2>Relatórios</h2>
        <div class="form-row">
          <label>Mês
            <select id="rel-mes">
              ${MESES.map((m, i) => `<option value="${i + 1}" ${i + 1 === new Date().getMonth() + 1 ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
          </label>
          <label>Ano <input type="number" id="rel-ano" value="${anoAtual}" /></label>
          <button class="primary" id="btn-gerar-rel">Gerar relatório</button>
        </div>
        <div id="rel-resultado"></div>
      </div>
    `;

    document.getElementById('btn-gerar-rel').addEventListener('click', () => this.gerarRelatorio());
    this.gerarRelatorio();
  },

  gerarRelatorio() {
    const mes = parseInt(document.getElementById('rel-mes').value);
    const ano = parseInt(document.getElementById('rel-ano').value);
    const chave = `${ano}-${String(mes).padStart(2, '0')}`;

    const receber = DB.get('receber.json');
    const pagar = DB.get('pagar.json');

    const totalRecebido = receber.filter(r => r.status === 'pago' && (r.dataRecebimento || r.vencimento).slice(0, 7) === chave).reduce((s, r) => s + r.valor, 0);
    const totalPago = pagar.filter(p => p.status === 'pago' && (p.dataPagamento || p.vencimento).slice(0, 7) === chave).reduce((s, p) => s + p.valor, 0);
    const inadimplentes = receber.filter(r => r.status !== 'pago');
    const totalInadimplencia = inadimplentes.reduce((s, r) => s + r.valor, 0);

    const receitasPorTipo = { mensalidade: 0, material: 0 };
    receber.forEach(r => {
      if (r.status === 'pago' && (r.dataRecebimento || r.vencimento).slice(0, 7) === chave) {
        receitasPorTipo[r.tipo] = (receitasPorTipo[r.tipo] || 0) + r.valor;
      }
    });

    const despesasPorCat = {};
    pagar.filter(p => p.vencimento.slice(0, 7) === chave).forEach(p => {
      const c = p.categoria || 'Outros';
      despesasPorCat[c] = (despesasPorCat[c] || 0) + p.valor;
    });

    const nomeMes = `${MESES[mes - 1]}/${ano}`;

    document.getElementById('rel-resultado').innerHTML = `
      <h3>Fluxo de Caixa — ${nomeMes}</h3>
      <table>
        <tr><td>Entradas (recebido)</td><td>R$ ${numero(totalRecebido)}</td></tr>
        <tr><td>Saídas (pago)</td><td>R$ ${numero(totalPago)}</td></tr>
        <tr><td><strong>Saldo do mês</strong></td><td><strong>R$ ${numero(totalRecebido - totalPago)}</strong></td></tr>
      </table>

      <h3>Inadimplência</h3>
      <table>
        <tr><td>Cobranças em aberto</td><td>${inadimplentes.length} parcela(s)</td></tr>
        <tr><td>Total em aberto</td><td>R$ ${numero(totalInadimplencia)}</td></tr>
      </table>

      <h3>DRE — ${nomeMes}</h3>
      <table>
        <tr><td>Receitas (mensalidade)</td><td>R$ ${numero(receitasPorTipo.mensalidade || 0)}</td></tr>
        <tr><td>Receitas (material)</td><td>R$ ${numero(receitasPorTipo.material || 0)}</td></tr>
        <tr><td><strong>Total de receitas</strong></td><td><strong>R$ ${numero(totalRecebido)}</strong></td></tr>
        <tr><td colspan="2"><hr /></td></tr>
        ${Object.entries(despesasPorCat).map(([cat, v]) => `<tr><td>Despesa: ${esc(cat)}</td><td>R$ ${numero(v)}</td></tr>`).join('')}
        <tr><td><strong>Total de despesas</strong></td><td><strong>R$ ${numero(totalPago)}</strong></td></tr>
        <tr><td colspan="2"><hr /></td></tr>
        <tr><td><strong>Resultado do período</strong></td><td><strong>R$ ${numero(totalRecebido - totalPago)}</strong></td></tr>
      </table>
    `;
  },

  // ==================== CONFIGURAÇÕES ====================
  renderConfig(jaRenderizado = false) {
    const cfg = GH.getConfig();
    const categorias = DB.get('categorias.json') || { despesas: [], receitas: [] };
    const config = DB.get('config.json') || {};
    const tipos = config.tiposContrato || [];
    const modalidades = config.modalidades || [];

    const owner = jaRenderizado && document.getElementById('cfg-owner') ? document.getElementById('cfg-owner').value : cfg.owner;
    const repo = jaRenderizado && document.getElementById('cfg-repo') ? document.getElementById('cfg-repo').value : cfg.repo;
    const branch = jaRenderizado && document.getElementById('cfg-branch') ? document.getElementById('cfg-branch').value : cfg.branch;
    const token = jaRenderizado && document.getElementById('cfg-token') ? document.getElementById('cfg-token').value : cfg.token;

    const sec = document.getElementById('tab-config');
    sec.innerHTML = `
      <div class="card">
        <h2>Configurações do GitHub</h2>
        <div class="form-row">
          <label>Owner <input id="cfg-owner" value="${esc(owner)}" /></label>
          <label>Repositório <input id="cfg-repo" value="${esc(repo)}" /></label>
          <label>Branch <input id="cfg-branch" value="${esc(branch)}" /></label>
        </div>
        <div class="form-row">
          <label>Token (salvo no navegador) <input id="cfg-token" type="password" value="${esc(token)}" placeholder="ghp_..." /></label>
        </div>
        <button class="primary" id="btn-save-gh">Salvar e testar conexão</button>
        <div id="gh-result" style="margin-top:12px;"></div>
      </div>

      <div class="card">
        <h2>Categorias</h2>
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
          <div style="flex:1; min-width:280px;">
            <h3>Despesas</h3>
            ${categorias.despesas.map((c, i) => `
              <div class="config-lista">
                <input type="text" class="cat-desp" value="${esc(c)}" />
                <button class="secondary" onclick="App.removerCategoriaIdx('despesa', ${i})">✕</button>
              </div>`).join('')}
            <div style="display:flex; gap:8px; margin-top:8px;">
              <input type="text" id="nova-cat-despesa" placeholder="Nova despesa" style="flex:1;" />
              <button class="primary" onclick="App.adicionarCategoria('despesa')">+</button>
            </div>
          </div>
          <div style="flex:1; min-width:280px;">
            <h3>Receitas</h3>
            ${categorias.receitas.map((c, i) => `
              <div class="config-lista">
                <input type="text" class="cat-rec" value="${esc(c)}" />
                <button class="secondary" onclick="App.removerCategoriaIdx('receita', ${i})">✕</button>
              </div>`).join('')}
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
        ${tipos.map((t, i) => `
          <div class="config-lista">
            <input type="text" class="tipo-contrato" value="${esc(t)}" />
            <button class="secondary" onclick="App.removerTipoContratoIdx(${i})">✕</button>
          </div>`).join('')}
        <div style="display:flex; gap:8px; margin-top:8px;">
          <input type="text" id="novo-tipo" placeholder="Novo tipo de contrato" style="flex:1;" />
          <button class="primary" onclick="App.adicionarTipoContrato()">+</button>
        </div>
        <button class="primary" id="btn-salvar-tipos" style="margin-top:16px;">Salvar tipos de contrato</button>
      </div>

      <div class="card">
        <h2>Modalidades</h2>
        ${modalidades.map((m, i) => `
          <div class="config-lista">
            <input type="text" class="modalidade" value="${esc(m)}" />
            <button class="secondary" onclick="App.removerModalidadeIdx(${i})">✕</button>
          </div>`).join('')}
        <div style="display:flex; gap:8px; margin-top:8px;">
          <input type="text" id="nova-modalidade" placeholder="Nova modalidade" style="flex:1;" />
          <button class="primary" onclick="App.adicionarModalidade()">+</button>
        </div>
        <button class="primary" id="btn-salvar-modalidades" style="margin-top:16px;">Salvar modalidades</button>
      </div>

      <div class="card">
        <h2>Backup e Restore</h2>
        <p style="margin-bottom:12px;">Os dados são salvos automaticamente no GitHub a cada alteração.</p>
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
        result.innerHTML = `<div class="alert error">Erro: ${esc(e.message)}</div>`;
        this.setStatus('Falha na conexão', 'error');
      }
    });

    document.getElementById('btn-salvar-categorias').addEventListener('click', () => this.salvarCategorias());
    document.getElementById('btn-salvar-tipos').addEventListener('click', () => this.salvarTiposContrato());
    document.getElementById('btn-salvar-modalidades').addEventListener('click', () => this.salvarModalidades());
    document.getElementById('btn-backup').addEventListener('click', () => this.exportarBackup());
    document.getElementById('btn-restore').addEventListener('click', () => document.getElementById('arquivo-restore').click());
    document.getElementById('arquivo-restore').addEventListener('change', (e) => this.restaurarBackup(e));
  },

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

  removerCategoriaIdx(tipo, i) {
    const categorias = DB.get('categorias.json');
    if (tipo === 'despesa') categorias.despesas.splice(i, 1);
    else categorias.receitas.splice(i, 1);
    DB._cache['categorias.json'] = { data: categorias, sha: DB._cache['categorias.json']?.sha };
    this.renderConfig(true);
  },

  async salvarCategorias() {
    const categorias = DB.get('categorias.json');
    document.querySelectorAll('.cat-desp').forEach((el, i) => { if (categorias.despesas[i] !== undefined) categorias.despesas[i] = el.value.trim(); });
    document.querySelectorAll('.cat-rec').forEach((el, i) => { if (categorias.receitas[i] !== undefined) categorias.receitas[i] = el.value.trim(); });
    try {
      await DB.set('categorias.json', categorias, 'Atualiza categorias');
      this.setStatus('Categorias salvas ✓');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  adicionarTipoContrato() {
    const nome = document.getElementById('novo-tipo').value.trim();
    if (!nome) return;
    const config = DB.get('config.json');
    if (!config.tiposContrato.includes(nome)) config.tiposContrato.push(nome);
    DB._cache['config.json'] = { data: config, sha: DB._cache['config.json']?.sha };
    this.renderConfig(true);
  },

  removerTipoContratoIdx(i) {
    const config = DB.get('config.json');
    config.tiposContrato.splice(i, 1);
    DB._cache['config.json'] = { data: config, sha: DB._cache['config.json']?.sha };
    this.renderConfig(true);
  },

  async salvarTiposContrato() {
    const config = DB.get('config.json');
    config.tiposContrato = [];
    document.querySelectorAll('.tipo-contrato').forEach(el => { const v = el.value.trim(); if (v) config.tiposContrato.push(v); });
    try {
      await DB.set('config.json', config, 'Atualiza tipos de contrato');
      this.setStatus('Tipos de contrato salvos ✓');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

  adicionarModalidade() {
    const nome = document.getElementById('nova-modalidade').value.trim();
    if (!nome) return;
    const config = DB.get('config.json');
    if (!config.modalidades) config.modalidades = [];
    if (!config.modalidades.includes(nome)) config.modalidades.push(nome);
    DB._cache['config.json'] = { data: config, sha: DB._cache['config.json']?.sha };
    this.renderConfig(true);
  },

  removerModalidadeIdx(i) {
    const config = DB.get('config.json');
    if (config.modalidades) config.modalidades.splice(i, 1);
    DB._cache['config.json'] = { data: config, sha: DB._cache['config.json']?.sha };
    this.renderConfig(true);
  },

  async salvarModalidades() {
    const config = DB.get('config.json');
    config.modalidades = [];
    document.querySelectorAll('.modalidade').forEach(el => { const v = el.value.trim(); if (v) config.modalidades.push(v); });
    try {
      await DB.set('config.json', config, 'Atualiza modalidades');
      this.setStatus('Modalidades salvas ✓');
      this.renderAll();
    } catch (e) { this.setStatus('Erro: ' + e.message, 'error'); }
  },

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
        if (dados[f]) await DB.set(f, dados[f], 'Restaura backup ' + f);
      }
      await DB.loadAll();
      result.innerHTML = '<div class="alert success">✓ Backup restaurado com sucesso.</div>';
      this.setStatus('Backup restaurado ✓');
      this.renderAll();
    } catch (err) {
      result.innerHTML = `<div class="alert error">Erro ao ler backup: ${esc(err.message)}</div>`;
    }
    e.target.value = '';
  }
};

// ==================== FUNÇÕES UTILITÁRIAS ====================

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function uid(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function formatMes(chave) {
  const [ano, mes] = chave.split('-');
  return `${MESES[parseInt(mes) - 1]}/${ano}`;
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
  return map[status] || esc(status);
}

function statusEfetivo(r) {
  if (r.status === 'pago') return 'pago';
  if (r.vencimento && r.vencimento < hojeISO()) return 'atrasado';
  return 'pendente';
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
  return Math.ceil((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
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

function addMeses(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setMonth(d.getMonth() + n);
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

function gerarCobrancas(mt) {
  const cobrancas = [];
  const valorComDesc = aplicarDescontos(mt.valorMensal, mt.desconto, mt.bolsa);
  for (let p = 1; p <= mt.parcelasMensalidade; p++) {
    cobrancas.push({
      id: uid('r'),
      matriculaId: mt.id,
      alunoId: mt.alunoId,
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
      cobrancas.push({
        id: uid('r'),
        matriculaId: mt.id,
        alunoId: mt.alunoId,
        tipo: 'material',
        parcela: p,
        vencimento: proximoVencimento(mt.inicio, mt.diaVencimento, p - 1),
        valor: Math.round(valorMaterial * 100) / 100,
        status: 'pendente'
      });
    }
  }
  return cobrancas;
}

function mesesDisponiveis(registros) {
  const set = new Set();
  registros.forEach(r => { if (r.vencimento) set.add(r.vencimento.slice(0, 7)); });
  return Array.from(set).sort();
}

document.addEventListener('DOMContentLoaded', () => App.init());
