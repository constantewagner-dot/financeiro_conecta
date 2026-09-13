import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export function CategoriasPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ nome: '', tipo: 'RECEITA', descricao: '' });

  const load = () => api.get('/categorias').then((res) => setItems(res.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    await api.post('/categorias', form);
    toast.success('Categoria criada');
    setForm({ nome: '', tipo: 'RECEITA', descricao: '' });
    load();
  };

  const remove = async (id: string) => { if (confirm('Excluir?')) { await api.delete(`/categorias/${id}`); toast.success('Excluído'); load(); } };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Categorias</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input className="border rounded-lg px-3 py-2" placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <select className="border rounded-lg px-3 py-2" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="RECEITA">Receita</option>
            <option value="DESPESA">Despesa</option>
          </select>
          <input className="border rounded-lg px-3 py-2" placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </div>
        <button onClick={save} className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Criar</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Descrição</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
          </tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 text-sm">{c.nome}</td>
                <td className="px-4 py-3 text-sm">{c.tipo}</td>
                <td className="px-4 py-3 text-sm">{c.descricao}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
