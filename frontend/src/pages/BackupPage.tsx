import { Database, Download, Upload } from 'lucide-react';

export function BackupPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Backup</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4">
            <Download className="h-6 w-6" />
          </div>
          <h3 className="font-semibold mb-2">Exportar Backup</h3>
          <p className="text-sm text-gray-600 mb-4">Baixe um arquivo com todos os dados do sistema.</p>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
            <Download className="h-4 w-4" /> Exportar
          </button>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="font-semibold mb-2">Restaurar Backup</h3>
          <p className="text-sm text-gray-600 mb-4">Carregue um arquivo de backup para restaurar os dados.</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
            <Upload className="h-4 w-4" /> Restaurar
          </button>
        </div>
      </div>
    </div>
  );
}
