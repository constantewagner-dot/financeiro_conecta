import { useEffect, useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export function ContasPagarPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ descricao: '', valor: '', dataVencimento: '', categoriaId: '' });

  const load = () => api.get('/financeiro/contas-pagar').then((res) => setItems(res.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    await api.post('/financeiro/contas-pagar', { ...form, valor: Number(form.valor) });
    toast.success('Conta criada');
    setForm({ descricao: '', valor: '', dataVencimento: '', categoriaId: '' });
    load();
  };

  const pagar = async (id: string) => { await api.put(`/financeiro/contas-pagar/${id}/pagar`); toast.success('Pago'); load(); };
  const remove = async (id: string) => { if (confirm('Excluir?')) { await api.delete(`/financeiro/contas-pagar/${id}`); toast.success('Excluído'); load(); } };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Contas a Pagar</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input className="border rounded-lg px-3 py-2" placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Valor" type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Vencimento" type="date" value={form.dataVencimento} onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="ID Categoria" value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })} />
        </div>
        <button onClick={save} className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Criar</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Descrição</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Valor</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Vencimento</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
          </tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 text-sm">{c.descricao}</td>
                <td className="px-4 py-3 text-sm">R$ {Number(c.valor).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{new Date(c.dataVencimento).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-sm">{c.status}</td>
                <td className="px-4 py-3 text-right">
                  {c.status === 'PENDENTE' && <button onClick={() => pagar(c.id)} className="p-2 text-green-600 hover:bg-green-50 rounded"><Check className="h-4 w-4" /></button>}
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
