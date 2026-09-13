import { NavLink, Link } from 'react-router-dom';
import { Building2, LayoutDashboard, Users, UserCircle, GraduationCap, School, ClipboardList, ArrowDownCircle, ArrowUpCircle, Tags, Database } from 'lucide-react';

const menu = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/alunos', label: 'Alunos', icon: Users },
  { path: '/responsaveis', label: 'Responsáveis', icon: UserCircle },
  { path: '/professores', label: 'Professores', icon: GraduationCap },
  { path: '/turmas', label: 'Turmas', icon: School },
  { path: '/matriculas', label: 'Matrículas', icon: ClipboardList },
  { path: '/contas-receber', label: 'Contas a Receber', icon: ArrowDownCircle },
  { path: '/contas-pagar', label: 'Contas a Pagar', icon: ArrowUpCircle },
  { path: '/categorias', label: 'Categorias', icon: Tags },
  { path: '/backup', label: 'Backup', icon: Database },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <Link to="/" className="px-6 py-6 border-b border-gray-800 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold">Financeiro</h1>
          <p className="text-xs text-gray-400">Conecta</p>
        </div>
      </Link>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
