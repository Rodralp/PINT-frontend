import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import { fetchUserNotifications, markNotificationRead } from '../../services/communicationService';
import '../../css/Consultor/Notificacoes.css';

const notificationTypes = [
  { id: 'todos', labelKey: 'notifications_filter_all' },
  { id: 'alerta', labelKey: 'notifications_filter_alert' },
  { id: 'info', labelKey: 'notifications_filter_info' },
  { id: 'sucesso', labelKey: 'notifications_filter_success' },
];

const sortOptions = [
  { id: 'recentes', labelKey: 'notifications_sort_recent' },
  { id: 'antigas', labelKey: 'notifications_sort_oldest' },
  { id: 'titulo_asc', labelKey: 'notifications_sort_title_asc' },
];

const notificationTypeLabels = {
  alerta: 'notifications_filter_alert',
  info: 'notifications_filter_info',
  sucesso: 'notifications_filter_success',
};

const ITEMS_PER_PAGE = 10;

const formatNotificationDate = (value, locale = 'pt-PT') => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const notificationTypeStyles = {
  alerta: {
    accent: '#ef4444',
  },
  info: {
    accent: '#3b82f6',
  },
  sucesso: {
    accent: '#4cd07d',
  },
};

const mapLogTypeToNotificationType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'importante') {
    return 'alerta';
  }

  if (normalized === 'aviso') {
    return 'alerta';
  }

  if (normalized === 'mensagem') {
    return 'info';
  }

  return 'info';
};

const messageLogTypes = new Set(['mensagem', 'aviso', 'importante']);

const mapNotificationItem = (item) => {
  const normalizedLogType = String(item?.type || '').trim().toLowerCase();
  const typeId = mapLogTypeToNotificationType(normalizedLogType);
  const style = notificationTypeStyles[typeId] || notificationTypeStyles.info;
  const accent = normalizedLogType === 'aviso'
    ? '#f4c20d'
    : normalizedLogType === 'importante'
      ? '#ef4444'
      : style.accent;
  const logId = item?.logId ? String(item.logId) : null;
  const isMessageLog = messageLogTypes.has(normalizedLogType);

  return {
    id: String(item?.id || ''),
    typeId,
    isRead: Boolean(item?.isRead),
    title: item?.title || 'Notificacao',
    date: item?.date || '',
    summary: item?.summary || '',
    message: item?.message || '',
    accent,
    actionPath: isMessageLog && logId ? '/consultor/mensagens-avisos' : null,
    messageId: logId,
  };
};

