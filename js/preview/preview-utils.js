// ========================================
// UTILITAIRES GÉNÉRIQUES
// ========================================
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Détecte si on est sur mobile
 */
function isMobile() {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Conversion fetch -> dataURI (gère SVG)
async function fetchUrlToDataURI(url) {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('svg')) {
    const text = await res.text();
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return `data:image/svg+xml;base64,${encoded}`;
  }
  const blob = await res.blob();
  return await blobToDataURI(blob);
}

function blobToDataURI(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getPointFromEvent(e) {
  if (e.touches && e.touches[0]) {
    return { x: e.touches[0].pageX, y: e.touches[0].pageY };
  }
  return { x: e.pageX, y: e.pageY };
}

// Expose utilities globally
window.Utils = {
  clamp,
  escapeHtml,
  fetchUrlToDataURI,
  getPointFromEvent,
  isMobile,
  blobToDataURI
};

