import { useEffect, useRef, useState } from 'react';
import './LinkedInShareButton.css';

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 100 28" fill="currentColor" className="linkedin-wordmark">
      <text x="0" y="21" fontFamily="Arial, Helvetica, sans-serif" fontSize="21" fontWeight="700" letterSpacing="-0.5">Linked</text>
      <rect x="70" y="2" width="22" height="22" rx="3.5" fill="currentColor" />
      <text x="74" y="19" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="700" fill="#1b84f4">in</text>
    </svg>
  );
}

function LinkedInShareButton({ url, className = '' }) {
  const containerRef = useRef(null);
  const [pluginLoaded, setPluginLoaded] = useState(false);

  useEffect(() => {
    if (!url) return;

    const checkIN = () => Boolean(window.IN && typeof window.IN.parse === 'function');

    if (checkIN()) {
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
          aria-label="LinkedIn"
        >
          <LinkedInIcon />
        </button>
      )}
    </div>
  );
}

export default LinkedInShareButton;
