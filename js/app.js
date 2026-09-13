// app.js — inicialização e navegação

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

  // --- Tela de Configurações ---
  renderConfig() {
    const cfg = GH.getConfig();
    const sec = document.getElementById('tab-config');
    sec.innerHTML = `
      <div class="card">
        <h2>Configurações do GitHub</h2>
        <div class="form-row">
          <label>Owner (usuário/org)
            <input id="cfg-owner" value="${cfg.owner}" />
          </label>
          <label>Repositório
            <input id="cfg-repo" value="${cfg.repo}" />
          </label>
          <label>Branch
            <input id="cfg-branch" value="${cfg.branch}" />
          </label>
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
        <p>(edição de categorias e tipos de contrato será implementada na Etapa 2)</p>
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
        result.innerHTML = '<div class="alert info">✓ Conexão OK. Recarregando dados...</div>';
        await DB.loadAll();
        this.setStatus('Conectado ao GitHub ✓');
        this.renderAll();
      } catch (e) {
        result.innerHTML = `<div class="alert error">Erro: ${e.message}</div>`;
        this.setStatus('Falha na conexão', 'error');
      }
    });
  },

  renderAll() {
    // placeholders das outras abas (preenchidos nas próximas etapas)
    document.getElementById('tab-dashboard').innerHTML = '<div class="card"><h2>Dashboard</h2><p>(Etapa 3)</p></div>';
    document.getElementById('tab-pagar').innerHTML = '<div class="card"><h2>Contas a Pagar</h2><p>(Etapa 3)</p></div>';
    document.getElementById('tab-receber').innerHTML = '<div class="card"><h2>Contas a Receber</h2><p>(Etapa 3)</p></div>';
    document.getElementById('tab-matriculas').innerHTML = '<div class="card"><h2>Matrículas</h2><p>(Etapa 2)</p></div>';
    document.getElementById('tab-relatorios').innerHTML = '<div class="card"><h2>Relatórios</h2><p>(Etapa 3)</p></div>';
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
