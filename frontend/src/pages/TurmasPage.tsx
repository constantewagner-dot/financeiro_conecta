import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export function TurmasPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ nome: '', anoLetivo: 2026, capacidade: 30, professorId: '' });
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => api.get('/turmas').then((res) => setItems(res.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    const data = { ...form, anoLetivo: Number(form.anoLetivo), capacidade: Number(form.capacidade) };
    if (editId) { await api.put(`/turmas/${editId}`, data); toast.success('Atualizado'); }
    else { await api.post('/turmas', data); toast.success('Criado'); }
    setForm({ nome: '', anoLetivo: 2026, capacidade: 30, professorId: '' });
    setEditId(null);
    load();
  };

  const edit = (t: any) => { setForm({ nome: t.nome, anoLetivo: t.anoLetivo, capacidade: t.capacidade || 30, professorId: t.professorId || '' }); setEditId(t.id); };
  const remove = async (id: string) => { if (confirm('Excluir?')) { await api.delete(`/turmas/${id}`); toast.success('Excluído'); load(); } };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Turmas</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input className="border rounded-lg px-3 py-2" placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Ano Letivo" type="number" value={form.anoLetivo} onChange={(e) => setForm({ ...form, anoLetivo: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Capacidade" type="number" value={form.capacidade} onChange={(e) => setForm({ ...form, capacidade: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="ID Professor" value={form.professorId} onChange={(e) => setForm({ ...form, professorId: e.target.value })} />
        </div>
        <button onClick={save} className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2"><Plus className="h-4 w-4" /> {editId ? 'Atualizar' : 'Criar'}</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Ano Letivo</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Capacidade</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Professor</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
          </tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-3 text-sm">{t.nome}</td>
                <td className="px-4 py-3 text-sm">{t.anoLetivo}</td>
                <td className="px-4 py-3 text-sm">{t.capacidade}</td>
                <td className="px-4 py-3 text-sm">{t.professor?.nome || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => edit(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => remove(t.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
