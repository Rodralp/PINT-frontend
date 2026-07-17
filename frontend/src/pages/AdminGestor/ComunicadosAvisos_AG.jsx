import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Paperclip, Search, SendHorizontal, UploadCloud, UserRoundPlus, X } from 'lucide-react';
import Layout from '../../components/Layout';
import { fetchAnnouncementRecipients, sendAnnouncement } from '../../services/communicationService';
import '../../css/AdminGestor/ComunicadosAvisos_AG.css';

const normalizeGroupId = (value) => (
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'grupo'
);

const MAX_FILE_MB = 10;
const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

const messageTypeOptions = [
  { id: 'mensagem', priority: 3 },
  { id: 'aviso', priority: 2 },
  { id: 'importante', priority: 1 },
];

function ComunicadosAvisosAG() {
  const { t } = useTranslation();

  const messageTypeLabelMap = useMemo(() => ({
    mensagem: t('comunicados_type_message'),
    aviso: t('comunicados_type_notice'),
    importante: t('comunicados_type_important'),
  }), [t]);

  const validateFile = (file) => {
    const fileExtension = String(file.name || '')
      .split('.')
      .pop()
      ?.toLowerCase();

    const validExtension = allowedExtensions.includes(fileExtension || '');
    const validSize = file.size <= MAX_FILE_MB * 1024 * 1024;

    if (!validExtension) {
      return { valid: false, reason: t('comunicados_invalid_format') };
    }

    if (!validSize) {
      return { valid: false, reason: t('comunicados_file_too_large') };
    }

    return { valid: true };
  };

  const [recipientsDirectory, setRecipientsDirectory] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);
  const [title, setTitle] = useState('');
  const [messageType, setMessageType] = useState('mensagem');
  const [message, setMessage] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [selectedPersonIds, setSelectedPersonIds] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [isRecipientPickerOpen, setIsRecipientPickerOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sendStatus, setSendStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadRecipients = async () => {
      try {
        const data = await fetchAnnouncementRecipients();

        if (!isMounted) {
          return;
        }

        const normalizedRecipients = (data?.recipients || []).map((recipient) => {
          const roles = Array.isArray(recipient.roles)
            ? recipient.roles
            : recipient.role
              ? [recipient.role]
              : [];
          const serviceLineValues = Array.isArray(recipient.serviceLines)
            ? recipient.serviceLines
            : [];

          return {
            id: String(recipient.id),
            name: recipient.nome || recipient.name || '',
            role: roles[0] || 'consultor',
            roles,
            serviceLines: serviceLineValues,
            serviceLine: serviceLineValues.join(', '),
          };
        });

        const normalizedServiceLines = (data?.serviceLines || []).map((serviceLine) => ({
          id: serviceLine.id,
          name: serviceLine.name || '',
        }));

        setRecipientsDirectory(normalizedRecipients);
        setServiceLines(normalizedServiceLines);
        setStatusMessage('');
      } catch {
        if (isMounted) {
          setRecipientsDirectory([]);
          setServiceLines([]);
          setStatusMessage(t('comunicados_load_error'));
        }
      }
    };

    loadRecipients();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const recipientGroups = useMemo(() => {
    const groups = [];

    const consultorIds = recipientsDirectory
      .filter((item) => item.roles.includes('consultor'))
      .map((item) => item.id);

    groups.push({
      id: 'grp-consultores',
      label: t('comunicados_group_all_consultants'),
      memberIds: consultorIds,
    });

    const sllIds = recipientsDirectory
      .filter((item) => item.roles.includes('service-line-leader'))
      .map((item) => item.id);

    groups.push({
      id: 'grp-sll',
      label: t('comunicados_group_all_sll'),
      memberIds: sllIds,
    });

    serviceLines.forEach((serviceLine) => {
      const normalizedServiceLine = String(serviceLine.name || '').toLowerCase();
      const memberIds = recipientsDirectory
        .filter((item) => item.serviceLines
          .some((entry) => entry.toLowerCase() === normalizedServiceLine))
        .map((item) => item.id);

      groups.push({
        id: `grp-${normalizeGroupId(serviceLine.name)}`,
        label: `Service Line ${serviceLine.name}`,
        memberIds,
      });
    });

    return groups;
  }, [recipientsDirectory, serviceLines, t]);

  const filteredPeople = useMemo(() => {
    const normalizedTerm = recipientSearch.trim().toLowerCase();

    if (!normalizedTerm) {
      return recipientsDirectory;
    }

    return recipientsDirectory.filter(
      (item) =>
        item.name.toLowerCase().includes(normalizedTerm)
        || item.role.toLowerCase().includes(normalizedTerm)
        || item.serviceLine.toLowerCase().includes(normalizedTerm),
    );
  }, [recipientSearch, recipientsDirectory]);

  const filteredGroups = useMemo(() => {
    const normalizedTerm = recipientSearch.trim().toLowerCase();

    if (!normalizedTerm) {
      return recipientGroups;
    }

    return recipientGroups.filter((group) => group.label.toLowerCase().includes(normalizedTerm));
  }, [recipientSearch, recipientGroups]);

  const recipientIdsFromGroups = useMemo(() => {
    const groupRecipients = selectedGroupIds
      .map((groupId) => recipientGroups.find((group) => group.id === groupId))
      .filter(Boolean)
      .flatMap((group) => group.memberIds);

    return new Set(groupRecipients);
  }, [selectedGroupIds, recipientGroups]);

  const allRecipientIds = useMemo(() => {
    const next = new Set(recipientIdsFromGroups);
    selectedPersonIds.forEach((personId) => next.add(personId));
    return next;
  }, [recipientIdsFromGroups, selectedPersonIds]);

  const messagePriority = useMemo(() => {
    const selected = messageTypeOptions.find((option) => option.id === messageType);
    return selected ? selected.priority : 2;
  }, [messageType]);

  const selectedRecipients = useMemo(
    () => recipientsDirectory.filter((person) => allRecipientIds.has(person.id)),
    [allRecipientIds, recipientsDirectory],
  );

  const canSend = title.trim().length > 0 && message.trim().length > 0 && selectedRecipients.length > 0;

  const handleToggleGroup = (groupId) => {
    setSelectedGroupIds((current) => {
      if (current.includes(groupId)) {
        return current.filter((id) => id !== groupId);
      }

      return [...current, groupId];
    });
    setSendStatus('');
  };

  const handleTogglePerson = (personId) => {
    setSelectedPersonIds((current) => {
      if (current.includes(personId)) {
        return current.filter((id) => id !== personId);
      }

      return [...current, personId];
    });
    setSendStatus('');
  };

  const handleRemoveGroup = (groupId) => {
    setSelectedGroupIds((current) => current.filter((id) => id !== groupId));
  };

  const handleRemovePerson = (personId) => {
    setSelectedPersonIds((current) => current.filter((id) => id !== personId));
  };

  const addFiles = (incomingFiles) => {
    const acceptedFiles = [];
    const rejected = [];

    incomingFiles.forEach((file) => {
      const validation = validateFile(file);

      if (!validation.valid) {
        rejected.push(`${file.name} (${validation.reason})`);
        return;
      }

      acceptedFiles.push(file);
    });

    setAttachments((current) => {
      const known = new Set(current.map((file) => `${file.name}:${file.size}`));
      const uniqueToAdd = acceptedFiles.filter((file) => !known.has(`${file.name}:${file.size}`));
      return [...current, ...uniqueToAdd];
    });

    setUploadErrors(rejected);
  };

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
    event.target.value = '';
  };

  const removeAttachment = (targetFile) => {
    setAttachments((current) =>
      current.filter((file) => !(file.name === targetFile.name && file.size === targetFile.size)),
    );
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files || []);
    addFiles(files);
  };

  const handleSendMessage = async () => {
    if (!canSend) {
      return;
    }

    try {
      await sendAnnouncement({
        title,
        message,
        recipientIds: Array.from(allRecipientIds),
        attachments,
        type: messageType,
        priority: messagePriority,
      });

      setSendStatus(t('comunicados_send_success', { count: selectedRecipients.length }));
      setTitle('');
      setMessage('');
      setAttachments([]);
      setUploadErrors([]);
    } catch (error) {
      setSendStatus(error?.message || t('comunicados_send_error'));
    }
  };

  return (
    <Layout>
      <div className="page">
        <header className="page-header">
          <h1>{t('comunicados_title')}</h1>
        </header>

        {statusMessage && (
          <div className="alert alert-warning py-2" role="status">
            {statusMessage}
          </div>
        )}

        <section className="ag-announcements-compose-card">
          <label htmlFor="ag-announcement-title">{t('comunicados_field_title')}</label>
          <input
            id="ag-announcement-title"
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setSendStatus('');
            }}
            placeholder={t('comunicados_placeholder_title')}
          />

          <label htmlFor="ag-announcement-type">{t('comunicados_field_type')}</label>
          <select
            id="ag-announcement-type"
            value={messageType}
            onChange={(event) => {
              setMessageType(event.target.value);
              setSendStatus('');
            }}
          >
            {messageTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {messageTypeLabelMap[option.id]}
              </option>
            ))}
          </select>

          <label htmlFor="ag-announcement-message">{t('comunicados_field_message')}</label>
          <textarea
            id="ag-announcement-message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setSendStatus('');
            }}
            placeholder={t('comunicados_placeholder_message')}
            rows={7}
          />

          <label>{t('comunicados_field_files')}</label>
          <div
            className={`ag-upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={handleDrop}
            aria-label={t('comunicados_aria_upload')}
          >
            <UploadCloud size={28} />
            <p>
              {t('comunicados_upload_hint1')}
            </p>
            <small>{t('comunicados_upload_hint2')}</small>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              className="ag-upload-hidden-input"
            />
          </div>

          {attachments.length > 0 && (
            <div className="ag-upload-files-list">
              {attachments.map((file) => (
                <div key={`${file.name}:${file.size}`} className="ag-upload-file-pill">
                  <Paperclip size={14} />
                  <span>{file.name}</span>
                  <button
                    type="button"
                    aria-label={`Remover ${file.name}`}
                    onClick={() => removeAttachment(file)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadErrors.length > 0 && (
            <div className="ag-upload-error-list" role="alert">
              {uploadErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          {sendStatus && <p className="ag-send-status">{sendStatus}</p>}

          <div className="ag-announcements-send-row">
            <button
              type="button"
              className="ag-send-btn"
              onClick={handleSendMessage}
              disabled={!canSend}
            >
              <SendHorizontal size={16} />
              {t('comunicados_btn_send')}
            </button>
          </div>
        </section>

        <section className="ag-announcements-recipient-card">
          <div className="ag-recipient-header">
            <h2>{t('comunicados_to_label')}</h2>
            <button
              type="button"
              className="ag-add-recipient-btn"
              onClick={() => setIsRecipientPickerOpen((current) => !current)}
            >
              <UserRoundPlus size={16} />
              {isRecipientPickerOpen ? t('comunicados_btn_close') : t('comunicados_btn_add')}
            </button>
          </div>

          <p className="ag-recipient-summary">{selectedRecipients.length} {t('comunicados_recipients_summary')}</p>

          {(selectedGroupIds.length > 0 || selectedPersonIds.length > 0) ? (
            <div className="ag-selected-recipient-chips">
              {selectedGroupIds.map((groupId) => {
                const group = recipientGroups.find((item) => item.id === groupId);
                if (!group) {
                  return null;
                }

                return (
                  <div key={group.id} className="ag-recipient-chip group">
                    <span>{group.label}</span>
                    <button type="button" onClick={() => handleRemoveGroup(group.id)} aria-label={`Remover grupo ${group.label}`}>
                      <X size={14} />
                    </button>
                  </div>
                );
              })}

              {selectedPersonIds.map((personId) => {
                const person = recipientsDirectory.find((item) => item.id === personId);
                if (!person) {
                  return null;
                }

                return (
                  <div key={person.id} className="ag-recipient-chip">
                    <span>{person.name}</span>
                    <button type="button" onClick={() => handleRemovePerson(person.id)} aria-label={`Remover ${person.name}`}>
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="ag-recipient-empty">{t('comunicados_no_recipients')}</p>
          )}

          {isRecipientPickerOpen && (
            <div className="ag-recipient-picker-panel">
              <label className="ag-recipient-search" htmlFor="ag-recipient-search-input">
                <Search size={16} />
                <input
                  id="ag-recipient-search-input"
                  type="text"
                  value={recipientSearch}
                  onChange={(event) => setRecipientSearch(event.target.value)}
                  placeholder={t('comunicados_search_people')}
                />
              </label>

              <div className="ag-recipient-picker-sections">
                <div className="ag-recipient-picker-section">
                  <h3>{t('comunicados_section_groups')}</h3>
                  <div className="ag-recipient-options">
                    {filteredGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        className={`ag-recipient-option ${selectedGroupIds.includes(group.id) ? 'selected' : ''}`}
                        onClick={() => handleToggleGroup(group.id)}
                      >
                        <span>{group.label}</span>
                        <small>{group.memberIds.length} {t('comunicados_people_count')}</small>
                      </button>
                    ))}

                    {filteredGroups.length === 0 && <p className="ag-recipient-empty">{t('comunicados_no_groups')}</p>}
                  </div>
                </div>

                <div className="ag-recipient-picker-section">
                  <h3>{t('comunicados_section_people')}</h3>
                  <div className="ag-recipient-options people">
                    {filteredPeople.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        className={`ag-recipient-option ${selectedPersonIds.includes(person.id) ? 'selected' : ''}`}
                        onClick={() => handleTogglePerson(person.id)}
                      >
                        <span>{person.name}</span>
                        <small>{person.serviceLine ? `${person.serviceLine} · ${person.role}` : person.role}</small>
                      </button>
                    ))}

                    {filteredPeople.length === 0 && <p className="ag-recipient-empty">{t('comunicados_no_people')}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default ComunicadosAvisosAG;