function Notificacoes() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('recentes');
  const [page, setPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  const filterDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const data = await fetchUserNotifications();
        if (!isMounted) {
          return;
        }

        const mapped = Array.isArray(data) ? data.map(mapNotificationItem) : [];
        setNotifications(mapped);
      } catch {
        if (isMounted) {
          setNotifications([]);
        }
      }
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }

      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const filters = useMemo(() => notificationTypes, []);

  const activeFilterLabel = filters.find((item) => item.id === activeFilter)
    ? t(filters.find((item) => item.id === activeFilter).labelKey)
    : t('notifications_filter_all');

  const activeSortLabel = sortOptions.find((item) => item.id === sortBy)
    ? t(sortOptions.find((item) => item.id === sortBy).labelKey)
    : t('notifications_sort_recent');

  const hasActiveFilter = activeFilter !== 'todos';
  const hasActiveSort = sortBy !== 'recentes';

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      const typeMatch = activeFilter === 'todos' || notification.typeId === activeFilter;
      const searchMatch =
        normalizedSearch.length === 0
        || notification.title.toLowerCase().includes(normalizedSearch)
        || notification.summary.toLowerCase().includes(normalizedSearch)
        || notification.message.toLowerCase().includes(normalizedSearch)
        || t(notificationTypeLabels[notification.typeId] || 'notifications_filter_all').toLowerCase().includes(normalizedSearch);

      return typeMatch && searchMatch;
    });
  }, [notifications, activeFilter, searchTerm, t]);

  const sortedNotifications = useMemo(() => {
    return [...filteredNotifications].sort((a, b) => {
      if (sortBy === 'antigas') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }

      if (sortBy === 'titulo_asc') {
        return a.title.localeCompare(b.title);
      }

      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [filteredNotifications, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedNotifications.length / ITEMS_PER_PAGE));

  const pagedNotifications = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sortedNotifications.slice(start, end);
  }, [sortedNotifications, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeFilter, sortBy]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleOpenNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
      } catch {
        // Ignore read errors to keep UI responsive.
      }

      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, isRead: true } : item
      )));
    }

    if (notification.actionPath) {
      navigate(notification.actionPath, {
        state: notification.messageId ? { selectedMessageId: notification.messageId } : undefined,
      });
      return;
    }

    setExpandedNotificationId((current) => (
      current === notification.id ? null : notification.id
    ));
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
    } catch {
      // Ignore read errors to keep UI responsive.
    }

    setNotifications((current) => current.map((item) => (
      item.id === notificationId ? { ...item, isRead: true } : item
    )));
  };

  return (
    <Layout>
      <div className="page notifications-page">
        <header className="page-header notifications-header">
          <h1>{t('notifications_title')}</h1>
        </header>

        <section className="shell notifications-shell">
          <div className="toolbar notifications-toolbar">
            <div className="search-wrap">
              <Search size={20} />
              <input
                id="notifications-search-input"
                type="text"
                placeholder={t('notifications_search_placeholder')}
                aria-label={t('notifications_search_placeholder')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="notifications-control-group" ref={filterDropdownRef}>
              <button
                type="button"
                className={`action-btn notifications-control-btn ${showFilterDropdown || hasActiveFilter ? 'active' : ''}`}
                onClick={() => {
                  setShowFilterDropdown((current) => !current);
                  setShowSortDropdown(false);
                }}
              >
                <Filter size={18} />
                <span className="notifications-control-btn-label">{`${t('notifications_filter_label')}: ${activeFilterLabel}`}</span>
              </button>

              {showFilterDropdown && (
                <div className="dropdown-menu" aria-label={t('notifications_filter_label')}>
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      className={`dropdown-item ${activeFilter === filter.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveFilter(filter.id);
                        setShowFilterDropdown(false);
                      }}
                    >
                      {t(filter.labelKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="notifications-control-group" ref={sortDropdownRef}>
              <button
                type="button"
                className={`action-btn notifications-control-btn ${showSortDropdown || hasActiveSort ? 'active' : ''}`}
                onClick={() => {
                  setShowSortDropdown((current) => !current);
                  setShowFilterDropdown(false);
                }}
              >
                <SlidersHorizontal size={18} />
                <span className="notifications-control-btn-label">{`${t('notifications_sort_label')}: ${activeSortLabel}`}</span>
              </button>

              {showSortDropdown && (
                <div className="dropdown-menu" aria-label={t('notifications_sort_label')}>
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`dropdown-item ${sortBy === option.id ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy(option.id);
                        setShowSortDropdown(false);
                      }}
                    >
                      {t(option.labelKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="notifications-column">
            <div className="notifications-panel-head">
              <h2>{t('notifications_table_title')}</h2>
              <span>{sortedNotifications.length} {t('notifications_items_label')}</span>
            </div>

            <div className="table-wrap bordered">
              <table className="table notifications-table">
                <thead>
                  <tr>
                    <th className="notifications-col-seen">{t('notifications_column_seen')}</th>
                    <th>{t('notifications_column_title')}</th>
                    <th>{t('notifications_column_sender')}</th>
                    <th>{t('notifications_column_date')}</th>
                    <th>{t('notifications_column_details')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedNotifications.map((notification) => {
                    const details = notification.message || notification.summary;
                    const isExpandable = !notification.actionPath && Boolean(details);
                    const canOpen = Boolean(notification.actionPath) || isExpandable;
                    const isExpanded = isExpandable && expandedNotificationId === notification.id;

                    return (
                      <Fragment key={notification.id}>
                        <tr>
                          <td>
                            {notification.isRead ? (
                              <span
                                className={`notifications-seen-indicator ${notification.isRead ? 'is-read' : 'is-unread'}`}
                                aria-label={t('notifications_seen_read')}
                                title={t('notifications_seen_read')}
                              />
                            ) : (
                              <button
                                type="button"
                                className="notifications-seen-btn"
                                onClick={() => handleMarkAsRead(notification.id)}
                                aria-label={t('notifications_seen_unread')}
                                title={t('notifications_seen_unread')}
                              >
                                <span className="notifications-seen-indicator is-unread" />
                              </button>
                            )}
                          </td>
                          <td>
                            <div className="notification-table-title-wrap">
                              <span className="notification-table-title">{notification.title}</span>
                              <span className="notification-table-summary">{notification.summary}</span>
                            </div>
                          </td>
                          <td>
                            <span className="notification-table-badge" style={{ backgroundColor: `${notification.accent}18`, color: notification.accent }}>
                              {t(notificationTypeLabels[notification.typeId] || 'notifications_filter_all')}
                            </span>
                          </td>
                          <td>{formatNotificationDate(notification.date, i18n.language === 'en' ? 'en-GB' : 'pt-PT')}</td>
                          <td>
                            {canOpen ? (
                              <button type="button" className="btn-outline" onClick={() => handleOpenNotification(notification)}>
                                {isExpandable && isExpanded ? t('notifications_view_less') : t('notifications_view_button')}
                              </button>
                            ) : (
                              <span className="notifications-view-empty">-</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="notifications-detail-row">
                            <td colSpan={5}>
                              <div className="notifications-detail-body">
                                {details}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Notificacoes;