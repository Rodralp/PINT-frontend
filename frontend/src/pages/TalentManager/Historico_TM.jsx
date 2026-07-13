import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { Search, Eye, X, Clock3 } from 'lucide-react';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  fetchHistoricoServiceLines,
  fetchHistoricoBadges,
  fetchHistoricoConsultores,
  fetchDetalhesServiceLine,
  fetchHistoricoPorEstadoTM,
  fetchHistoricoCandidaturaTM,
} from '../../services/talentManagerService';
import '../../css/TalentManager/Exportacoes_TM.css';
import '../../css/TalentManager/historico-actions.css';
import '../../css/Shared/HistoricoPages.css';

const ITEMS_PER_PAGE = 10;

const normalizeLevelTitle = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '-';
  if (raw.includes(' - ')) {
    const suffix = raw.split(' - ').slice(1).join(' - ').trim();
    if (suffix) return suffix;
  }
  return raw.replace(/^nivel\s+/i, '').trim() || raw;
};

function HistoricoTM() {
  const { t } = useTranslation();

  const tabs = useMemo(() => [
    { id: 'service-lines', label: t('historico_tab_service_lines') },
    { id: 'badges', label: t('historico_tab_badges') },
    { id: 'consultores', label: t('historico_tab_consultants') },
  ], [t]);

  const [activeTab, setActiveTab] = useState('service-lines');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [serviceLines, setServiceLines] = useState([]);
  const [badges, setBadges] = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [expandedSLId, setExpandedSLId] = useState(null);
  const [slAreas, setSlAreas] = useState({});
  const [slAreasLoading, setSlAreasLoading] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [historicoPedidoId, setHistoricoPedidoId] = useState(null);
  const [historicoData, setHistoricoData] = useState([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [slData, bData, cData] = await Promise.all([
          fetchHistoricoServiceLines().catch(() => []),
          fetchHistoricoBadges().catch(() => []),
          fetchHistoricoConsultores().catch(() => []),
        ]);

        if (isMounted) {
          setServiceLines(Array.isArray(slData) ? slData : []);
          setBadges(Array.isArray(bData) ? bData : []);
          setConsultores(Array.isArray(cData) ? cData : []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error?.message || t('error_generic'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (activeTab === 'service-lines') {
      return serviceLines.filter((item) => item.name?.toLowerCase().includes(query));
    }
    if (activeTab === 'badges') {
      return badges.filter((item) =>
        item.name?.toLowerCase().includes(query)
        || item.area?.toLowerCase().includes(query)
        || item.serviceLine?.toLowerCase().includes(query),
      );
    }
    if (activeTab === 'consultores') {
      return consultores.filter((item) =>
        item.name?.toLowerCase().includes(query)
        || item.email?.toLowerCase().includes(query)
        || item.serviceLine?.toLowerCase().includes(query),
      );
    }
    return [];
  }, [activeTab, searchQuery, serviceLines, badges, consultores]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const pagedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, page]);

  const toggleExpandSL = async (slId) => {
    if (expandedSLId === slId) {
      setExpandedSLId(null);
      return;
    }
    setExpandedSLId(slId);
    if (slAreas[slId]) return;

    setSlAreasLoading((prev) => ({ ...prev, [slId]: true }));
    try {
      const data = await fetchDetalhesServiceLine(slId);
      setSlAreas((prev) => ({ ...prev, [slId]: data?.areas || [] }));
    } catch {
      setSlAreas((prev) => ({ ...prev, [slId]: [] }));
    } finally {
      setSlAreasLoading((prev) => ({ ...prev, [slId]: false }));
    }
  };

  const openModal = async (type, entityId, extraParams = {}) => {
    setModalType(type);
    setModalOpen(true);
    setModalLoading(true);

    try {
      let estado = 'pendente';
      if (type.includes('Pendentes')) estado = 'pendente';
      else if (type.includes('Aceites')) estado = 'aceite';
      else if (type.includes('Rejeitados')) estado = 'rejeitado';

      const data = await fetchHistoricoPorEstadoTM(type, estado, entityId, extraParams);
      setModalData(Array.isArray(data) ? data : []);
    } catch {
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalData(null);
  };

  const openHistoricoCandidatura = async (pedidoId) => {
    setHistoricoPedidoId(pedidoId);
    setHistoricoOpen(true);
    setHistoricoLoading(true);
    try {
      const data = await fetchHistoricoCandidaturaTM(pedidoId);
      setHistoricoData(Array.isArray(data) ? data : []);
    } catch {
      setHistoricoData([]);
    } finally {
      setHistoricoLoading(false);
    }
  };

  const closeHistorico = () => {
    setHistoricoOpen(false);
    setHistoricoPedidoId(null);
    setHistoricoData([]);
  };

  const descriptionMap = {
    'Candidatura criada.': 'desc_candidatura_criada',
    'Candidatura submetida para validação.': 'desc_candidatura_submetida',
    'Candidatura validada pelo Talent Manager e enviada para SLL.': 'desc_validada_tm_sll',
    'Candidatura rejeitada pelo Talent Manager.': 'desc_rejeitada_tm',
    'Candidatura rejeitada pelo Service Line Leader.': 'desc_rejeitada_sll',
    'Candidatura rejeitada pelo Administrador/Gestor.': 'desc_rejeitada_admin',
    'Candidatura devolvida ao consultor pelo Talent Manager.': 'desc_devolvida_tm',
    'Candidatura devolvida ao consultor pelo Service Line Leader.': 'desc_devolvida_sll',
    'Candidatura devolvida ao consultor pelo Administrador/Gestor.': 'desc_devolvida_admin',
    'Candidatura aprovada pelo Service Line Leader.': 'desc_aprovada_sll',
    'Candidatura aprovada pelo Administrador/Gestor.': 'desc_aprovada_admin',
    'Candidatura rejeitada automaticamente porque a badge expirou.': 'desc_rejeitada_auto_badge',
    'Badge especial atribuída automaticamente por trigger.': 'desc_badge_especial',
  };

  const translateDescription = (desc) => {
    if (!desc) return '';
    return t(descriptionMap[desc] || desc);
  };

  const renderStatusBadge = (status) => {
    const statusLabels = {
      completo: t('badge_status_validated'),
      'a-fazer': t('badge_status_pending'),
      pendente: t('badge_status_pending'),
      ativo: t('users_status_active'),
      inativo: t('users_status_inactive'),
      rejeitado: t('badge_status_rejected'),
      sent: t('badge_status_in_progress'),
    };
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const mappedStatus = ['pendente-tm', 'pendente-sll'].includes(normalizedStatus)
      ? 'pendente'
      : normalizedStatus;
    const label = statusLabels[mappedStatus] || mappedStatus || '-';
    return <span className={`ag-user-status ${mappedStatus}`}>{label}</span>;
  };

  const renderEstadoButtons = (type, entityId, extraParams = {}) => (
    <div className="historico-actions-group">
      <button
        type="button"
        className="action-btn tm-export-control-btn historico-action-btn"
        onClick={() => openModal(`${type}Pendentes`, entityId, extraParams)}
      >
        <Eye size={16} />
        {t('ver_pendentes')}
      </button>
      <button
        type="button"
        className="action-btn tm-export-control-btn historico-action-btn"
        onClick={() => openModal(`${type}Aceites`, entityId, extraParams)}
      >
        <Eye size={16} />
        {t('ver_aceites')}
      </button>
      <button
        type="button"
        className="action-btn tm-export-control-btn historico-action-btn"
        onClick={() => openModal(`${type}Rejeitados`, entityId, extraParams)}
      >
        <Eye size={16} />
        {t('ver_rejeitados')}
      </button>
    </div>
  );

  return (
    <Layout>
      <div className="page tm-export-page historico-page">
        <header className="page-header tm-export-header">
          <h1>{t('historico_title_tm')}</h1>
        </header>

        <div className="shell tm-export-shell">
          <div className="tm-export-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tm-export-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab !== 'service-lines' && (
            <div className="toolbar tm-export-toolbar historico-toolbar-single">
              <div className="search-wrap tm-export-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {isLoading && <LoadingSpinner message={t('loading')} />}
          {errorMessage && <p className="lp-progress-label">{errorMessage}</p>}

          {!isLoading && !errorMessage && (
            <>
              {activeTab === 'service-lines' && (
                <>
                  <div className="table-wrap orders-table-wrap">
                    <table className="table orders-table">
                      <thead>
                        <tr>
                          <th>{t('header_service_line')}</th>
                          <th>{t('header_total_badges')}</th>
                          <th>{t('header_consultants')}</th>
                          <th>{t('header_actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedData.length === 0 && (
                          <tr>
                            <td colSpan={4} className="empty-state orders-empty-row">{t('no_items')}</td>
                          </tr>
                        )}
                        {pagedData.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => toggleExpandSL(item.id)}
                              >
                                {item.name}
                              </strong>
                            </td>
                            <td>{item.totalBadges || 0}</td>
                            <td>{item.totalConsultores || 0}</td>
                            <td>{renderEstadoButtons('serviceLine', item.id, { serviceLineId: item.id })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {expandedSLId && (
                    <>
                      <h3 className="historico-section-title">{t('historico_areas_title')}</h3>
                      <div className="table-wrap orders-table-wrap">
                        <table className="table orders-table">
                          <thead>
                            <tr>
                              <th>{t('header_area')}</th>
                              <th>{t('header_total_badges')}</th>
                              <th>{t('header_actions')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {slAreasLoading[expandedSLId] && (
                              <tr>
                                <td colSpan={3} className="empty-state orders-empty-row">{t('loading')}</td>
                              </tr>
                            )}
                            {!slAreasLoading[expandedSLId] && (slAreas[expandedSLId] || []).length === 0 && (
                              <tr>
                                <td colSpan={3} className="empty-state orders-empty-row">{t('no_items')}</td>
                              </tr>
                            )}
                            {(slAreas[expandedSLId] || []).map((area) => (
                              <tr key={area.id}>
                                <td><strong>{area.name}</strong></td>
                                <td>{area.totalBadges || 0}</td>
                                <td>{renderEstadoButtons('area', area.id)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'badges' && (
                <div className="table-wrap orders-table-wrap">
                  <table className="table orders-table">
                    <thead>
                      <tr>
                        <th>{t('header_badge')}</th>
                        <th>{t('header_area')}</th>
                        <th>{t('header_level')}</th>
                        <th>{t('header_actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedData.length === 0 && (
                        <tr>
                          <td colSpan={4} className="empty-state orders-empty-row">{t('no_items')}</td>
                        </tr>
                      )}
                      {pagedData.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.name}</strong></td>
                          <td>{item.area || '-'}</td>
                          <td>{normalizeLevelTitle(item.level)}</td>
                          <td>{renderEstadoButtons('badge', item.id)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'consultores' && (
                <div className="table-wrap orders-table-wrap">
                  <table className="table orders-table">
                    <thead>
                      <tr>
                        <th>{t('header_consultant')}</th>
                        <th>{t('header_email')}</th>
                        <th>{t('header_points')}</th>
                        <th>{t('header_status')}</th>
                        <th>{t('header_actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedData.length === 0 && (
                        <tr>
                          <td colSpan={5} className="empty-state orders-empty-row">{t('no_items')}</td>
                        </tr>
                      )}
                      {pagedData.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="consultant-cell">
                              <img
                                src={item.avatar || '/avatars/default-avatar.svg'}
                                alt={item.name}
                                className="consultant-avatar-small"
                              />
                              <strong>{item.name}</strong>
                            </div>
                          </td>
                          <td>{item.email}</td>
                          <td>{item.points || 0}</td>
                          <td>{renderStatusBadge(item.status)}</td>
                          <td>{renderEstadoButtons('consultor', item.id)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredData.length > 0 && (
                <Pagination page={page} totalPages={totalPages} setPage={setPage} />
              )}
            </>
          )}

          {modalOpen && createPortal(
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>
                    {modalType?.includes('serviceLine') && modalType?.includes('Pendentes') && t('modal_pending_service_line')}
                    {modalType?.includes('serviceLine') && modalType?.includes('Aceites') && t('modal_accepted_service_line')}
                    {modalType?.includes('serviceLine') && modalType?.includes('Rejeitados') && t('modal_rejected_service_line')}
                    {modalType?.includes('area') && modalType?.includes('Pendentes') && t('modal_pending_area')}
                    {modalType?.includes('area') && modalType?.includes('Aceites') && t('modal_accepted_area')}
                    {modalType?.includes('area') && modalType?.includes('Rejeitados') && t('modal_rejected_area')}
                    {modalType?.includes('badge') && modalType?.includes('Pendentes') && t('modal_pending_badge')}
                    {modalType?.includes('badge') && modalType?.includes('Aceites') && t('modal_accepted_badge')}
                    {modalType?.includes('badge') && modalType?.includes('Rejeitados') && t('modal_rejected_badge')}
                    {modalType?.includes('consultor') && modalType?.includes('Pendentes') && t('modal_pending_consultant')}
                    {modalType?.includes('consultor') && modalType?.includes('Aceites') && t('modal_accepted_consultant')}
                    {modalType?.includes('consultor') && modalType?.includes('Rejeitados') && t('modal_rejected_consultant')}
                  </h2>
                  <button type="button" className="modal-close" onClick={closeModal}>
                    <X size={24} />
                  </button>
                </div>
                <div className="modal-body">
                  {modalLoading && <p>{t('loading')}</p>}
                  {!modalLoading && (
                    <div className="modal-section">
                      {Array.isArray(modalData) && modalData.length > 0 ? (
                        <table className="table orders-table">
                          <thead>
                            <tr>
                              {modalType?.includes('serviceLine') && (
                                <>
                                  <th>{t('header_id')}</th>
                                  <th>{t('header_service_line')}</th>
                                  <th>{t('header_description')}</th>
                                  <th>{t('header_date')}</th>
                                  <th>{t('header_status')}</th>
                                  <th>{t('header_actions')}</th>
                                </>
                              )}
                              {modalType?.includes('area') && (
                                <>
                                  <th>{t('header_id')}</th>
                                  <th>{t('header_area')}</th>
                                  <th>{t('header_badge')}</th>
                                  <th>{t('header_consultant')}</th>
                                  <th>{t('header_date')}</th>
                                  <th>{t('header_status')}</th>
                                  <th>{t('header_actions')}</th>
                                </>
                              )}
                              {modalType?.includes('badge') && (
                                <>
                                  <th>{t('header_id')}</th>
                                  <th>{t('header_badge')}</th>
                                  <th>{t('header_consultant')}</th>
                                  <th>{t('header_date')}</th>
                                  <th>{t('header_status')}</th>
                                  <th>{t('header_actions')}</th>
                                </>
                              )}
                              {modalType?.includes('consultor') && (
                                <>
                                  <th>{t('header_id')}</th>
                                  <th>{t('header_consultant')}</th>
                                  <th>{t('header_badge')}</th>
                                  <th>{t('header_date')}</th>
                                  <th>{t('header_status')}</th>
                                  <th>{t('header_actions')}</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {modalData.map((item) => (
                              <tr key={item.id}>
                                {modalType?.includes('serviceLine') && (
                                  <>
                                    <td>{item.id}</td>
                                    <td>{item.name}</td>
                                    <td>{item.descricao}</td>
                                    <td>{item.data}</td>
                                    <td>{renderStatusBadge(item.estado)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className="action-btn tm-export-control-btn historico-action-btn"
                                        onClick={() => openHistoricoCandidatura(item.id)}
                                      >
                                        <Clock3 size={16} />
                                        {t('ver_historico')}
                                      </button>
                                    </td>
                                  </>
                                )}
                                {modalType?.includes('area') && (
                                  <>
                                    <td>{item.id}</td>
                                    <td>{item.name}</td>
                                    <td>{item.badge}</td>
                                    <td>{item.consultor}</td>
                                    <td>{item.data}</td>
                                    <td>{renderStatusBadge(item.estado)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className="action-btn tm-export-control-btn historico-action-btn"
                                        onClick={() => openHistoricoCandidatura(item.id)}
                                      >
                                        <Clock3 size={16} />
                                        {t('ver_historico')}
                                      </button>
                                    </td>
                                  </>
                                )}
                                {modalType?.includes('badge') && (
                                  <>
                                    <td>{item.id}</td>
                                    <td>{item.name}</td>
                                    <td>{item.consultor}</td>
                                    <td>{item.data}</td>
                                    <td>{renderStatusBadge(item.estado)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className="action-btn tm-export-control-btn historico-action-btn"
                                        onClick={() => openHistoricoCandidatura(item.id)}
                                      >
                                        <Clock3 size={16} />
                                        {t('ver_historico')}
                                      </button>
                                    </td>
                                  </>
                                )}
                                {modalType?.includes('consultor') && (
                                  <>
                                    <td>{item.id}</td>
                                    <td>{item.name}</td>
                                    <td>{item.badge}</td>
                                    <td>{item.data}</td>
                                    <td>{renderStatusBadge(item.estado)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className="action-btn tm-export-control-btn historico-action-btn"
                                        onClick={() => openHistoricoCandidatura(item.id)}
                                      >
                                        <Clock3 size={16} />
                                        {t('ver_historico')}
                                      </button>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>{t('no_items')}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}

          {historicoOpen && createPortal(
            <div className="modal-overlay" onClick={closeHistorico}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{t('historico_candidatura')} #{historicoPedidoId}</h2>
                  <button type="button" className="modal-close" onClick={closeHistorico}>
                    <X size={24} />
                  </button>
                </div>
                <div className="modal-body">
                  {historicoLoading && <p>{t('loading')}</p>}
                  {!historicoLoading && (
                    <div className="modal-section">
                      {historicoData.length > 0 ? (
                        <div className="candidacy-timeline">
                          {historicoData.map((entry, idx) => (
                            <div key={entry.id || idx} className="candidacy-timeline-entry">
                              <div className="candidacy-timeline-dot" />
                              <div className="candidacy-timeline-content">
                                <p><strong>{t(`estado_${entry.estado}`)}</strong></p>
                                <p>{t('by')}: {entry.utilizadorNome}</p>
                                <p>{t('date')}: {entry.dataEstado ? new Date(entry.dataEstado).toLocaleString() : '-'}</p>
                                {entry.descricao && <p>{translateDescription(entry.descricao)}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>{t('no_items')}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </Layout>
  );
}

export default HistoricoTM;
