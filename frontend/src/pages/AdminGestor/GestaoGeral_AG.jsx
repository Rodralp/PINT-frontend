import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import Layout from '../../components/Layout';
import {
  fetchAdminGeneralManagement,
  updateAdminGeneralSettings,
  updateAdminNotificationSettings,
  updateAdminRgpdTopics,
} from '../../services/adminGeneralManagementService';
import '../../css/AdminGestor/GestaoGeral_AG.css';

const tabs = [
  { id: 'notificacoes', label: 'Notificações' },
  { id: 'rgpd', label: 'RGPD' },
  { id: 'geral', label: 'Geral' },
];

const initialNotificationRows = [
  {
    id: 1,
    event: 'Novo registo',
    admin: true,
    sll: true,
    tl: false,
    consultor: false,
    email: false,
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
    webApp: true,
  },
  {
    id: 7,
    event: 'Badge a expirar',
    admin: false,
    sll: false,
    tl: false,
    consultor: true,
    email: true,
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

const generalSettings = [
  {
    id: 1,
    key: 'Tema padrão',
    value: 'Claro',
    options: ['Claro', 'Escuro', 'Automático'],
  },
  {
    id: 2,
    key: 'Idioma padrão',
    value: 'Português (PT)',
    options: ['Português (PT)', 'English (EN)', 'Español (ES)'],
  },
  {
    id: 3,
    key: 'Notificações email',
    value: 'Ativo',
    options: ['Ativo', 'Inativo'],
  },
  {
    id: 4,
    key: 'Notificações in-app',
    value: 'Ativo',
    options: ['Ativo', 'Inativo'],
  },
  {
    id: 5,
    key: 'Resumo semanal',
    value: 'Inativo',
    options: ['Ativo', 'Inativo'],
  },
];

function GestaoGeralAG() {
  const [activeTab, setActiveTab] = useState('notificacoes');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationRows, setNotificationRows] = useState([]);
  const [rgpdRows, setRgpdRows] = useState([]);
  const [generalRows, setGeneralRows] = useState([]);
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
      setGeneralRows(
        Array.isArray(data?.settings) && data.settings.length > 0
          ? data.settings
          : generalSettings,
      );
      setStatusMessage('');
      setErrorMessage('');
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setNotificationRows(initialNotificationRows);
      setRgpdRows(rgpdTopics);
      setGeneralRows(generalSettings);
      setErrorMessage(error?.message || 'Nao foi possivel carregar a configuracao geral.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

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

  const filteredGeneralSettings = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return generalRows;
    }

    return generalRows.filter(
      (item) => item.key.toLowerCase().includes(normalizedTerm) || item.value.toLowerCase().includes(normalizedTerm),
    );
  }, [generalRows, searchTerm]);

  const searchPlaceholder =
    activeTab === 'rgpd' ? 'Pesquisar tópico' : activeTab === 'geral' ? 'Pesquisar definição' : 'Pesquisar evento';

  const toggleNotificationColumn = (rowId, columnKey) => {
    setNotificationRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [columnKey]: !row[columnKey] } : row)),
    );
  };

  const updateRgpdField = (rowId, field, value) => {
    setRgpdRows((current) => current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const updateGeneralOption = (rowId, value) => {
    setGeneralRows((current) => current.map((row) => (row.id === rowId ? { ...row, value } : row)));
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
      } else {
        const data = await updateAdminGeneralSettings(generalRows);
        if (Array.isArray(data?.settings)) {
          setGeneralRows(data.settings);
        }
      }

      setStatusMessage('Alteracoes guardadas com sucesso.');
    } catch (error) {
      setErrorMessage(error?.message || 'Nao foi possivel guardar as alteracoes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="ag-general-page">
        <header className="ag-general-header">
          <h1>Gestão Geral</h1>
        </header>

        <div className="ag-general-tabs" role="tablist" aria-label="Separadores de gestão geral">
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
              {tab.label}
            </button>
          ))}
        </div>

        <section className="ag-general-shell">

          <div className="ag-general-toolbar">
            <label className="ag-general-search" htmlFor="ag-general-search-input">
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
              Cancelar alterações
            </button>

            <button
              type="button"
              className="ag-general-apply-btn"
              onClick={handleApplyChanges}
              disabled={isLoading || isSaving}
              aria-busy={isSaving}
            >
              {isSaving ? 'A guardar...' : 'Aplicar alterações'}
            </button>
          </div>

          {isLoading && (
            <p className="ag-general-status" role="status">
              A carregar dados...
            </p>
          )}

          {!isLoading && (statusMessage || errorMessage) && (
            <p className={`ag-general-status ${errorMessage ? 'error' : 'success'}`} role="status">
              {errorMessage || statusMessage}
            </p>
          )}

          {activeTab === 'notificacoes' && (
            <div className="ag-general-table-wrap">
              <table className="ag-general-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Evento</th>
                    <th rowSpan={2}>Admin</th>
                    <th rowSpan={2}>Quem Notificar S.L.L</th>
                    <th rowSpan={2}>T.L.</th>
                    <th rowSpan={2}>Consultor</th>
                    <th colSpan={2}>Onde Notificar</th>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <th>Web/App</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="ag-general-empty-row">
                        A carregar...
                      </td>
                    </tr>
                  )}

                  {!isLoading && filteredNotificationRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="ag-general-empty-row">
                        Sem eventos para os filtros escolhidos.
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
                          aria-label={`Admin para ${row.event}`}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.sll}
                          onChange={() => toggleNotificationColumn(row.id, 'sll')}
                          aria-label={`SLL para ${row.event}`}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.tl}
                          onChange={() => toggleNotificationColumn(row.id, 'tl')}
                          aria-label={`TL para ${row.event}`}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.consultor}
                          onChange={() => toggleNotificationColumn(row.id, 'consultor')}
                          aria-label={`Consultor para ${row.event}`}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.email}
                          onChange={() => toggleNotificationColumn(row.id, 'email')}
                          aria-label={`Email para ${row.event}`}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.webApp}
                          onChange={() => toggleNotificationColumn(row.id, 'webApp')}
                          aria-label={`Web app para ${row.event}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'rgpd' && (
            <div className="ag-rgpd-wrap" role="table" aria-label="Tabela de tópicos RGPD">
              <div className="ag-rgpd-header" role="row">
                <span className="ag-rgpd-col-num" role="columnheader">Num.</span>
                <span className="ag-rgpd-col-topic" role="columnheader">Tópico</span>
              </div>

                  {isLoading && (
                    <p className="ag-rgpd-empty">A carregar...</p>
                  )}

                  {!isLoading && filteredRgpdTopics.length === 0 && (
                <p className="ag-rgpd-empty">Sem tópicos para os filtros escolhidos.</p>
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
                    aria-label={`Conteúdo RGPD ${item.id}`}
                    rows={5}
                  />
                </article>
              ))}
            </div>
          )}

          {activeTab === 'geral' && (
            <div className="ag-settings-wrap">
              {isLoading && (
                <p className="ag-rgpd-empty">A carregar...</p>
              )}

              {!isLoading && filteredGeneralSettings.length === 0 && (
                <p className="ag-rgpd-empty">Sem definições para os filtros escolhidos.</p>
              )}

              {!isLoading && filteredGeneralSettings.map((item) => (
                <article key={item.id} className="ag-setting-row">
                  <span className="ag-setting-key-label">{item.key}</span>
                  <select
                    className="ag-setting-value-input"
                    value={item.value}
                    onChange={(event) => updateGeneralOption(item.id, event.target.value)}
                    aria-label={`Valor da definição ${item.id}`}
                  >
                    {(Array.isArray(item.options) ? item.options : []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
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
