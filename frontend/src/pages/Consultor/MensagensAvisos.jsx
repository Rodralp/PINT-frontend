import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Megaphone,
  Paperclip,
  Search,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import { fetchUserAnnouncements, getAnnouncementAttachmentDownloadUrl } from '../../services/communicationService';
import '../../css/Consultor/MensagensAvisos.css';

const messageTypes = [
  { id: 'todos', labelKey: 'announcements_filter_all' },
  { id: 'mensagem', labelKey: 'announcements_filter_messages' },
  { id: 'aviso', labelKey: 'announcements_filter_notices' },
  { id: 'importante', labelKey: 'announcements_filter_important' },
];

const sortOptions = [
  { id: 'recentes', labelKey: 'announcements_sort_recent' },
  { id: 'antigas', labelKey: 'announcements_sort_oldest' },
  { id: 'prioridade', labelKey: 'announcements_sort_priority' },
];

const ITEMS_PER_PAGE = 6;

const formatDate = (value, locale = 'pt-PT') => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const messageTypeStyles = {
  mensagem: {
    accent: '#8b5cf6',
    tag: 'Mensagem',
    priority: 3,
  },
  aviso: {
    accent: '#f4c20d',
    tag: 'Aviso',
    priority: 2,
  },
  importante: {
    accent: '#ef4444',
    tag: 'Importante',
    priority: 1,
  },
};

const resolveMessageType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return messageTypeStyles[normalized] ? normalized : 'mensagem';
};

const buildMessageBody = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return [];
  }

  const paragraphs = raw
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return paragraphs.length > 0 ? paragraphs : [raw];
};

const buildMessageAvatar = (seed) => (
  `https://i.pravatar.cc/120?u=${encodeURIComponent(String(seed || 'user').toLowerCase())}`
);

const mapAnnouncementToMessage = (item) => {
  const resolvedType = resolveMessageType(item?.type);
  const style = messageTypeStyles[resolvedType] || messageTypeStyles.mensagem;
  const authorName = item?.author || 'Sistema';
  const avatarSeed = item?.authorEmail || authorName;
  const summary = item?.summary || String(item?.message || '').split(/\r?\n/)[0]?.trim() || '';
  const attachments = Array.isArray(item?.attachments) ? item.attachments : [];

  return {
    id: String(item?.id ?? ''),
    typeId: resolvedType,
    priority: Number(item?.priority) || style.priority,
    title: item?.title || '',
    summary,
    author: authorName,
    date: item?.date || '',
    tag: style.tag,
    accent: style.accent,
    avatar: buildMessageAvatar(avatarSeed),
    body: buildMessageBody(item?.message || summary),
    attachments,
  };
};

