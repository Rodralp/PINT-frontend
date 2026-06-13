import { X } from 'lucide-react';
import '../css/SeeMore_PopUp.css';

/**
 * SeeMore_PopUp - Componente reutilizável para exibir listas em modal
 * Usa as classes CSS do modal de lembretes para manter o visual consistente
 */
function SeeMore_PopUp({
  isOpen,
  onClose,
  title,
  items,
  renderItem,
  maxItems,
  emptyMessage = 'Nenhum item para mostrar.',
  closeLabel = 'Fechar',
}) {
  if (!isOpen) return null;

  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  return (
    <div className="reminder-modal-overlay" onClick={onClose}>
      <div className="reminder-modal" onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button type="button" onClick={onClose} className="reminders-back-btn" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
          {displayItems.length > 0 ? (
            <div className="seemore-list">
              {displayItems.map((item, index) => (
                <div key={index}>
                  {renderItem(item, index)}
                </div>
              ))}
            </div>
          ) : (
            <div className="seemore-empty-state">{emptyMessage}</div>
          )}
        </div>

        <div className="reminder-modal-actions" style={{ marginTop: 12 }}>
          <button type="button" className="reminder-cancel-btn" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SeeMore_PopUp;
