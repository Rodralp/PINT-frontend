import './css/App.css'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import './translations/i18n'
import LandingPage from './LandingPage'
import GaleriaPublica from './GaleriaPublica'
import BadgePublica from './BadgePublica'
import PerfilPublico from './PerfilPublico'
import CriarConta from './criar'
import Entrar from './entrar'
import DashboardC from './pages/Consultor/Dashboard_C'
import DashboardTM from './pages/TalentManager/Dashboard_TM'
import GestaoPedidosTM from './pages/TalentManager/GestaoPedidos_TM'
import PedidoTM from './pages/TalentManager/Pedido_TM'
import ExportacoesTM from './pages/TalentManager/Exportacoes_TM'
import HistoricoTM from './pages/TalentManager/Historico_TM'
import DashboardSLL from './pages/ServiceLineLeader/Dashboard_SLL'
import ExportacoesSLL from './pages/ServiceLineLeader/Exportacoes_SLL'
import GestaoPedidosSLL from './pages/ServiceLineLeader/GestaoPedidos_SLL'
import PedidoSLL from './pages/ServiceLineLeader/Pedido_SLL'
import RankingSLL from './pages/ServiceLineLeader/Ranking_SLL'
import MinhaServiceLineSLL from './pages/ServiceLineLeader/MinhaServiceLine_SLL'
import HistoricoSLL from './pages/ServiceLineLeader/Historico_SLL'
import DashboardAG from './pages/AdminGestor/Dashboard_AG'
import CatalogoBadges from './pages/CatalogoBadges'
import BadgeAdmin from './pages/AdminGestor/BadgeAdmin'
import GestaoPedidosAG from './pages/AdminGestor/GestaoPedidos_AG'
import PedidoAG from './pages/AdminGestor/Pedido_AG'
import EquipasSLAAG from './pages/AdminGestor/EquipasSLA_AG'
import ExportacoesAG from './pages/AdminGestor/Exportacoes_AG'
import GestaoGeralAG from './pages/AdminGestor/GestaoGeral_AG'
import ComunicadosAvisosAG from './pages/AdminGestor/ComunicadosAvisos_AG'
import UtilizadoresAG from './pages/AdminGestor/Utilizadores_AG'
import LearningPathsAG from './pages/AdminGestor/LearningPaths_AG'
import MeusBadges from './pages/Consultor/MeusBadges'
import BadgeDetalhe from './pages/Consultor/BadgeDetalhe'
import PedidoDetalheC from './pages/Consultor/PedidoDetalhe_C'
import Exportacoes from './pages/Consultor/Exportacoes'
import MensagensAvisos from './pages/Consultor/MensagensAvisos'
import Notificacoes from './pages/Consultor/Notificacoes'
import Profile from './pages/profile'
import ProfileEdit from './pages/profileEdit'
import MeusPedidos from './pages/Consultor/MeusPedidos'
import RankingConsultores from './pages/Consultor/RankingConsultores'
import Lembretes from './pages/Consultor/Lembretes'
import LearningPaths from './pages/Consultor/LearningPaths'
import Preferencias from './pages/Consultor/Preferencias'
import ConsultorPreferencesGuard from './components/ConsultorPreferencesGuard'
import Definicoes from './pages/Definicoes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/galeria-publica' element={<GaleriaPublica />} />
        <Route path='/galeria-publica/badge/:badgeId' element={<BadgePublica />} />
        <Route path='/galeria-publica/consultor/:consultorId' element={<PerfilPublico />} />
        <Route path='/criar' element={<CriarConta />} />
        <Route path='/entrar' element={<Entrar />} />
        <Route path='/dashboard' element={<Navigate to='/consultor/dashboard' replace />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/profile/edit' element={<ProfileEdit />} />

        <Route element={<ConsultorPreferencesGuard />}>
          <Route path='/consultor/preferencias' element={<Preferencias />} />
          <Route path='/consultor/definicoes' element={<Definicoes />} />
          <Route path='/consultor/dashboard' element={<DashboardC />} />
          <Route path='/consultor/catalogo-badges' element={<CatalogoBadges />} />
          <Route path='/consultor/meus-badges' element={<MeusBadges />} />
          <Route path='/consultor/badge/:badgeId' element={<BadgeDetalhe />} />
          <Route path='/consultor/learning-paths' element={<LearningPaths />} />
          <Route path='/consultor/meus-pedidos' element={<MeusPedidos />} />
          <Route path='/consultor/meus-pedidos/:pedidoId' element={<PedidoDetalheC />} />
          <Route path='/consultor/ranking' element={<RankingConsultores />} />
          <Route path='/consultor/lembretes' element={<Lembretes />} />
          <Route path='/consultor/exportacoes' element={<Exportacoes />} />
          <Route path='/consultor/mensagens-avisos' element={<MensagensAvisos />} />
          <Route path='/consultor/notificacoes' element={<Notificacoes />} />

          <Route path='/dashboard/consultor' element={<Navigate to='/consultor/dashboard' replace />} />
          <Route path='/dashboard/definicoes' element={<Navigate to='/consultor/definicoes' replace />} />
          <Route path='/dashboard/catalogo-badges' element={<Navigate to='/consultor/catalogo-badges' replace />} />
          <Route path='/dashboard/meus-badges' element={<Navigate to='/consultor/meus-badges' replace />} />
          <Route path='/dashboard/badge/:badgeId' element={<BadgeDetalhe />} />
          <Route path='/dashboard/learning-paths' element={<Navigate to='/consultor/learning-paths' replace />} />
          <Route path='/dashboard/meus-pedidos' element={<Navigate to='/consultor/meus-pedidos' replace />} />
          <Route path='/dashboard/meus-pedidos/:pedidoId' element={<PedidoDetalheC />} />
          <Route path='/dashboard/ranking' element={<Navigate to='/consultor/ranking' replace />} />
          <Route path='/dashboard/lembretes' element={<Navigate to='/consultor/lembretes' replace />} />
          <Route path='/dashboard/exportacoes' element={<Navigate to='/consultor/exportacoes' replace />} />
          <Route path='/dashboard/mensagens-avisos' element={<Navigate to='/consultor/mensagens-avisos' replace />} />
          <Route path='/dashboard/notificacoes' element={<Navigate to='/consultor/notificacoes' replace />} />
        </Route>

        <Route path='/talent-manager/dashboard' element={<DashboardTM />} />
        <Route path='/talent-manager/definicoes' element={<Definicoes />} />
        <Route path='/talent-manager/pedidos' element={<GestaoPedidosTM />} />
        <Route path='/talent-manager/pedidos/:pedidoId' element={<PedidoTM />} />
        <Route path='/talent-manager/exportacoes' element={<ExportacoesTM />} />
        <Route path='/talent-manager/historico' element={<HistoricoTM />} />

        <Route path='/service-line-leader/dashboard' element={<DashboardSLL />} />
        <Route path='/service-line-leader/definicoes' element={<Definicoes />} />
        <Route path='/service-line-leader/minha-service-line' element={<MinhaServiceLineSLL />} />
        <Route path='/service-line-leader/ranking' element={<RankingSLL />} />
        <Route path='/service-line-leader/pedidos' element={<GestaoPedidosSLL />} />
        <Route path='/service-line-leader/pedidos/:pedidoId' element={<PedidoSLL />} />
        <Route path='/service-line-leader/exportacoes' element={<ExportacoesSLL />} />
        <Route path='/service-line-leader/historico' element={<HistoricoSLL />} />

        <Route path='/admin-gestor/dashboard' element={<DashboardAG />} />
        <Route path='/admin-gestor/definicoes' element={<Definicoes />} />
        <Route path='/admin-gestor/utilizadores' element={<UtilizadoresAG />} />
        <Route path='/admin-gestor/catalogo-badges' element={<CatalogoBadges />} />
        <Route path='/admin-gestor/badge/:badgeId' element={<BadgeAdmin />} />
        <Route path='/admin-gestor/learning-paths' element={<LearningPathsAG />} />
        <Route path='/admin-gestor/equipas-sla' element={<EquipasSLAAG />} />
        <Route path='/admin-gestor/comunicados-avisos' element={<ComunicadosAvisosAG />} />
        <Route path='/admin-gestor/pedidos' element={<GestaoPedidosAG />} />
        <Route path='/admin-gestor/pedidos/:pedidoId' element={<PedidoAG />} />
        <Route path='/admin-gestor/exportacoes' element={<ExportacoesAG />} />
        <Route path='/admin-gestor/gestao-geral' element={<GestaoGeralAG />} />
        <Route path='/dashboard/talent-manager' element={<Navigate to='/talent-manager/dashboard' replace />} />
        <Route path='/dashboard/talent-manager/definicoes' element={<Navigate to='/talent-manager/definicoes' replace />} />
        <Route path='/dashboard/talent-manager/pedidos' element={<Navigate to='/talent-manager/pedidos' replace />} />
        <Route path='/dashboard/talent-manager/pedidos/:pedidoId' element={<Navigate to='/talent-manager/pedidos' replace />} />
        <Route path='/dashboard/talent-manager/exportacoes' element={<Navigate to='/talent-manager/exportacoes' replace />} />
        <Route path='/dashboard/talent-manager/historico' element={<Navigate to='/talent-manager/historico' replace />} />

        <Route path='/dashboard/service-line-leader' element={<Navigate to='/service-line-leader/dashboard' replace />} />
        <Route path='/dashboard/service-line-leader/definicoes' element={<Navigate to='/service-line-leader/definicoes' replace />} />
        <Route path='/dashboard/service-line-leader/minha-service-line' element={<Navigate to='/service-line-leader/minha-service-line' replace />} />
        <Route path='/dashboard/service-line-leader/ranking' element={<Navigate to='/service-line-leader/ranking' replace />} />
        <Route path='/dashboard/service-line-leader/pedidos' element={<Navigate to='/service-line-leader/pedidos' replace />} />
        <Route path='/dashboard/service-line-leader/pedidos/:pedidoId' element={<Navigate to='/service-line-leader/pedidos' replace />} />
        <Route path='/dashboard/service-line-leader/exportacoes' element={<Navigate to='/service-line-leader/exportacoes' replace />} />
        <Route path='/dashboard/service-line-leader/historico' element={<Navigate to='/service-line-leader/historico' replace />} />

        <Route path='/dashboard/admin-gestor' element={<Navigate to='/admin-gestor/dashboard' replace />} />
        <Route path='/dashboard/admin-gestor/definicoes' element={<Navigate to='/admin-gestor/definicoes' replace />} />
        <Route path='/dashboard/admin-gestor/utilizadores' element={<Navigate to='/admin-gestor/utilizadores' replace />} />
        <Route path='/dashboard/admin-gestor/learning-paths' element={<Navigate to='/admin-gestor/learning-paths' replace />} />
        <Route path='/dashboard/admin-gestor/equipas-sla' element={<Navigate to='/admin-gestor/equipas-sla' replace />} />
        <Route path='/dashboard/admin-gestor/comunicados-avisos' element={<Navigate to='/admin-gestor/comunicados-avisos' replace />} />
        <Route path='/dashboard/admin-gestor/pedidos' element={<Navigate to='/admin-gestor/pedidos' replace />} />
        <Route path='/dashboard/admin-gestor/pedidos/:pedidoId' element={<Navigate to='/admin-gestor/pedidos' replace />} />
        <Route path='/dashboard/admin-gestor/exportacoes' element={<Navigate to='/admin-gestor/exportacoes' replace />} />
        <Route path='/dashboard/admin-gestor/gestao-geral' element={<Navigate to='/admin-gestor/gestao-geral' replace />} />
        <Route path='/dashboard/admin/pedidos' element={<Navigate to='/admin-gestor/pedidos' replace />} />
        <Route path='/dashboard/admin/definicoes' element={<Navigate to='/admin-gestor/definicoes' replace />} />
        <Route path='/dashboard/admin/utilizadores' element={<Navigate to='/admin-gestor/utilizadores' replace />} />
        <Route path='/dashboard/admin/catalogo-badges' element={<Navigate to='/admin-gestor/catalogo-badges' replace />} />
        <Route path='/dashboard/admin/learning-paths' element={<Navigate to='/admin-gestor/learning-paths' replace />} />
        <Route path='/dashboard/admin/equipas-sla' element={<Navigate to='/admin-gestor/equipas-sla' replace />} />
        <Route path='/dashboard/admin/comunicados-avisos' element={<Navigate to='/admin-gestor/comunicados-avisos' replace />} />
        <Route path='/dashboard/admin/exportacoes' element={<Navigate to='/admin-gestor/exportacoes' replace />} />
        <Route path='/dashboard/admin/gestao-geral' element={<Navigate to='/admin-gestor/gestao-geral' replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
