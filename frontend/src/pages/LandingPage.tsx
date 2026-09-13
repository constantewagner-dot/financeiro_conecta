import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, CheckCircle2, GraduationCap, Wallet, BarChart3, Shield, Database, FileText } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    { icon: GraduationCap, title: 'Gestão Acadêmica', description: 'Alunos, responsáveis, professores, turmas e matrículas.' },
    { icon: Wallet, title: 'Controle Financeiro', description: 'Contas a pagar e receber com categorias.' },
    { icon: BarChart3, title: 'Dashboard', description: 'Visualize receitas, despesas e inadimplência.' },
    { icon: Shield, title: 'Seguro', description: 'Dados protegidos com backup automático.' },
    { icon: Database, title: 'Backup', description: 'Exporte e restaure seus dados facilmente.' },
    { icon: FileText, title: 'Relatórios', description: 'Gere relatórios em PDF.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">Financeiro Conecta</h1>
              <p className="text-xs text-gray-500">Gestão Escolar & Financeira</p>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium flex items-center gap-2">
            Acessar <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="bg-gradient-to-br from-primary-600 to-slate-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-extrabold mb-6">Gestão escolar e financeira integrada</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Controle alunos, turmas, mensalidades e finanças em uma única plataforma.
          </p>
          <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-gray-100 inline-flex items-center gap-2">
            Acessar o Sistema <ArrowRight className="h-5 w-5" />
          </button>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-400" /> API REST</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-400" /> Backup JSON</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-400" /> Relatórios PDF</div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Recursos Principais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-semibold mb-2">{f.title}</h4>
                <p className="text-gray-600 text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        © {new Date().getFullYear()} Financeiro Conecta. Todos os direitos reservados.
      </footer>
    </div>
  );
}
