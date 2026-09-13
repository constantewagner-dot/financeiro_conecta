import { useEffect, useState } from 'react';
import { Users, GraduationCap, School, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import api from '@/services/api';

export function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="text-center py-12">Carregando...</div>;

  const cards = [
    { label: 'Alunos', value: data.totalAlunos, icon: Users, color: 'bg-blue-500' },
    { label: 'Professores', value: data.totalProfessores, icon: GraduationCap, color: 'bg-purple-500' },
    { label: 'Turmas', value: data.totalTurmas, icon: School, color: 'bg-indigo-500' },
    { label: 'Receitas', value: `R$ ${data.receitas.toFixed(2)}`, icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Despesas', value: `R$ ${data.despesas.toFixed(2)}`, icon: TrendingDown, color: 'bg-red-500' },
    { label: 'Inadimplência', value: `R$ ${data.inadimplencia.toFixed(2)}`, icon: AlertCircle, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold mb-2">Resultado</h3>
        <p className="text-3xl font-bold text-primary-600">R$ {data.resultado.toFixed(2)}</p>
      </div>
    </div>
  );
}
