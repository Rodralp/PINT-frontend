import { useEffect, useRef, useState } from 'react';
import './LinkedInShareButton.css';

function LinkedInIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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
          <LinkedInIcon size={20} />
          LinkedIn
        </button>
      )}
    </div>
  );
}

export default LinkedInShareButton;
