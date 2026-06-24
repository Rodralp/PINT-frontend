import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ message = 'A carregar...', fullPage = false }) {
  if (fullPage) {
    return (
      <div className="loading-fullpage">
        <div className="loading-fullpage-content">
          <Loader2 size={40} className="loading-spinner-icon" />
          <span className="loading-fullpage-text">{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <Loader2 size={24} className="loading-spinner-icon" />
      <span className="loading-inline-text">{message}</span>
    </div>
  );
}
