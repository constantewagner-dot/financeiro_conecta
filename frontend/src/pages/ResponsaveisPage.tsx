import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export function ResponsaveisPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', cpf: '' });
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => api.get('/responsaveis').then((res) => setItems(res.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editId) { await api.put(`/responsaveis/${editId}`, form); toast.success('Atualizado'); }
    else { await api.post('/responsaveis', form); toast.success('Criado'); }
    setForm({ nome: '', email: '', telefone: '', cpf: '' });
    setEditId(null);
    load();
  };

  const edit = (r: any) => { setForm({ nome: r.nome, email: r.email || '', telefone: r.telefone || '', cpf: r.cpf || '' }); setEditId(r.id); };
  const remove = async (id: string) => { if (confirm('Excluir?')) { await api.delete(`/responsaveis/${id}`); toast.success('Excluído'); load(); } };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Responsáveis</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input className="border rounded-lg px-3 py-2" placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="CPF" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
        </div>
        <button onClick={save} className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2"><Plus className="h-4 w-4" /> {editId ? 'Atualizar' : 'Criar'}</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Telefone</th>
            <th className="px-4 py-3 text-left text-sm font-medium">CPF</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
          </tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 text-sm">{r.nome}</td>
                <td className="px-4 py-3 text-sm">{r.email}</td>
                <td className="px-4 py-3 text-sm">{r.telefone}</td>
                <td className="px-4 py-3 text-sm">{r.cpf}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => edit(r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => remove(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
