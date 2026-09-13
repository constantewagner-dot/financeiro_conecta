import { Building2 } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
      <div className="lg:hidden flex items-center gap-2">
        <Building2 className="h-6 w-6 text-primary-600" />
        <span className="font-bold">Financeiro Conecta</span>
      </div>
    </header>
  );
}
