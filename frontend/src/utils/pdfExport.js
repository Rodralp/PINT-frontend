import html2pdf from 'html2pdf.js';

export const resolveImageUrl = (src) => {
  if (!src) return '';
  if (src.startsWith('data:')) return src;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return window.location.origin + src;
};

const badgeFrameMap = {
  badge_level_junior: '/badges/J%C3%BAnior.png',
  badge_level_intermediate: '/badges/Interm%C3%A9dio.png',
  badge_level_senior: '/badges/S%C3%A9nior.png',
  badge_level_specialist: '/badges/Especialista.png',
  badge_level_knowledge_lead: '/badges/L%C3%ADder%20de%20Conhecimento.png',
  special: '/badges/Especial.png',
};

const badgeMaskMap = {
  badge_level_junior: '/badges/gs_J%C3%BAnior_Especial.png',
  badge_level_intermediate: '/badges/gs_Interm%C3%A9dio.png',
  badge_level_senior: '/badges/gs_S%C3%A9nior.png',
  badge_level_specialist: '/badges/gs_Especialista.png',
  badge_level_knowledge_lead: '/badges/gs_L%C3%ADder%20de%20Conhecimento.png',
  special: '/badges/gs_J%C3%BAnior_Especial.png',
};

const normalizeText = (v) =>
  String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

export const resolveBadgeFrameImage = (levelKey) => {
  const key = String(levelKey || '').trim();
  if (badgeFrameMap[key]) return resolveImageUrl(badgeFrameMap[key]);
  const n = normalizeText(key);
  if (n.includes('junior')) return resolveImageUrl(badgeFrameMap.badge_level_junior);
  if (n.includes('intermediate') || n.includes('intermedio') || n.includes('interm'))
    return resolveImageUrl(badgeFrameMap.badge_level_intermediate);
  if (n.includes('senior')) return resolveImageUrl(badgeFrameMap.badge_level_senior);
  if (n.includes('especialista') || n.includes('specialist'))
    return resolveImageUrl(badgeFrameMap.badge_level_specialist);
  if (n.includes('especial') || n.includes('special'))
    return resolveImageUrl(badgeFrameMap.special);
  if (n.includes('lider') || n.includes('lead'))
    return resolveImageUrl(badgeFrameMap.badge_level_knowledge_lead);
  return '';
};

export const resolveBadgeMaskImage = (levelKey) => {
  const key = String(levelKey || '').trim();
  if (badgeMaskMap[key]) return resolveImageUrl(badgeMaskMap[key]);
  const n = normalizeText(key);
  if (n.includes('junior')) return resolveImageUrl(badgeMaskMap.badge_level_junior);
  if (n.includes('intermediate') || n.includes('intermedio') || n.includes('interm'))
    return resolveImageUrl(badgeMaskMap.badge_level_intermediate);
  if (n.includes('senior')) return resolveImageUrl(badgeMaskMap.badge_level_senior);
  if (n.includes('especialista') || n.includes('specialist'))
    return resolveImageUrl(badgeMaskMap.badge_level_specialist);
  if (n.includes('especial') || n.includes('special'))
    return resolveImageUrl(badgeMaskMap.special);
  if (n.includes('lider') || n.includes('lead'))
    return resolveImageUrl(badgeMaskMap.badge_level_knowledge_lead);
  return '';
};

const loadImage = (src) =>
  new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

export const renderMaskedBadge = async (badgeImageSrc, levelKey, size = 120) => {
  const frameSrc = resolveBadgeFrameImage(levelKey);
  const maskSrc = resolveBadgeMaskImage(levelKey);

  const [badgeImg, maskImg, frameImg] = await Promise.all([
    loadImage(badgeImageSrc),
    maskSrc ? loadImage(maskSrc) : Promise.resolve(null),
    frameSrc ? loadImage(frameSrc) : Promise.resolve(null),
  ]);

  if (!badgeImg) return badgeImageSrc || '';

  const canvas = document.createElement('canvas');
  canvas.width = size * 2;
  canvas.height = size * 2;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (maskImg) {
    ctx.drawImage(badgeImg, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  } else {
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 24);
    ctx.clip();
    ctx.drawImage(badgeImg, 0, 0, canvas.width, canvas.height);
  }

  if (frameImg) {
    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
  }

  return canvas.toDataURL('image/png');
};

export const downloadHtmlAsPdf = (htmlString, filename, options = {}) => {
  return new Promise((resolve) => {
    const isLandscape = options.orientation === 'landscape';

    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
      position:fixed;left:-9999px;top:-9999px;
      width:${isLandscape ? '297mm' : '210mm'};
      height:${isLandscape ? '210mm' : '297mm'};
      z-index:99999;pointer-events:none;border:none;
    `;
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    doc.open();
    doc.write(htmlString);
    doc.close();

    const waitForImages = () => {
      const images = Array.from(doc.querySelectorAll('img'));
      if (images.length === 0) return Promise.resolve();
      return Promise.all(
        images.map(
          (img) =>
            new Promise((res) => {
              if (img.complete && img.naturalWidth > 0) return res();
              img.onload = res;
              img.onerror = res;
              setTimeout(res, 5000);
            })
        )
      );
    };

    const generate = async () => {
      try {
        await new Promise((r) => setTimeout(r, 500));
        await waitForImages();

        const opt = {
          margin: 0,
          filename,
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: isLandscape ? 'landscape' : 'portrait',
          },
        };

        await html2pdf().set(opt).from(doc.body).save();
      } catch (e) {
        console.error('PDF generation error:', e);
      } finally {
        document.body.removeChild(iframe);
        resolve();
      }
    };

    setTimeout(generate, 100);
  });
};
