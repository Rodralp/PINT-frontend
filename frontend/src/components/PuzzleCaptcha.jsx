import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

function PuzzleCaptcha({ onComplete }) {
  const { t } = useTranslation();
  const [positions, setPositions] = useState([]);
  const [targetPosition, setTargetPosition] = useState(null);
  const [userSelected, setUserSelected] = useState(false);
  const [feedback, setFeedback] = useState('');
  const gridRef = useRef(null);

  const generatePuzzle = () => {
    const puzzleSize = 9;
    const items = [];
    const circleSize = 44;
    const padding = 10;
    const containerWidth = gridRef.current?.clientWidth || 250;
    const containerHeight = gridRef.current?.clientHeight || 250;
    
    // Gera 9 posições aleatórias dentro dos limites
    for (let i = 0; i < puzzleSize; i++) {
      const maxX = Math.max(padding, containerWidth - circleSize - padding);
      const maxY = Math.max(padding, containerHeight - circleSize - padding);
      
      items.push({
        id: i,
        x: Math.random() * (maxX - padding) + padding,
        y: Math.random() * (maxY - padding) + padding
      });
    }

    setPositions(items);
    
    // Seleciona uma posição alvo aleatória
    const target = Math.floor(Math.random() * puzzleSize);
    setTargetPosition(target);
    setUserSelected(false);
    setFeedback('');
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generatePuzzle();
  }, []);

  const handlePuzzleClick = (id) => {
    if (userSelected) return;

    if (id === targetPosition) {
      setFeedback('success');
      setUserSelected(true);
      setTimeout(() => {
        onComplete();
      }, 500);
    } else {
      setFeedback('error');
      setTimeout(() => {
        generatePuzzle();
      }, 700);
    }
  };

  if (targetPosition === null) return <div>{t('captcha_loading')}</div>;

  return (
    <div className="puzzle-captcha-container">
      <div className="puzzle-instructions">
        <p>{t('captcha_instruction_prefix')} <span className="puzzle-highlight">{t('captcha_instruction_highlight')}</span></p>
      </div>

      <div ref={gridRef} className={`puzzle-grid ${feedback}`}>
        {positions.map((item) => (
          <button
            key={item.id}
            className={`puzzle-item ${item.id === targetPosition ? 'target' : ''} ${
              feedback === 'error' && item.id === targetPosition ? 'error-highlight' : ''
            }`}
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`
            }}
            onClick={() => handlePuzzleClick(item.id)}
            disabled={userSelected}
            aria-label={t('captcha_circle_aria_label')}
          >
            {item.id === targetPosition && <span className="circle-pulse">●</span>}
            {item.id !== targetPosition && <span>●</span>}
          </button>
        ))}
      </div>

      {feedback === 'error' && (
        <p className="puzzle-error-msg">{t('captcha_error')}</p>
      )}

      <button 
        type="button"
        className="puzzle-btn-retry"
        onClick={generatePuzzle}
      >
        {t('captcha_new_puzzle')}
      </button>
    </div>
  );
}

export default PuzzleCaptcha;
