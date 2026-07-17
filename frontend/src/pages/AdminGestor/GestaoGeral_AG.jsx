import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import Layout from '../../components/Layout';
import {
  fetchAdminGeneralManagement,
  updateAdminNotificationSettings,
  updateAdminRgpdTopics,
} from '../../services/adminGeneralManagementService';
import '../../css/AdminGestor/GestaoGeral_AG.css';

const tabs = [
  { id: 'notificacoes', labelKey: 'gestao_geral_tab_notifications' },
  { id: 'rgpd', labelKey: 'gestao_geral_tab_rgpd' },
];

const initialNotificationRows = [
  {
    id: 1,
    event: 'Novo registo',
    admin: true,
    sll: true,
    tl: false,
    consultor: false,
    email: true,
    hasEmail: true,
    webApp: true,
  },
  {
    id: 2,
    event: 'Alteração de permissões',
    admin: true,
    sll: true,
    tl: true,
    consultor: true,
    email: true,
    hasEmail: false,
    webApp: true,
  },
  {
    id: 3,
    event: 'Recebe badge',
    admin: false,
    sll: false,
    tl: false,
    consultor: true,
    email: true,
    hasEmail: false,
    webApp: true,
  },
  {
    id: 4,
    event: 'Mudança de credenciais',
    admin: false,
    sll: true,
    tl: true,
    consultor: false,
    email: true,
    hasEmail: false,
    webApp: false,
  },
  {
    id: 5,
    event: 'Pedido aprovado',
    admin: true,
    sll: true,
    tl: true,
    consultor: true,
    email: true,
    hasEmail: true,
    webApp: true,
  },
  {
    id: 6,
    event: 'Pedido rejeitado',
    admin: true,
    sll: true,
    tl: true,
    consultor: true,
    email: true,
    hasEmail: true,
    webApp: true,
  },
  {
    id: 7,
    event: 'Badge a expirar',
    admin: false,
    sll: false,
    tl: false,
    consultor: true,
    email: false,
    hasEmail: false,
    webApp: true,
  },
  {
    id: 8,
    event: 'Badge expirada',
    admin: true,
    sll: true,
    tl: true,
    consultor: true,
    email: false,
    hasEmail: false,
    webApp: true,
  },
];

const rgpdTopics = [
  {
    id: 1,
    title: 'Informações Gerais',
    body:
      'A empresa compromete-se a garantir a privacidade e a proteção dos dados pessoais de todos os utilizadores do website. Esta política explica como recolhemos, utilizamos e protegemos os dados, em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).',
  },
  {
    id: 2,
    title: 'Responsável pelo Tratamento',
    body:
      'A entidade responsável pela recolha e tratamento dos seus dados pessoais é:\n• Nome: Empresa\n• NIF: NIF\n• Sede: Morada da Empresa\n• Contacto: Email de Contacto da Empresa',
  },
  {
    id: 3,
    title: 'Recolha e Finalidade dos Dados',
    body:
      'Recolhemos dados apenas quando necessário para as seguintes finalidades:\n• Formulários de contacto\n• Newsletter (mediante consentimento)\n• Cookies para melhoria da experiência e análise estatística',
  },
  {
    id: 4,
    title: 'Direitos do Utilizador',
    body:
      'De acordo com o RGPD, o utilizador tem o direito de:\n1. Acesso aos dados guardados\n2. Retificação de dados incorretos\n3. Esquecimento (eliminação dos dados)\n4. Oposição ao tratamento para marketing',
  },
  {
    id: 5,
    title: 'Conservação de Dados',
    body:
      'Os dados pessoais são conservados apenas pelo período necessário para cumprir as finalidades descritas, ou durante o tempo exigido por obrigações legais.',
  },
];

