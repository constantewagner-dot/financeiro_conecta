import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export function AlunosPage() {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [form, setForm] = useState({ nome: '', matricula: '', email: '', telefone: '' });
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => api.get('/alunos').then((res) => setAlunos(res.data));

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editId) {
      await api.put(`/alunos/${editId}`, form);
      toast.success('Aluno atualizado');
    } else {
      await api.post('/alunos', form);
      toast.success('Aluno criado');
    }
    setForm({ nome: '', matricula: '', email: '', telefone: '' });
    setEditId(null);
    load();
  };

  const edit = (a: any) => {
    setForm({ nome: a.nome, matricula: a.matricula, email: a.email || '', telefone: a.telefone || '' });
    setEditId(a.id);
  };

  const remove = async (id: string) => {
    if (confirm('Excluir aluno?')) {
      await api.delete(`/alunos/${id}`);
      toast.success('Aluno excluído');
      load();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Alunos</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input className="border rounded-lg px-3 py-2" placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Matrícula" value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </div>
        <button onClick={save} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> {editId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Matrícula</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Telefone</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3 text-sm">{a.nome}</td>
                <td className="px-4 py-3 text-sm">{a.matricula}</td>
                <td className="px-4 py-3 text-sm">{a.email}</td>
                <td className="px-4 py-3 text-sm">{a.telefone}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => edit(a)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => remove(a.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
