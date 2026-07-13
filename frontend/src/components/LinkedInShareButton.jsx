import { useEffect, useRef, useState } from 'react';
import { Link } from 'lucide-react';
import './LinkedInShareButton.css';

function LinkedInShareButton({ url, className = '' }) {
  const containerRef = useRef(null);
  const [pluginLoaded, setPluginLoaded] = useState(false);

  useEffect(() => {
    if (!url) return;

    const checkIN = () => Boolean(window.IN && typeof window.IN.parse === 'function');

    if (checkIN()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPluginLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      if (checkIN()) {
        clearInterval(interval);
        setPluginLoaded(true);
      }
    }, 300);

    const timeout = setTimeout(() => clearInterval(interval), 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pluginLoaded || !url) return;

    container.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'IN/Share';
    script.setAttribute('data-url', url);
    container.appendChild(script);

    window.IN.parse(container);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [pluginLoaded, url]);

  const handleFallbackClick = () => {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  return (
    <div className={`linkedin-share-button-wrapper ${className}`}>
      {pluginLoaded ? (
        <div ref={containerRef} className="linkedin-share-button-container" />
      ) : (
        <button
          type="button"
          className={`linkedin-share-button-fallback ${className}`}
          onClick={handleFallbackClick}
          aria-label="Partilhar no LinkedIn"
        >
          <Link size={20} />
          Partilhar
        </button>
      )}
    </div>
  );
}

export default LinkedInShareButton;