function GestaoGeralAG() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('notificacoes');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationRows, setNotificationRows] = useState([]);
  const [rgpdRows, setRgpdRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const isMountedRef = useRef(false);

  const loadGeneralManagement = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchAdminGeneralManagement();

      if (!isMountedRef.current) {
        return;
      }

      setNotificationRows(
        Array.isArray(data?.notifications) && data.notifications.length > 0
          ? data.notifications
          : initialNotificationRows,
      );
      setRgpdRows(
        Array.isArray(data?.rgpd) && data.rgpd.length > 0
          ? data.rgpd
          : rgpdTopics,
      );
      setStatusMessage('');
      setErrorMessage('');
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setNotificationRows(initialNotificationRows);
      setRgpdRows(rgpdTopics);
      setErrorMessage(error?.message || t('gestao_geral_load_error'));
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    isMountedRef.current = true;
    loadGeneralManagement();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadGeneralManagement]);

  const filteredNotificationRows = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return notificationRows;
    }

    return notificationRows.filter((item) => item.event.toLowerCase().includes(normalizedTerm));
  }, [notificationRows, searchTerm]);

  const filteredRgpdTopics = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return rgpdRows;
    }

    return rgpdRows.filter(
      (item) => item.title.toLowerCase().includes(normalizedTerm) || item.body.toLowerCase().includes(normalizedTerm),
    );
  }, [rgpdRows, searchTerm]);

  const searchPlaceholder =
    activeTab === 'rgpd' ? t('gestao_geral_search_topic') : t('gestao_geral_search_event');

  const toggleNotificationColumn = (rowId, columnKey) => {
    setNotificationRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [columnKey]: !row[columnKey] } : row)),
    );
  };

  const updateRgpdField = (rowId, field, value) => {
    setRgpdRows((current) => current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const handleCancelChanges = () => {
    setStatusMessage('');
    setErrorMessage('');
    loadGeneralManagement();
  };

  const handleApplyChanges = async () => {
    setIsSaving(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      if (activeTab === 'notificacoes') {
        const data = await updateAdminNotificationSettings(notificationRows);
        if (Array.isArray(data?.notifications)) {
          setNotificationRows(data.notifications);
        }
      } else if (activeTab === 'rgpd') {
        const data = await updateAdminRgpdTopics(rgpdRows);
        if (Array.isArray(data?.rgpd)) {
          setRgpdRows(data.rgpd);
        }
      }

      setStatusMessage(t('gestao_geral_success'));
    } catch (error) {
      setErrorMessage(error?.message || t('gestao_geral_error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="page">
        <header className="page-header">
          <h1>{t('gestao_geral_title')}</h1>
        </header>

        <div className="ag-general-tabs" role="tablist" aria-label={t('gestao_geral_tabs')}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`ag-general-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm('');
                setStatusMessage('');
                setErrorMessage('');
              }}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <section className="shell ag-general-shell">

          <div className="toolbar ag-general-toolbar">
            <label className="search-wrap ag-general-search" htmlFor="ag-general-search-input">
              <Search size={20} />
              <input
                id="ag-general-search-input"
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="ag-general-cancel-btn"
              onClick={handleCancelChanges}
              disabled={isLoading || isSaving}
            >
              {t('gestao_geral_cancel')}
            </button>

            <button
              type="button"
              className="ag-general-apply-btn"
              onClick={handleApplyChanges}
              disabled={isLoading || isSaving}
              aria-busy={isSaving}
            >
              {isSaving ? t('gestao_geral_saving') : t('gestao_geral_apply')}
            </button>
          </div>

          {isLoading && (
            <p className="ag-general-status" role="status">
              {t('gestao_geral_loading')}
            </p>
          )}

          {!isLoading && (statusMessage || errorMessage) && (
            <p className={`ag-general-status ${errorMessage ? 'error' : 'success'}`} role="status">
              {errorMessage || statusMessage}
            </p>
          )}

          {activeTab === 'notificacoes' && (
            <div className="table-wrap ag-general-table-wrap">
              <table className="table ag-general-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>{t('gestao_geral_th_event')}</th>
                    <th rowSpan={2}>{t('gestao_geral_th_admin')}</th>
                    <th rowSpan={2}>{t('gestao_geral_th_sll')}</th>
                    <th rowSpan={2}>{t('gestao_geral_th_tl')}</th>
                    <th rowSpan={2}>{t('gestao_geral_th_consultor')}</th>
                    <th colSpan={2}>{t('gestao_geral_th_where')}</th>
                  </tr>
                  <tr>
                    <th>{t('gestao_geral_th_email')}</th>
                    <th>{t('gestao_geral_th_web')}</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="empty-state ag-general-empty-row">
                        {t('gestao_geral_loading')}
                      </td>
                    </tr>
                  )}

                  {!isLoading && filteredNotificationRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-state ag-general-empty-row">
                        {t('gestao_geral_no_events')}
                      </td>
                    </tr>
                  )}

                  {!isLoading && filteredNotificationRows.map((row) => (
                    <tr key={row.id}>
                      <td className="ag-general-event-cell">{row.event}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.admin}
                          onChange={() => toggleNotificationColumn(row.id, 'admin')}
                          aria-label={t('gestao_geral_aria_admin', { name: row.event })}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.sll}
                          onChange={() => toggleNotificationColumn(row.id, 'sll')}
                          aria-label={t('gestao_geral_aria_sll', { name: row.event })}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.tl}
                          onChange={() => toggleNotificationColumn(row.id, 'tl')}
                          aria-label={t('gestao_geral_aria_tl', { name: row.event })}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.consultor}
                          onChange={() => toggleNotificationColumn(row.id, 'consultor')}
                          aria-label={t('gestao_geral_aria_consultor', { name: row.event })}
                        />
                      </td>
                      <td>
                        {row.hasEmail ? (
                          <input
                            type="checkbox"
                            checked={row.email}
                            onChange={() => toggleNotificationColumn(row.id, 'email')}
                            aria-label={t('gestao_geral_aria_email', { name: row.event })}
                          />
                        ) : null}
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.webApp}
                          onChange={() => toggleNotificationColumn(row.id, 'webApp')}
                          aria-label={t('gestao_geral_aria_web', { name: row.event })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'rgpd' && (
            <div className="ag-rgpd-wrap" role="table" aria-label={t('gestao_geral_rgpd_table')}>
              <div className="ag-rgpd-header" role="row">
                <span className="ag-rgpd-col-num" role="columnheader">{t('gestao_geral_th_num')}</span>
                <span className="ag-rgpd-col-topic" role="columnheader">{t('gestao_geral_th_topic')}</span>
              </div>

                  {isLoading && (
                    <p className="ag-rgpd-empty">{t('gestao_geral_loading')}</p>
                  )}

                  {!isLoading && filteredRgpdTopics.length === 0 && (
                <p className="ag-rgpd-empty">{t('gestao_geral_no_topics')}</p>
              )}

                  {!isLoading && filteredRgpdTopics.map((item) => (
                <article key={item.id} className="ag-rgpd-topic-card" role="rowgroup">
                  <div className="ag-rgpd-topic-head" role="row">
                    <span className="ag-rgpd-col-num" role="cell">{item.id}</span>
                    <span className="ag-rgpd-title-chip" role="cell">{item.title}</span>
                  </div>
                  <textarea
                    className="ag-rgpd-body"
                    value={item.body}
                    onChange={(event) => updateRgpdField(item.id, 'body', event.target.value)}
                    aria-label={t('gestao_geral_aria_rgpd', { id: item.id })}
                    rows={5}
                  />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default GestaoGeralAG;
