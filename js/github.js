// github.js — leitura/escrita de arquivos JSON no GitHub via API REST

const GH = {
  STORAGE_KEY: 'fc_github_config',
  DEFAULTS: {
    owner: 'constantewagner-dot',
    repo: 'financeiro_conecta',
    branch: 'main',
    dataPath: 'data',
    token: ''
  },

  getConfig() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? { ...this.DEFAULTS, ...JSON.parse(raw) } : { ...this.DEFAULTS };
  },
  setConfig(cfg) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ ...this.getConfig(), ...cfg }));
  },
  isConfigured() {
    const cfg = this.getConfig();
    return !!cfg.token && !!cfg.owner && !!cfg.repo;
  },

  async request(path, options = {}) {
    const cfg = this.getConfig();
    if (!cfg.token) throw new Error('Token do GitHub não configurado.');
    const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${cfg.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.headers || {})
      }
    });
    return res;
  },

  async loadFile(filename) {
    const cfg = this.getConfig();
    const path = `${cfg.dataPath}/${filename}`;
    const res = await this.request(`/contents/${path}?ref=${cfg.branch}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Erro ao ler ${filename}: ${res.status}`);
    const json = await res.json();
    const content = atob(json.content.replace(/\n/g, ''));
    return { data: JSON.parse(content), sha: json.sha };
  },

  async saveFile(filename, data, message) {
    const cfg = this.getConfig();
    const path = `${cfg.dataPath}/${filename}`;
    let sha = null;
    const existing = await this.loadFile(filename);
    if (existing) sha = existing.sha;

    const body = {
      message: message || `Atualiza ${filename}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
      branch: cfg.branch
    };
    if (sha) body.sha = sha;

    const res = await this.request(`/contents/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Erro ao salvar ${filename}: ${err.message || res.status}`);
    }
    const json = await res.json();
    return { sha: json.content.sha };
  },

  async testConnection() {
    const res = await this.request('');
    if (!res.ok) throw new Error(`Repositório não acessível (${res.status}). Verifique token e permissões.`);
    return true;
  }
};

const DB = {
  _cache: {},
  _files: [
    'alunos.json', 'matriculas.json', 'receber.json', 'pagar.json',
    'categorias.json', 'config.json', 'fornecedores.json', 'colaboradores.json'
  ],
  _defaults: {
    'alunos.json': [],
    'matriculas.json': [],
    'receber.json': [],
    'pagar.json': [],
    'fornecedores.json': [],
    'colaboradores.json': [],
    'categorias.json': {
      receitas: ['Mensalidade', 'Taxa de Material'],
      despesas: ['Salários', 'Aluguel', 'Internet', 'Material', 'Impostos', 'Contabilidade']
    },
    'config.json': {
      tiposContrato: ['Mensal', 'Semestral', 'Anual', 'Por módulo'],
      modalidades: ['Musicalização', 'Ballet', 'Violão', 'Piano', 'Canto']
    }
  },

  async loadAll() {
    for (const f of this._files) {
      const loaded = await GH.loadFile(f);
      if (loaded) {
        this._cache[f] = loaded;
      } else {
        const def = this._defaults[f];
        const saved = await GH.saveFile(f, def, `Cria ${f}`);
        this._cache[f] = { data: def, sha: saved.sha };
      }
    }
  },

  get(filename) {
    return this._cache[filename]?.data ?? JSON.parse(JSON.stringify(this._defaults[filename]));
  },

  async set(filename, data, message) {
    const res = await GH.saveFile(filename, data, message);
    this._cache[filename] = { data, sha: res.sha };
  }
};
