import { useMemo, useState, useEffect } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundPlus,
  X,
} from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../css/AdminGestor/EquipasSLA_AG.css';
import { teamService } from '../../services/teamService';

const getAvatarSeed = (member) =>
  String(member?.email || member?.name || member || 'user')
    .toLowerCase()
    .replace('@', '.');

const getMemberAvatarUrl = (member) =>
  `/avatars/default-avatar.svg`;

const onMemberAvatarError = (event, member) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = getMemberAvatarUrl(member);
};

const getIsoDateFromDisplay = (dateValue) => {
  if (!dateValue) {
    return '';
  }

  const [day, month, year] = dateValue.split('/');
  if (!day || !month || !year) {
    return '';
  }

  return `${year}-${month}-${day}`;
};

function EquipasSLAAG() {
  const [teams, setTeams] = useState([]);
  const [alertTeams, setAlertTeams] = useState([]);
  const [selectableMembers, setSelectableMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newSlaText, setNewSlaText] = useState('');
  const [newSlaDate, setNewSlaDate] = useState('');
  const [originalTeamName, setOriginalTeamName] = useState('');
  const [originalSlaText, setOriginalSlaText] = useState('');
  const [originalSlaDate, setOriginalSlaDate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showAddMemberList, setShowAddMemberList] = useState(false);

  const isEditing = Boolean(editingTeamId);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const normalizeUser = (user) => ({
    id: Number(user?.id),
    name: String(user?.name || user?.nome || user?.email || 'Utilizador'),
    email: String(user?.email || ''),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [teamsData, alertTeamsData, usersData] = await Promise.all([
        teamService.getAllTeams(),
        teamService.getTeamsWithExpiringSLA(),
        teamService.getAllUsers()
      ]);
      
      setTeams(teamsData);
      setAlertTeams(alertTeamsData);
      const normalizedUsers = Array.isArray(usersData) ? usersData.map(normalizeUser) : [];
      setSelectableMembers(normalizedUsers);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load teams data');
    } finally {
      setLoading(false);
    }
  };

  const selectedMemberObjects = useMemo(
    () => selectableMembers && Array.isArray(selectableMembers)
      ? selectableMembers.filter((member) => selectedMembers.includes(member.id))
      : [],
    [selectedMembers, selectableMembers],
  );

  const availableMembers = useMemo(
    () => selectableMembers && Array.isArray(selectableMembers)
      ? selectableMembers.filter((member) => !selectedMembers.includes(member.id))
      : [],
    [selectedMembers, selectableMembers],
  );

  const getMemberIdsFromTeam = (members) => {
    if (!Array.isArray(members)) {
      return [];
    }

    const selectableIds = new Set(selectableMembers.map((member) => member.id));
    return members
      .map((member) => member?.id)
      .filter((memberId) => selectableIds.has(memberId));
  };

  const filteredMembers = useMemo(() => {
    const normalizedTerm = memberSearchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return availableMembers;
    }

    return availableMembers.filter((member) =>
      (member?.name || '').toLowerCase().includes(normalizedTerm)
    );
  }, [availableMembers, memberSearchTerm]);

  const openCreateModal = () => {
    setEditingTeamId(null);
    setNewTeamName('');
    setNewSlaText('');
    setNewSlaDate('');
    setOriginalTeamName('');
    setOriginalSlaText('');
    setOriginalSlaDate('');
    setSelectedMembers([]);
    setMemberSearchTerm('');
    setShowAddMemberList(false);
    setModalOpen(true);
  };

  const openEditModal = (team) => {
    const isoExpiryDate = team.expiryDate ? getIsoDateFromDisplay(team.expiryDate) : '';
    setEditingTeamId(team.id);
    setNewTeamName(team.name || '');
    setNewSlaText(team.slaDescription || '');
    setNewSlaDate(isoExpiryDate);
    setOriginalTeamName(team.name || '');
    setOriginalSlaText(team.slaDescription || '');
    setOriginalSlaDate(isoExpiryDate);
    setSelectedMembers(getMemberIdsFromTeam(team.members || []));
    setMemberSearchTerm('');
    setShowAddMemberList(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTeamId(null);
    setNewTeamName('');
    setNewSlaText('');
    setNewSlaDate('');
    setOriginalTeamName('');
    setOriginalSlaText('');
    setOriginalSlaDate('');
    setSelectedMembers([]);
    setMemberSearchTerm('');
    setShowAddMemberList(false);
  };

  const addMemberToSelection = (memberId) => {
    setSelectedMembers((current) => {
      if (current.includes(memberId)) {
        return current;
      }

      return [...current, memberId];
    });
  };

  const removeMemberFromSelection = (memberId) => {
    setSelectedMembers((current) => current.filter((id) => id !== memberId));
  };

  const formatInputDate = (dateValue) => {
    if (!dateValue) {
      return '';
    }

    const [year, month, day] = dateValue.split('-');
    if (!year || !month || !day) {
      return '';
    }

    return `${day}/${month}/${year}`;
  };

  const handleDeleteTeam = async (team) => {
    const confirmed = window.confirm(`Tem a certeza que pretende remover a equipa ${team.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await teamService.deleteTeam(team.id);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team');
    }
  };

  const handleSaveTeam = async () => {
    const effectiveTeamName = isEditing ? originalTeamName : newTeamName;
    const effectiveSlaText = isEditing ? originalSlaText : newSlaText;

    if (!effectiveTeamName.trim() || !effectiveSlaText.trim()) {
      return;
    }

    const hasDateChange = newSlaDate && newSlaDate !== originalSlaDate;
    const shouldValidateDate = !isEditing || hasDateChange;

    // Validar data de expiração SLA (mínimo 1 semana após data atual)
    if (shouldValidateDate && newSlaDate) {
      const selectedDate = new Date(newSlaDate);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 7); // Adicionar 7 dias
      
      if (selectedDate < minDate) {
        alert('A data de expiração do SLA deve ser no mínimo 1 semana após a data atual.');
        return;
      }
    }

    try {
      const trimmedTeamName = effectiveTeamName.trim();
      const trimmedSlaText = effectiveSlaText.trim();
      const teamData = {
        name: trimmedTeamName,
        description: `Equipa ${trimmedTeamName}`,
        slaDescription: trimmedSlaText,
        expiryDate: newSlaDate,
        memberIds: selectedMembers,
      };

      if (isEditing) {
        await teamService.updateTeam(editingTeamId, teamData);
      } else {
        await teamService.createTeam(teamData);
      }

      closeModal();
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Failed to save team');
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner fullPage message="A carregar equipas..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page">
        <header className="page-header">
          <h1>Equipas e SLA</h1>
        </header>

        {error && (
          <div className="ag-error">
            <p>{error}</p>
            <button onClick={loadData}>Tentar novamente</button>
          </div>
        )}

        {!error && (
          <>
            <section className="ag-sla-alerts-card">
              <h2>
                <AlertTriangle size={20} />
                SLAs prestes a expirar/expirados
              </h2>

              <div className="ag-sla-cards-grid">
                {alertTeams.length === 0 ? (
                  <p>Nenhuns SLAs prestes a expirar</p>
                ) : (
                  alertTeams.map((team) => (
                    <article key={`${team.id}-alert`} className="ag-sla-team-card">
                      <div className="ag-sla-team-card-head">
                        <h3>{team.name}</h3>
                        <button
                          type="button"
                          aria-label={`Editar ${team.name}`}
                          className="ag-inline-icon-btn"
                          onClick={() => openEditModal(team)}
                        >
                          <Pencil size={15} />
                        </button>
                      </div>

                      <span className={`ag-sla-status-pill ${team.priority || 'warning'}`}>{team.daysLabel || 'Sem SLA'}</span>
                      <p>{team.slaDescription || 'Sem descrição de SLA'}</p>

                      {team.expiryDate && (
                        <div className="ag-sla-date">
                          <CalendarDays size={15} />
                          <span>{team.expiryDate}</span>
                        </div>
                      )}

                      <button type="button" className="ag-notify-btn">
                        <Bell size={14} />
                        Notificar equipa
                      </button>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="ag-teams-list-card">
              <div className="ag-teams-list-header">
                <h2>
                  <UserRoundPlus size={20} />
                  Equipas
                </h2>

                <button type="button" className="ag-add-team-btn" onClick={openCreateModal}>
                  <Plus size={16} />
                  Adicionar equipa
                </button>
              </div>

              <div className="ag-team-list">
                {teams.length === 0 ? (
                  <p>Nenhuma equipa encontrada</p>
                ) : (
                  teams.map((team) => {
                    const visibleMembers = (team.members || []).slice(0, 11);
                    const hiddenMembers = Math.max(0, (team.members || []).length - visibleMembers.length);

                    return (
                      <article key={team.id} className="ag-team-row-card">
                        <div className="ag-team-row-top">
                          <div>
                            <h3>
                              {team.name}{' '}
                              <span className="ag-members-count-pill">{team.membersCount || 0} membros</span>
                            </h3>
                            <p>{team.slaDescription || 'Sem SLA'}</p>
                          </div>

                          <div className="ag-team-actions">
                            <button
                              type="button"
                              aria-label={`Editar ${team.name}`}
                              className="ag-inline-icon-btn"
                              onClick={() => openEditModal(team)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Eliminar ${team.name}`}
                              className="ag-inline-icon-btn danger"
                              onClick={() => handleDeleteTeam(team)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="ag-member-badges-row" role="list" aria-label={`Membros da ${team.name}`}>
                          {visibleMembers.map((member) => (
                            <div key={member.id} className="ag-member-pill" role="listitem" title={member.name}>
                              <img
                                src={getMemberAvatarUrl(member)}
                                alt={member.name}
                                className="ag-member-avatar ag-member-avatar-pill"
                                onError={(event) => onMemberAvatarError(event, member)}
                              />
                              <small>{member.name}</small>
                            </div>
                          ))}

                          {hiddenMembers > 0 && <div className="ag-member-pill ag-more-pill">+{hiddenMembers}</div>}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}

        {modalOpen && (
          <div className="ag-team-modal-overlay" role="presentation" onClick={closeModal}>
            <section
              className="ag-team-modal"
              role="dialog"
              aria-modal="true"
              aria-label={isEditing ? 'Editar equipa' : 'Adicionar nova equipa'}
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" className="ag-team-modal-close" onClick={closeModal} aria-label="Fechar">
                <X size={18} />
              </button>

              <div className="ag-team-modal-grid">
                <div className="ag-team-form-column">
                  <label htmlFor="team-name">Nome de equipa</label>
                  <input
                    id="team-name"
                    value={newTeamName}
                    onChange={(event) => setNewTeamName(event.target.value)}
                    placeholder="Insira nome da equipa"
                    disabled={isEditing}
                  />

                  <label htmlFor="team-sla">Service Level Agreement</label>
                  <textarea
                    id="team-sla"
                    value={newSlaText}
                    onChange={(event) => setNewSlaText(event.target.value)}
                    placeholder="Insira os detalhes do SLA"
                    rows={6}
                    disabled={isEditing}
                  />

                  <label htmlFor="team-expiry">Data de expiracao do SLA (mínimo 1 semana)</label>
                  <input
                    id="team-expiry"
                    type="date"
                    value={newSlaDate}
                    onChange={(event) => setNewSlaDate(event.target.value)}
                    min={(() => {
                      const minDate = new Date();
                      minDate.setDate(minDate.getDate() + 7);
                      return minDate.toISOString().split('T')[0];
                    })()}
                  />
                </div>

                <div className="ag-member-picker-column">
                  <div className="ag-member-picker-head">
                    <h3>{showAddMemberList ? 'Adicionar pessoas' : 'Pessoas selecionadas'}</h3>
                    <button
                      type="button"
                      className={`ag-member-add-tile ${showAddMemberList ? 'active' : ''}`}
                      aria-label="Adicionar pessoa"
                      aria-expanded={showAddMemberList}
                      onClick={() => setShowAddMemberList((current) => !current)}
                    >
                      <Plus size={22} />
                    </button>
                  </div>

                  {showAddMemberList ? (
                    <div className="ag-member-picker-add-panel">
                      <label htmlFor="member-search" className="ag-member-search-wrap">
                        <Search size={14} />
                        <input
                          id="member-search"
                          type="text"
                          value={memberSearchTerm}
                          onChange={(event) => setMemberSearchTerm(event.target.value)}
                          placeholder="Pesquisar pessoa para adicionar"
                        />
                      </label>

                      <div className="ag-member-picker-list" role="list" aria-label="Lista de pessoas para adicionar">
                        {filteredMembers.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            className="ag-member-select-card"
                            onClick={() => addMemberToSelection(member.id)}
                          >
                            <img
                              src={getMemberAvatarUrl(member)}
                              alt={member.name}
                              className="ag-member-avatar ag-member-avatar-card"
                              onError={(event) => onMemberAvatarError(event, member)}
                            />
                            <span>{member.name}</span>
                          </button>
                        ))}

                        {filteredMembers.length === 0 && (
                          <p className="ag-member-search-empty">Nenhuma pessoa disponivel para adicionar.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="ag-selected-member-list" role="list" aria-label="Membros selecionados da equipa">
                      {selectedMemberObjects.map((member) => (
                        <article key={member.id} className="ag-member-selected-card" role="listitem">
                          <img
                            src={getMemberAvatarUrl(member)}
                            alt={member.name}
                            className="ag-member-avatar ag-member-avatar-card"
                            onError={(event) => onMemberAvatarError(event, member)}
                          />
                          <span>{member.name}</span>
                          <button
                            type="button"
                            className="ag-member-remove-btn"
                            onClick={() => removeMemberFromSelection(member.id)}
                            aria-label={`Remover ${member.name}`}
                          >
                            Remover
                          </button>
                        </article>
                      ))}

                      {selectedMemberObjects.length === 0 && (
                        <p className="ag-member-search-empty">Nenhuma pessoa selecionada.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <footer className="ag-team-modal-footer">
                <button type="button" className="ag-modal-cancel" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="button" className="ag-modal-submit" onClick={handleSaveTeam}>
                  {isEditing ? 'Guardar alteracoes' : 'Adicionar'}
                </button>
              </footer>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default EquipasSLAAG;