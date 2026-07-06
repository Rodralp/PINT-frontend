import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { Search, Eye, X } from 'lucide-react';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  fetchHistoricoAreasSLL,
  fetchHistoricoBadgesSLL,
  fetchHistoricoConsultoresSLL,
  fetchDetalhesConsultorSLL,
  fetchDetalhesBadgeSLL,
  fetchHistoricoPorEstado,
} from '../../services/serviceLineLeaderService';
import '../../css/TalentManager/Exportacoes_TM.css';
import '../../css/TalentManager/historico-actions.css';
import '../../css/Shared/HistoricoPages.css';

const ITEMS_PER_PAGE = 10;

const getStoredLoginData = () => {
  const storedLoginData = sessionStorage.getItem('loginData') || localStorage.getItem('loginData');
  if (!storedLoginData) return null;
  try {
    return JSON.parse(storedLoginData);
  } catch {
    return null;
  }
};

const normalizeLevelTitle = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '-';
  }

  if (raw.includes(' - ')) {
    const suffix = raw.split(' - ').slice(1).join(' - ').trim();
    if (suffix) {
      return suffix;
    }
  }

  return raw.replace(/^nivel\s+/i, '').trim() || raw;
};

function HistoricoSLL() {
  const { t } = useTranslation();

  const tabs = useMemo(() => [
    { id: 'minha-sl', label: t('historico_tab_my_sl') },
    { id: 'badges', label: t('historico_tab_badges') },
    { id: 'consultores', label: t('historico_tab_consultants') },
  ], [t]);

  const loginData = useMemo(() => getStoredLoginData(), []);
  const [activeTab, setActiveTab] = useState('minha-sl');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [serviceLineData, setServiceLineData] = useState(null);
  const [areas, setAreas] = useState([]);
  const [badges, setBadges] = useState([]);
  const [consultores, setConsultores] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const accountId = Number(loginData?.id);
      if (!Number.isInteger(accountId) || accountId <= 0) {
        setErrorMessage(t('error_generic'));
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const [slData, bData, cData] = await Promise.all([
          fetchHistoricoAreasSLL(accountId).catch(() => ({ serviceLine: null, areas: [] })),
          fetchHistoricoBadgesSLL(accountId).catch(() => []),
          fetchHistoricoConsultoresSLL(accountId).catch(() => []),
        ]);

        // Debug logging
        console.log('Service Line Data:', slData);
        console.log('Badges Data:', bData);
        console.log('Consultores Data:', cData);

        if (isMounted) {
          setServiceLineData(slData?.serviceLine || null);
          setAreas(Array.isArray(slData?.areas) ? slData.areas : []);
          setBadges(Array.isArray(bData) ? bData : []);
          setConsultores(Array.isArray(cData) ? cData : []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
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

    return () => {
      isMounted = false;
    };
  }, [loginData]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (activeTab === 'minha-sl') {
      return areas.filter((item) => item.name?.toLowerCase().includes(query));
    }

    if (activeTab === 'badges') {
      return badges.filter((item) =>
        item.name?.toLowerCase().includes(query)
        || item.area?.toLowerCase().includes(query)
        || item.level?.toLowerCase().includes(query),
      );
    }

    if (activeTab === 'consultores') {
      return consultores.filter((item) =>
        item.name?.toLowerCase().includes(query)
        || item.email?.toLowerCase().includes(query),
      );
    }

    return [];
  }, [activeTab, searchQuery, areas, badges, consultores]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const pagedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [filteredData, page]);

  const openModal = async (type, id) => {
    const accountId = Number(loginData?.id);
    if (!Number.isInteger(accountId) || accountId <= 0) return;

    console.log(`Opening modal: type=${type}, id=${id}, accountId=${accountId}`);
    
    setModalType(type);
    setModalOpen(true);
    setModalLoading(true);

    try {
      let data;
      if (type === 'consultor') {
        console.log('Fetching consultant details...');
        data = await fetchDetalhesConsultorSLL(accountId, id);
      } else if (type === 'badge') {
        console.log('Fetching badge details...');
        data = await fetchDetalhesBadgeSLL(accountId, id);
      } else if (type.includes('Pendentes')) {
        console.log('Fetching pending items...');
        data = await fetchHistoricoPorEstado(accountId, type, 'pendente', id);
      } else if (type.includes('Aceites')) {
        console.log('Fetching accepted items...');
        data = await fetchHistoricoPorEstado(accountId, type, 'aceite', id);
      } else if (type.includes('Rejeitados')) {
        console.log('Fetching rejected items...');
        data = await fetchHistoricoPorEstado(accountId, type, 'rejeitado', id);
      }
      
      console.log('Modal data received:', data);
      setModalData(data);
    } catch (error) {
      console.error('Error fetching modal data:', error);
      setModalData(null);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalData(null);
  };

  const renderStatusBadge = (status) => {
    const statusClasses = {
      completo: 'status-badge success',
      'a-fazer': 'status-badge warning',
      pendente: 'status-badge warning',
      ativo: 'status-badge success',
      inativo: 'status-badge danger',
      rejeitado: 'status-badge danger',
    };
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const mappedStatus = ['pendente-tm', 'pendente-sll'].includes(normalizedStatus)
      ? 'pendente'
      : normalizedStatus;
    const className = statusClasses[mappedStatus] || 'status-badge';
    return <span className={className}>{mappedStatus || '-'}</span>;
  };

  return (
    <Layout>
      <div className="page tm-export-page historico-page">
        <header className="page-header tm-export-header">
          <h1>{t('historico_title_sll')}</h1>
        </header>

        <p className="tm-export-scope-note">
          {t('historico_scope_sll')}
        </p>

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

          {activeTab !== 'minha-sl' && (
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
              {activeTab === 'minha-sl' && (
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
                        {!serviceLineData && (
                          <tr>
                            <td colSpan={4} className="empty-state orders-empty-row">{t('no_service_line')}</td>
                          </tr>
                        )}
                        {serviceLineData && (
                          <tr>
                            <td><strong>{serviceLineData.name}</strong></td>
                            <td>{serviceLineData.totalBadges || 0}</td>
                            <td>{serviceLineData.totalConsultores || 0}</td>
                            <td>
                              <div className="historico-actions-group">
                                <button
                                  type="button"
                                  className="action-btn tm-export-control-btn historico-action-btn"
                                  onClick={() => openModal('serviceLinePendentes', serviceLineData.id)}
                                >
                                  <Eye size={16} />
                                  {t('ver_pendentes')}
                                </button>
                                <button
                                  type="button"
                                  className="action-btn tm-export-control-btn historico-action-btn"
                                  onClick={() => openModal('serviceLineAceites', serviceLineData.id)}
                                >
                                  <Eye size={16} />
                                  {t('ver_aceites')}
                                </button>
                                <button
                                  type="button"
                                  className="action-btn tm-export-control-btn historico-action-btn"
                                  onClick={() => openModal('serviceLineRejeitados', serviceLineData.id)}
                                >
                                  <Eye size={16} />
                                  {t('ver_rejeitados')}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

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
                        {pagedData.length === 0 && (
                          <tr>
                            <td colSpan={3} className="empty-state orders-empty-row">{t('no_items')}</td>
                          </tr>
                        )}
                        {pagedData.map((item) => (
                          <tr key={item.id}>
                            <td><strong>{item.name}</strong></td>
                            <td>{item.totalBadges || 0}</td>
                            <td>
                              <div className="historico-actions-group">
                                <button
                                  type="button"
                                  className="action-btn tm-export-control-btn historico-action-btn"
                                  onClick={() => openModal('areaPendentes', item.id)}
                                >
                                  <Eye size={16} />
                                  {t('ver_pendentes')}
                                </button>
                                <button
                                  type="button"
                                  className="action-btn tm-export-control-btn historico-action-btn"
                                  onClick={() => openModal('areaAceites', item.id)}
                                >
                                  <Eye size={16} />
                                  {t('ver_aceites')}
                                </button>
                                <button
                                  type="button"
                                  className="action-btn tm-export-control-btn historico-action-btn"
                                  onClick={() => openModal('areaRejeitados', item.id)}
                                >
                                  <Eye size={16} />
                                  {t('ver_rejeitados')}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                          <td>
                            <div className="historico-actions-group">
                              <button
                                type="button"
                                className="action-btn tm-export-control-btn historico-action-btn"
                                onClick={() => openModal('badgePendentes', item.id)}
                              >
                                <Eye size={16} />
                                {t('ver_pendentes')}
                              </button>
                              <button
                                type="button"
                                className="action-btn tm-export-control-btn historico-action-btn"
                                onClick={() => openModal('badgeAceites', item.id)}
                              >
                                <Eye size={16} />
                                {t('ver_aceites')}
                              </button>
                              <button
                                type="button"
                                className="action-btn tm-export-control-btn historico-action-btn"
                                onClick={() => openModal('badgeRejeitados', item.id)}
                              >
                                <Eye size={16} />
                                {t('ver_rejeitados')}
                              </button>
                            </div>
                          </td>
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
                                src={item.avatar || `/avatars/default-avatar.svg`}
                                alt={item.name}
                                className="consultant-avatar-small"
                              />
                              <strong>{item.name}</strong>
                            </div>
                          </td>
                          <td>{item.email}</td>
                          <td>{item.points || 0}</td>
                          <td>{renderStatusBadge(item.status)}</td>
                          <td>
                            <div className="historico-actions-group">
                              <button
                                type="button"
                                className="action-btn tm-export-control-btn historico-action-btn"
                                onClick={() => openModal('consultorPendentes', item.id)}
                              >
                                <Eye size={16} />
                                {t('ver_pendentes')}
                              </button>
                              <button
                                type="button"
                                className="action-btn tm-export-control-btn historico-action-btn"
                                onClick={() => openModal('consultorAceites', item.id)}
                              >
                                <Eye size={16} />
                                {t('ver_aceites')}
                              </button>
                              <button
                                type="button"
                                className="action-btn tm-export-control-btn historico-action-btn"
                                onClick={() => openModal('consultorRejeitados', item.id)}
                              >
                                <Eye size={16} />
                                {t('ver_rejeitados')}
                              </button>
                            </div>
                          </td>
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
                    {modalType === 'consultor' && t('modal_consultant_details')}
                    {modalType === 'badge' && t('modal_badge_details')}
                    {modalType.includes('serviceLine') && modalType.includes('Pendentes') && t('modal_pending_service_line')}
                    {modalType.includes('serviceLine') && modalType.includes('Aceites') && t('modal_accepted_service_line')}
                    {modalType.includes('serviceLine') && modalType.includes('Rejeitados') && t('modal_rejected_service_line')}
                    {modalType.includes('area') && modalType.includes('Pendentes') && t('modal_pending_area')}
                    {modalType.includes('area') && modalType.includes('Aceites') && t('modal_accepted_area')}
                    {modalType.includes('area') && modalType.includes('Rejeitados') && t('modal_rejected_area')}
                    {modalType.includes('badge') && modalType.includes('Pendentes') && t('modal_pending_badge')}
                    {modalType.includes('badge') && modalType.includes('Aceites') && t('modal_accepted_badge')}
                    {modalType.includes('badge') && modalType.includes('Rejeitados') && t('modal_rejected_badge')}
                    {modalType.includes('consultor') && modalType.includes('Pendentes') && t('modal_pending_consultant')}
                    {modalType.includes('consultor') && modalType.includes('Aceites') && t('modal_accepted_consultant')}
                    {modalType.includes('consultor') && modalType.includes('Rejeitados') && t('modal_rejected_consultant')}
                  </h2>
                  <button type="button" className="modal-close" onClick={closeModal}>
                    <X size={24} />
                  </button>
                </div>
                <div className="modal-body">
                  {modalLoading && <p>{t('loading')}</p>}
                  {!modalLoading && modalData && (
                    <>
                      {modalType === 'consultor' && modalData.consultor && (
                        <div className="modal-section">
                          <div className="modal-info">
                            <h3>{modalData.consultor.name}</h3>
                            <p>{modalData.consultor.email}</p>
                            <p><strong>{t('total_points')}:</strong> {modalData.consultor.totalPoints}</p>
                          </div>
                          <h4>{t('badges_obtained')} ({modalData.badgesObtidos?.length || 0})</h4>
                          {modalData.badgesObtidos?.length > 0 ? (
                            <table className="table orders-table">
                              <thead>
                                <tr>
                                  <th>{t('header_badge')}</th>
                                   <th>{t('header_area')}</th>
                                   <th>{t('header_service_line')}</th>
                                   <th>{t('header_points')}</th>
                                   <th>{t('header_date')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {modalData.badgesObtidos.map((badge) => (
                                  <tr key={badge.id}>
                                    <td>{badge.name}</td>
                                    <td>{badge.areaName || '-'}</td>
                                    <td>{badge.serviceLineName || '-'}</td>
                                    <td>{badge.points}</td>
                                    <td>{badge.obtainedDate ? new Date(badge.obtainedDate).toLocaleDateString() : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>{t('no_items')}</p>
                          )}
                          <h4 style={{ marginTop: '20px' }}>{t('badges_in_progress')} ({modalData.badgesEmProgresso?.length || 0})</h4>
                          {modalData.badgesEmProgresso?.length > 0 ? (
                            <table className="table orders-table">
                              <thead>
                                <tr>
                                  <th>{t('header_badge')}</th>
                                   <th>{t('header_area')}</th>
                                   <th>{t('header_service_line')}</th>
                                   <th>{t('header_status')}</th>
                                   <th>{t('header_request_date')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {modalData.badgesEmProgresso.map((badge) => (
                                  <tr key={badge.id}>
                                    <td>{badge.name}</td>
                                    <td>{badge.areaName || '-'}</td>
                                    <td>{badge.serviceLineName || '-'}</td>
                                    <td>{renderStatusBadge(badge.status)}</td>
                                    <td>{badge.requestDate ? new Date(badge.requestDate).toLocaleDateString() : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>{t('no_items')}</p>
                          )}
                        </div>
                      )}

                      {modalType === 'badge' && modalData.badge && (
                        <div className="modal-section">
                          <div className="modal-info">
                            <h3>{modalData.badge.name}</h3>
                            <p><strong>{t('header_area')}:</strong> {modalData.badge.areaName || '-'}</p>
                             <p><strong>{t('header_service_line')}:</strong> {modalData.badge.serviceLineName || '-'}</p>
                             <p><strong>{t('header_level')}:</strong> {normalizeLevelTitle(modalData.badge.level)}</p>
                             <p><strong>{t('header_points')}:</strong> {modalData.badge.points}</p>
                          </div>
                          <h4>{t('consultants_obtained')} ({modalData.totalObtidos})</h4>
                          {modalData.consultoresObtidos?.length > 0 ? (
                            <table className="table orders-table">
                              <thead>
                                <tr>
                                  <th>{t('header_consultant')}</th>
                                   <th>{t('header_email')}</th>
                                   <th>{t('header_date')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {modalData.consultoresObtidos.map((c) => (
                                  <tr key={c.id}>
                                    <td>{c.name}</td>
                                    <td>{c.email}</td>
                                    <td>{c.obtainedDate ? new Date(c.obtainedDate).toLocaleDateString() : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>{t('no_consultants_obtained')}</p>
                          )}
                          <h4 style={{ marginTop: '20px' }}>{t('consultants_in_progress')} ({modalData.totalEmProgresso})</h4>
                          {modalData.consultoresEmProgresso?.length > 0 ? (
                            <table className="table orders-table">
                              <thead>
                                <tr>
                                  <th>{t('header_consultant')}</th>
                                   <th>{t('header_email')}</th>
                                   <th>{t('header_status')}</th>
                                   <th>{t('header_request_date')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {modalData.consultoresEmProgresso.map((c) => (
                                  <tr key={c.id}>
                                    <td>{c.name}</td>
                                    <td>{c.email}</td>
                                    <td>{renderStatusBadge(c.status)}</td>
                                    <td>{c.requestDate ? new Date(c.requestDate).toLocaleDateString() : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>{t('no_consultants_in_progress')}</p>
                          )}
                        </div>
                      )}

                      {/* Novos modais para Pendentes/Aceites/Rejeitados */}
                      {(modalType.includes('Pendentes') || modalType.includes('Aceites') || modalType.includes('Rejeitados')) && (
                        <div className="modal-section">
                          {Array.isArray(modalData) && modalData.length > 0 ? (
                            <table className="table orders-table">
                              <thead>
                                <tr>
                                  {modalType.includes('serviceLine') && (
                                    <>
                                      <th>{t('header_id')}</th>
                                      <th>{t('header_service_line')}</th>
                                      <th>{t('header_description')}</th>
                                      <th>{t('header_date')}</th>
                                      <th>{t('header_status')}</th>
                                    </>
                                  )}
                                  {modalType.includes('area') && (
                                    <>
                                      <th>{t('header_id')}</th>
                                      <th>{t('header_area')}</th>
                                      <th>{t('header_badge')}</th>
                                      <th>{t('header_consultant')}</th>
                                      <th>{t('header_date')}</th>
                                      <th>{t('header_status')}</th>
                                    </>
                                  )}
                                  {modalType.includes('badge') && (
                                    <>
                                      <th>{t('header_id')}</th>
                                      <th>{t('header_badge')}</th>
                                      <th>{t('header_consultant')}</th>
                                      <th>{t('header_date')}</th>
                                      <th>{t('header_status')}</th>
                                    </>
                                  )}
                                  {modalType.includes('consultor') && (
                                    <>
                                      <th>{t('header_id')}</th>
                                      <th>{t('header_consultant')}</th>
                                      <th>{t('header_badge')}</th>
                                      <th>{t('header_date')}</th>
                                      <th>{t('header_status')}</th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {modalData.map((item) => (
                                  <tr key={item.id}>
                                    {modalType.includes('serviceLine') && (
                                      <>
                                        <td>{item.id}</td>
                                        <td>{item.name}</td>
                                        <td>{item.descricao}</td>
                                        <td>{item.data}</td>
                                        <td>{renderStatusBadge(item.estado)}</td>
                                      </>
                                    )}
                                    {modalType.includes('area') && (
                                      <>
                                        <td>{item.id}</td>
                                        <td>{item.name}</td>
                                        <td>{item.badge}</td>
                                        <td>{item.consultor}</td>
                                        <td>{item.data}</td>
                                        <td>{renderStatusBadge(item.estado)}</td>
                                      </>
                                    )}
                                    {modalType.includes('badge') && (
                                      <>
                                        <td>{item.id}</td>
                                        <td>{item.name}</td>
                                        <td>{item.consultor}</td>
                                        <td>{item.data}</td>
                                        <td>{renderStatusBadge(item.estado)}</td>
                                      </>
                                    )}
                                    {modalType.includes('consultor') && (
                                      <>
                                        <td>{item.id}</td>
                                        <td>{item.name}</td>
                                        <td>{item.badge}</td>
                                        <td>{item.data}</td>
                                        <td>{renderStatusBadge(item.estado)}</td>
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
                    </>
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

export default HistoricoSLL;
