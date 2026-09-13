import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AlunosPage } from '@/pages/AlunosPage';
import { ResponsaveisPage } from '@/pages/ResponsaveisPage';
import { ProfessoresPage } from '@/pages/ProfessoresPage';
import { TurmasPage } from '@/pages/TurmasPage';
import { MatriculasPage } from '@/pages/MatriculasPage';
import { ContasReceberPage } from '@/pages/ContasReceberPage';
import { ContasPagarPage } from '@/pages/ContasPagarPage';
import { CategoriasPage } from '@/pages/CategoriasPage';
import { BackupPage } from '@/pages/BackupPage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/alunos" element={<AlunosPage />} />
          <Route path="/responsaveis" element={<ResponsaveisPage />} />
          <Route path="/professores" element={<ProfessoresPage />} />
          <Route path="/turmas" element={<TurmasPage />} />
          <Route path="/matriculas" element={<MatriculasPage />} />
          <Route path="/contas-receber" element={<ContasReceberPage />} />
          <Route path="/contas-pagar" element={<ContasPagarPage />} />
          <Route path="/categorias" element={<CategoriasPage />} />
          <Route path="/backup" element={<BackupPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
