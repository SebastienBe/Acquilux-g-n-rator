// ========================================
// AFFICHAGE PREVIEW
// ========================================

/**
 * Affiche la prévisualisation
 */
async function displayPreview(html, productName) {
  loading.style.display = 'none';
  pdfPreview.innerHTML = html;
  pdfPreview.style.display = 'flex';
  downloadBtn.style.display = 'inline-flex';
  pageTitle.textContent = `Fiche ${productName}`;
  
  // Appliquer les layouts badges courants au rendu
  if (typeof BadgeManager !== 'undefined' && BadgeManager.applyLayouts) {
    BadgeManager.applyLayouts(pdfPreview);
    BadgeManager.attachDragToAll(pdfPreview);
  }
  
  // Badges : conversion via fetch -> dataURI pour SVG/PNG (http/https). Local file:// reste en warning.
  const badgeGroup = pdfPreview.querySelector('.badge-group');
  const badgeImgs = pdfPreview.querySelectorAll('.badge-group img');
  console.log('🏷️ Badge group trouvé:', !!badgeGroup);
  console.log('🏷️ Nombre de badges trouvés:', badgeImgs.length);
  for (const badgeImg of badgeImgs) {
    const imgSrc = badgeImg.currentSrc || badgeImg.src || '';

    if (imgSrc.startsWith('http')) {
      try {
        badgeImg.crossOrigin = 'anonymous';
        const dataUri = await Utils.fetchUrlToDataURI(imgSrc);
        if (dataUri) {
          badgeImg.src = dataUri;
          console.log('✅ Badge converti en data URI (fetch, compatible SVG).');
        }
      } catch (err) {
        console.warn('⚠️ Impossible de convertir le badge distant en data URI (utilisation directe).', err);
      }
    } else if (imgSrc.startsWith('data:')) {
      console.log('ℹ️ Image badge déjà en data URI.');
    } else if (imgSrc.startsWith('file://')) {
      console.warn('⚠️ Image locale (file://). Utilisez un serveur local ou fournissez une URL http/https.');
      try {
        const base64 = await convertImageToBase64OnLoad(badgeImg);
        if (base64) {
          badgeImg.src = base64;
          console.log('✅ Image badge convertie en base64 (fallback local)');
        }
      } catch (err) {
        console.warn('⚠️ Erreur lors de la conversion de l\'image locale:', err);
      }
    }
  }
}

/**
 * Affiche une erreur
 */
function showError(message) {
  loading.style.display = 'none';
  error.style.display = 'block';
  errorMessage.textContent = message;
}

window.displayPreview = displayPreview;
window.showError = showError;

