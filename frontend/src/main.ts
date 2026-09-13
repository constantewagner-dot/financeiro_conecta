import './style.css'

// ===== Tipos =====
type Aluno = {
  id: number
  nome: string
  mensalidade: number
  pago: boolean
}

// ===== Estado =====
let alunos: Aluno[] = [
  { id: 1, nome: 'João Silva', mensalidade: 350, pago: true },
  { id: 2, nome: 'Maria Souza', mensalidade: 350, pago: false },
  { id: 3, nome: 'Pedro Santos', mensalidade: 400, pago: true },
]

let pagina: string = 'dashboard'

// ===== Render =====
const app = document.getElementById('app')!

function render() {
  let html = ''

  if (pagina === 'dashboard') html = renderDashboard()
  if (pagina === 'alunos') html = renderAlunos()

  app.innerHTML = `
    <nav>
      <h1>💼 Financeiro Conecta</h1>
      <button onclick="navegar('dashboard')">📊 Dashboard</button>
      <button onclick="navegar('alunos')">👥 Alunos</button>
    </nav>
    <main>${html}</main>
  `
}

function renderDashboard() {
  const total = alunos.length
  const pagos = alunos.filter(a => a.pago).length
  const receita = alunos.filter(a => a.pago).reduce((s, a) => s + a.mensalidade, 0)
  const inadimplentes = alunos.filter(a => !a.pago)

  return `
    <h2>Resumo</h2>
    <div class="cards">
      <div class="card"><strong>${total}</strong><p>Alunos</p></div>
      <div class="card"><strong>${pagos}</strong><p>Pagamentos</p></div>
      <div class="card"><strong>R$ ${receita}</strong><p>Recebido</p></div>
      <div class="card"><strong>${inadimplentes.length}</strong><p>Inadimplentes</p></div>
    </div>
    <h3>Inadimplentes</h3>
    <ul>
      ${inadimplentes.map(a => `<li>${a.nome} — R$ ${a.mensalidade}</li>`).join('')}
    </ul>
  `
}

function renderAlunos() {
  return `
    <h2>Alunos</h2>
    <table>
      <tr>
        <th>Nome</th>
        <th>Mensalidade</th>
        <th>Status</th>
        <th>Ação</th>
      </tr>
      ${alunos.map(a => `
        <tr>
          <td>${a.nome}</td>
          <td>R$ ${a.mensalidade}</td>
          <td>${a.pago ? '✅ Pago' : '❌ Pendente'}</td>
          <td>
            <button onclick="togglePagamento(${a.id})">
              ${a.pago ? 'Marcar pendente' : 'Marcar pago'}
            </button>
          </td>
        </tr>
      `).join('')}
    </table>
    <h3>Novo Aluno</h3>
    <form onsubmit="addAluno(event)">
      <input id="nome" placeholder="Nome" required />
      <input id="mensalidade" type="number" placeholder="Mensalidade" required />
      <button type="submit">Adicionar</button>
    </form>
  `
}

// ===== Funções globais (usadas nos onclick) =====
declare global {
  interface Window {
    navegar: (p: string) => void
    togglePagamento: (id: number) => void
    addAluno: (e: Event) => void
  }
}

window.navegar = (p: string) => {
  pagina = p
  render()
}

window.togglePagamento = (id: number) => {
  alunos = alunos.map(a =>
    a.id === id ? { ...a, pago: !a.pago } : a
  )
  render()
}

window.addAluno = (e: Event) => {
  e.preventDefault()
  const nome = (document.getElementById('nome') as HTMLInputElement).value
  const mensalidade = Number((document.getElementById('mensalidade') as HTMLInputElement).value)
  alunos.push({
    id: Date.now(),
    nome,
    mensalidade,
    pago: false,
  })
  render()
}

// ===== Iniciar =====
render()
