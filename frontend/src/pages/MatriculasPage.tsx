import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export function MatriculasPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ alunoId: '', turmaId: '' });

  const load = () => api.get('/matriculas').then((res) => setItems(res.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    await api.post('/matriculas', form);
    toast.success('Matrícula criada');
    setForm({ alunoId: '', turmaId: '' });
    load();
  };

  const remove = async (id: string) => { if (confirm('Excluir?')) { await api.delete(`/matriculas/${id}`); toast.success('Excluído'); load(); } };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Matrículas</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input className="border rounded-lg px-3 py-2" placeholder="ID Aluno" value={form.alunoId} onChange={(e) => setForm({ ...form, alunoId: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="ID Turma" value={form.turmaId} onChange={(e) => setForm({ ...form, turmaId: e.target.value })} />
        </div>
        <button onClick={save} className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Matricular</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Aluno</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Turma</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
          </tr></thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-3 text-sm">{m.aluno?.nome}</td>
                <td className="px-4 py-3 text-sm">{m.turma?.nome}</td>
                <td className="px-4 py-3 text-sm">{new Date(m.dataMatricula).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-sm">{m.status}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(m.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
