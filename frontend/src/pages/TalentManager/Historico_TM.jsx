import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Search, Eye, X } from 'lucide-react';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  fetchHistoricoServiceLines,
  fetchHistoricoBadges,
  fetchHistoricoConsultores,
  fetchDetalhesConsultor,
  fetchDetalhesBadge,
  fetchDetalhesServiceLine,
} from '../../services/talentManagerService';
import '../../css/TalentManager/Exportacoes_TM.css';
import '../../css/Shared/HistoricoPages.css';

const ITEMS_PER_PAGE = 10;

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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

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

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (activeTab === 'service-lines') {
      return serviceLines.filter((item) =>
        item.name?.toLowerCase().includes(query));
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
    const end = start + ITEMS_PER_PAGE;
    return filteredData.slice(start, end);
  }, [filteredData, page]);

  const openModal = async (type, id) => {
    setModalType(type);
    setModalOpen(true);
    setModalLoading(true);

    try {
      let data;
      if (type === 'consultor') {
        data = await fetchDetalhesConsultor(id);
      } else if (type === 'badge') {
        data = await fetchDetalhesBadge(id);
      } else if (type === 'serviceLine') {
        data = await fetchDetalhesServiceLine(id);
      }
      setModalData(data);
    } catch {
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
      <div className="page historico-page">
        <header className="page-header">
          <h1>{t('historico_title_tm')}</h1>
        </header>

        <div className="shell">
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

          <div className="toolbar tm-export-toolbar">
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

          {isLoading && <LoadingSpinner message={t('loading')} />}
          {errorMessage && <p className="lp-progress-label">{errorMessage}</p>}

          {!isLoading && !errorMessage && (
            <>
              {activeTab === 'service-lines' && (
                <div className="table-wrap orders-table-wrap">
                  <table className="table orders-table">
                    <thead>
                      <tr>
                        <th>{t('service_line')}</th>
                        <th>{t('badges')}</th>
                        <th>{t('obtained_badges')}</th>
                        <th>{t('dashboard_in_progress')}</th>
                        <th>{t('total_consultors')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedData.length === 0 && (
                        <tr>
                          <td colSpan={6} className="empty-state orders-empty-row">{t('no_items')}</td>
                        </tr>
                      )}
                      {pagedData.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.name}</strong></td>
                          <td>{item.totalBadges || 0}</td>
                          <td>{item.obtidas || 0}</td>
                          <td>{item.emProgresso || 0}</td>
                          <td>{item.totalConsultores || 0}</td>
                          <td>
                            <button
                              type="button"
                              className="action-btn tm-export-control-btn historico-action-btn"
                              onClick={() => openModal('serviceLine', item.id)}
                            >
                              <Eye size={16} />
                              {t('notifications_view_button')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'badges' && (
                <div className="table-wrap orders-table-wrap">
                  <table className="table orders-table">
                    <thead>
                      <tr>
                        <th>{t('badge')}</th>
                        <th>{t('area')}</th>
                        <th>{t('level')}</th>
                        <th>{t('total_consultors')}</th>
                        <th>{t('dashboard_in_progress')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedData.length === 0 && (
                        <tr>
                          <td colSpan={6} className="empty-state orders-empty-row">{t('no_badges_found')}</td>
                        </tr>
                      )}
                      {pagedData.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.name}</strong></td>
                          <td>{item.area || '-'}</td>
                          <td>{normalizeLevelTitle(item.level)}</td>
                          <td>{item.consultoresObtidos || 0}</td>
                          <td>{item.emProgresso || 0}</td>
                          <td>
                            <button
                              type="button"
                              className="action-btn tm-export-control-btn historico-action-btn"
                              onClick={() => openModal('badge', item.id)}
                            >
                              <Eye size={16} />
                              {t('notifications_view_button')}
                            </button>
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
                        <th>{t('users_role_consultor')}</th>
                        <th>{t('email_label')}</th>
                        <th>{t('points_label')}</th>
                        <th>{t('obtained_badges')}</th>
                        <th>{t('dashboard_in_progress')}</th>
                        <th>{t('status')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedData.length === 0 && (
                        <tr>
                          <td colSpan={7} className="empty-state orders-empty-row">{t('dashboard_no_consultor_data')}</td>
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
                          <td>{item.badgesObtidas || 0}</td>
                          <td>{item.badgesEmProgresso || 0}</td>
                          <td>{renderStatusBadge(item.status)}</td>
                          <td>
                            <button
                              type="button"
                              className="action-btn tm-export-control-btn historico-action-btn"
                              onClick={() => openModal('consultor', item.id)}
                            >
                              <Eye size={16} />
                              {t('notifications_view_button')}
                            </button>
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
                    {modalType === 'consultor' && t('details')}
                    {modalType === 'badge' && t('details')}
                    {modalType === 'serviceLine' && t('details')}
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
                            <p><strong>{t('points_label')}:</strong> {modalData.consultor.totalPoints}</p>
                          </div>
                          <h4>{t('obtained_badges')} ({modalData.badgesObtidos?.length || 0})</h4>
                          {modalData.badgesObtidos?.length > 0 ? (
                            <table className="table orders-table">
                              <thead>
                                <tr>
                                  <th>{t('badge')}</th>
                                  <th>{t('area')}</th>
                                  <th>{t('service_line')}</th>
                                  <th>{t('points_label')}</th>
                                  <th>{t('date')}</th>
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
                            <p>{t('no_badges_obtained')}</p>
                          )}
                          <h4 style={{ marginTop: '20px' }}>{t('dashboard_in_progress')} ({modalData.badgesEmProgresso?.length || 0})</h4>
                          {modalData.badgesEmProgresso?.length > 0 ? (
                            <table className="table orders-table">
                              <thead>
                                <tr>
                                  <th>{t('badge')}</th>
                                  <th>{t('area')}</th>
                                  <th>{t('service_line')}</th>
                                  <th>{t('status')}</th>
                                  <th>{t('date')}</th>
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
                            <p><strong>{t('area')}:</strong> {modalData.badge.areaName || '-'}</p>
                            <p><strong>{t('service_line')}:</strong> {modalData.badge.serviceLineName || '-'}</p>
                            <p><strong>{t('level')}:</strong> {normalizeLevelTitle(modalData.badge.level)}</p>
                            <p><strong>{t('points_label')}:</strong> {modalData.badge.points}</p>
                          </div>
                          <h4>{t('total_consultors')} ({modalData.totalObtidos})</h4>
                          {modalData.consultoresObtidos?.length > 0 ? (
                            <table className="table orders-table">
                              <thead>
                                <tr>
                                  <th>{t('users_role_consultor')}</th>
                                  <th>{t('service_line')}</th>
                                  <th>{t('date')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {modalData.consultoresObtidos.map((c) => (
                                  <tr key={c.id}>
                                    <td>{c.name}</td>
                                    <td>{c.serviceLineName || '-'}</td>
                                    <td>{c.obtainedDate ? new Date(c.obtainedDate).toLocaleDateString() : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>{t('dashboard_no_consultor_data')}</p>
                          )}
                          <h4 style={{ marginTop: '20px' }}>{t('dashboard_in_progress')} ({modalData.totalEmProgresso})</h4>
                          {modalData.consultoresEmProgresso?.length > 0 ? (
                            <table className="table orders-table">
                              <thead>
                                <tr>
                                  <th>{t('users_role_consultor')}</th>
                                  <th>{t('service_line')}</th>
                                  <th>{t('status')}</th>
                                  <th>{t('date')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {modalData.consultoresEmProgresso.map((c) => (
                                  <tr key={c.id}>
                                    <td>{c.name}</td>
                                    <td>{c.serviceLineName || '-'}</td>
                                    <td>{renderStatusBadge(c.status)}</td>
                                    <td>{c.requestDate ? new Date(c.requestDate).toLocaleDateString() : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>{t('dashboard_no_consultor_data')}</p>
                          )}
                        </div>
                      )}

                      {modalType === 'serviceLine' && modalData.serviceLine && (
                        <div className="modal-section">
                          <div className="modal-info">
                            <h3>{modalData.serviceLine.name}</h3>
                            <p><strong>{t('badges')}:</strong> {modalData.serviceLine.totalBadges}</p>
                            <p><strong>{t('obtained_badges')}:</strong> {modalData.serviceLine.obtidas}</p>
                            <p><strong>{t('dashboard_in_progress')}:</strong> {modalData.serviceLine.emProgresso}</p>
                            <p><strong>{t('total_consultors')}:</strong> {modalData.serviceLine.totalConsultores}</p>
                          </div>
                          <h4>{t('area')}</h4>
                          {modalData.areas?.length > 0 ? (
                            <table className="table orders-table">
                              <thead>
                                <tr>
                                  <th>{t('area')}</th>
                                  <th>{t('badges')}</th>
                                  <th>{t('obtained_badges')}</th>
                                  <th>{t('dashboard_in_progress')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {modalData.areas.map((area) => (
                                  <tr key={area.id}>
                                    <td>{area.name}</td>
                                    <td>{area.totalBadges || 0}</td>
                                    <td>{area.obtidas || 0}</td>
                                    <td>{area.emProgresso || 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>{t('no_items')}</p>
                          )}
                          <h4 style={{ marginTop: '20px' }}>{t('total_consultors')} ({modalData.consultores?.length || 0})</h4>
                          {modalData.consultores?.length > 0 ? (
                            <table className="table orders-table">
                              <thead>
                                <tr>
                                  <th>{t('users_role_consultor')}</th>
                                  <th>{t('email_label')}</th>
                                  <th>{t('points_label')}</th>
                                  <th>{t('obtained_badges')}</th>
                                  <th>{t('dashboard_in_progress')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {modalData.consultores.map((c) => (
                                  <tr key={c.id}>
                                    <td>{c.name}</td>
                                    <td>{c.email}</td>
                                    <td>{c.points || 0}</td>
                                    <td>{c.badgesObtidas || 0}</td>
                                    <td>{c.badgesEmProgresso || 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>{t('dashboard_no_consultor_data')}</p>
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

export default HistoricoTM;
