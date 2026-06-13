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
    <div className="seemore-modal-overlay" onClick={onClose}>
      <div className="seemore-modal" onClick={(event) => event.stopPropagation()}>
        <div className="seemore-modal-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} className="seemore-modal-close-btn" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="seemore-modal-content">
          {displayItems.length > 0 ? (
            <div className="seemore-list">
              {displayItems.map((item, index) => (
                <div key={index} className="seemore-list-item">
                  {renderItem(item, index)}
                </div>
              ))}
            </div>
          ) : (
            <div className="seemore-empty-state">{emptyMessage}</div>
          )}
        </div>

        <div className="reminder-modal-actions" style={{ marginTop: 12, padding: '0 24px 20px' }}>
          <button type="button" className="reminder-cancel-btn" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SeeMore_PopUp;