function MensagensAvisos() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('recentes');
  const [page, setPage] = useState(1);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const filterDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const preferredMessageId = location.state?.selectedMessageId;

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      try {
        const data = await fetchUserAnnouncements();
        if (!isMounted) {
          return;
        }

        const mapped = Array.isArray(data) ? data.map(mapAnnouncementToMessage) : [];
        setMessages(mapped);
      } catch {
        if (isMounted) {
          setMessages([]);
        }
      }
    };

    loadMessages();

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

  const filteredMessages = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return messages.filter((message) => {
      const typeMatch = activeFilter === 'todos' || message.typeId === activeFilter;
      const searchMatch =
        normalizedSearch.length === 0
        || message.title.toLowerCase().includes(normalizedSearch)
        || message.summary.toLowerCase().includes(normalizedSearch)
        || message.author.toLowerCase().includes(normalizedSearch)
        || message.body.some((paragraph) => paragraph.toLowerCase().includes(normalizedSearch));

      return typeMatch && searchMatch;
    });
  }, [messages, activeFilter, searchTerm]);

  const sortedMessages = useMemo(() => {
    return [...filteredMessages].sort((a, b) => {
      if (sortBy === 'antigas') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }

      if (sortBy === 'prioridade') {
        return a.priority - b.priority || new Date(b.date).getTime() - new Date(a.date).getTime();
      }

      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [filteredMessages, sortBy]);

  useEffect(() => {
    if (!preferredMessageId) {
      return;
    }

    const normalizedPreferredId = String(preferredMessageId);
    const targetIndex = sortedMessages.findIndex((message) => message.id === normalizedPreferredId);

    if (targetIndex < 0) {
      return;
    }

    const nextPage = Math.floor(targetIndex / ITEMS_PER_PAGE) + 1;
    setPage(nextPage);
    setSelectedMessageId(normalizedPreferredId);
  }, [preferredMessageId, sortedMessages]);

  const totalPages = Math.max(1, Math.ceil(sortedMessages.length / ITEMS_PER_PAGE));

  const pagedMessages = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sortedMessages.slice(start, end);
  }, [sortedMessages, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeFilter, sortBy]);

  useEffect(() => {
    if (!pagedMessages.length) {
      setSelectedMessageId(null);
      return;
    }

    const normalizedPreferredId = preferredMessageId ? String(preferredMessageId) : null;
    const hasPreferredInList = normalizedPreferredId
      && sortedMessages.some((message) => message.id === normalizedPreferredId);
    if (hasPreferredInList && !selectedMessageId) {
      return;
    }

    if (!selectedMessageId || !pagedMessages.some((message) => message.id === selectedMessageId)) {
      setSelectedMessageId(pagedMessages[0].id);
    }
  }, [pagedMessages, selectedMessageId, preferredMessageId, sortedMessages]);

  const filters = useMemo(() => messageTypes, []);
  const activeFilterLabel = filters.find((item) => item.id === activeFilter)
    ? t(filters.find((item) => item.id === activeFilter).labelKey)
    : t('announcements_filter_all');

  const activeSortLabel = sortOptions.find((item) => item.id === sortBy)
    ? t(sortOptions.find((item) => item.id === sortBy).labelKey)
    : t('announcements_sort_recent');

  const hasActiveFilter = activeFilter !== 'todos';
  const hasActiveSort = sortBy !== 'recentes';
  const selectedMessage = sortedMessages.find((message) => message.id === selectedMessageId) || sortedMessages[0] || messages[0];

  const onPagePrev = () => setPage((current) => Math.max(1, current - 1));
  const onPageNext = () => setPage((current) => Math.min(totalPages, current + 1));

  return (
    <Layout>
      <div className="announcements-page">
        <header className="announcements-header">
          <h1>{t('announcements_title')}</h1>
        </header>

        <section className="announcements-shell">
          <div className="announcements-toolbar">
            <label className="announcements-search-wrap" htmlFor="announcements-search-input">
              <Search size={20} />
              <input
                id="announcements-search-input"
                type="text"
                placeholder={t('announcements_search_placeholder')}
                aria-label={t('announcements_search_placeholder')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <div className="announcements-control-group" ref={filterDropdownRef}>
              <button
                type="button"
                className={`announcements-control-btn ${showFilterDropdown || hasActiveFilter ? 'active' : ''}`}
                onClick={() => {
                  setShowFilterDropdown((current) => !current);
                  setShowSortDropdown(false);
                }}
              >
                <Filter size={18} />
                <span className="announcements-control-btn-label">{`${t('announcements_filter_label')}: ${activeFilterLabel}`}</span>
              </button>

              {showFilterDropdown && (
                <div className="announcements-dropdown-menu" aria-label={t('announcements_filter_label')}>
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      className={`announcements-dropdown-item ${activeFilter === filter.id ? 'active' : ''}`}
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

            <div className="announcements-control-group" ref={sortDropdownRef}>
              <button
                type="button"
                className={`announcements-control-btn ${showSortDropdown || hasActiveSort ? 'active' : ''}`}
                onClick={() => {
                  setShowSortDropdown((current) => !current);
                  setShowFilterDropdown(false);
                }}
              >
                <SlidersHorizontal size={18} />
                <span className="announcements-control-btn-label">{`${t('announcements_sort_label')}: ${activeSortLabel}`}</span>
              </button>

              {showSortDropdown && (
                <div className="announcements-dropdown-menu" aria-label={t('announcements_sort_label')}>
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`announcements-dropdown-item ${sortBy === option.id ? 'active' : ''}`}
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

          <div className="announcements-grid">
            <aside className="announcements-list-panel">
              <div className="announcements-panel-head">
                <h2>{t('announcements_title')}</h2>
                <span>{sortedMessages.length} {t('announcements_items_label')}</span>
              </div>

              <div className="announcements-list">
                {pagedMessages.map((message) => {
                  const isSelected = message.id === selectedMessageId;

                  return (
                    <button
                      key={message.id}
                      type="button"
                      className={`announcement-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedMessageId(message.id)}
                    >
                      <img className="announcement-avatar" src={message.avatar} alt={message.author} />
                      <div className="announcement-item-content">
                        <strong>{message.title}</strong>
                        <span>{message.summary}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="announcements-pagination" role="navigation" aria-label={t('pagination')}>
                <button type="button" className="announcements-page-btn ghost" onClick={onPagePrev} disabled={page === 1} aria-label={t('previous_page')}>
                  <ChevronLeft size={16} />
                </button>

                <span className="announcements-page-count">{page} / {totalPages}</span>

                <button type="button" className="announcements-page-btn ghost" onClick={onPageNext} disabled={page === totalPages} aria-label={t('next_page')}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </aside>

            <section className="announcements-detail-panel">
              {selectedMessage ? (
                <div className="announcement-detail-card">
                  <div className="announcement-detail-header">
                    <div className="announcement-detail-tag" style={{ backgroundColor: `${selectedMessage.accent}18`, color: selectedMessage.accent }}>
                      {selectedMessage.tag}
                    </div>
                    <div className="announcement-detail-meta">
                      <span>
                        <CalendarDays size={14} />
                        {formatDate(selectedMessage.date, i18n.language === 'en' ? 'en-GB' : 'pt-PT')}
                      </span>
                      <span>
                        <UserRound size={14} />
                        {selectedMessage.author}
                      </span>
                    </div>
                  </div>

                  <h3>{selectedMessage.title}</h3>

                  <div className="announcement-detail-body">
                    {selectedMessage.body.map((paragraph, index) => (
                      <p key={`${selectedMessage.id}-${index}`}>{paragraph}</p>
                    ))}
                  </div>

                  {selectedMessage.attachments?.length > 0 && (
                    <div className="announcement-attachments">
                      <h4>{t('announcements_attachments_title')}</h4>
                      <div className="announcement-attachments-list">
                        {selectedMessage.attachments.map((file) => (
                          <a
                            key={file.id}
                            className="announcement-attachment-item"
                            href={getAnnouncementAttachmentDownloadUrl(selectedMessage.id, file.id)}
                          >
                            <Paperclip size={14} />
                            <span>{file.originalName || file.name || t('announcements_attachment_download')}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="announcement-detail-footer">
                    <Megaphone size={16} />
                    <span>{activeFilterLabel}</span>
                  </div>
                </div>
              ) : (
                <div className="announcements-empty-state">{t('announcements_empty_state')}</div>
              )}
            </section>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default MensagensAvisos;