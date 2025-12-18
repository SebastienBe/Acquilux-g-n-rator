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
  
  // Attendre que le DOM soit injecté avant de traiter les badges
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // IMPORTANT : Convertir les badges EN PREMIER avant d'appliquer les layouts
  // Sinon les images ne sont pas chargées et le badge-group n'a pas de dimensions
  // Badges : conversion via fetch -> dataURI pour SVG/PNG (http/https)
  const badgeGroup = pdfPreview.querySelector('.badge-group');
  const allBadgeImgs = pdfPreview.querySelectorAll('.badge-instance');
  
  
  for (const badgeImg of allBadgeImgs) {
    const imgSrc = badgeImg.currentSrc || badgeImg.src || '';

    if (!imgSrc) continue;

    if (imgSrc.startsWith('http')) {
      try {
        badgeImg.crossOrigin = 'anonymous';
        const dataUri = await Utils.fetchUrlToDataURI(imgSrc);
        if (dataUri) {
          badgeImg.src = dataUri;
          
          // Stocker le SVG original pour pouvoir restaurer les couleurs
          if (dataUri.startsWith('data:image/svg+xml')) {
            badgeImg.dataset.originalSvgDataUri = dataUri;
          }
          
          // Attendre que l'image se charge
          await new Promise((resolve, reject) => {
            if (badgeImg.complete && badgeImg.naturalWidth > 0) {
              resolve();
            } else {
              badgeImg.addEventListener('load', () => resolve(), { once: true });
              badgeImg.addEventListener('error', () => reject(new Error('Image load failed')), { once: true });
              // Timeout après 3 secondes
              setTimeout(() => reject(new Error('Image load timeout')), 3000);
            }
          });
          
        }
      } catch (err) {
        console.error('❌ Erreur conversion badge:', err);
      }
    } else if (imgSrc.startsWith('data:')) {
      // Déjà en data URI, stocker le SVG original si c'est un SVG
      if (imgSrc.startsWith('data:image/svg+xml') && !badgeImg.dataset.originalSvgDataUri) {
        badgeImg.dataset.originalSvgDataUri = imgSrc;
      }
      // Attendre le chargement
      await new Promise((resolve) => {
        if (badgeImg.complete && badgeImg.naturalWidth > 0) {
          resolve();
        } else {
          badgeImg.addEventListener('load', () => resolve(), { once: true });
          badgeImg.addEventListener('error', () => resolve(), { once: true });
        }
      });
    } else if (imgSrc.startsWith('file://')) {
      try {
        const base64 = await convertImageToBase64OnLoad(badgeImg);
        if (base64) {
          badgeImg.src = base64;
        }
      } catch (err) {
        console.warn('⚠️ Erreur lors de la conversion locale du badge:', err);
      }
    }
  }
  
  // MAINTENANT appliquer les couleurs personnalisées puis les layouts badges courants au rendu
  // Les images sont chargées, donc le badge-group aura les bonnes dimensions
  if (typeof BadgeManager !== 'undefined') {
    // Appliquer les couleurs personnalisées pour chaque badge
    const allBadgeImgs = pdfPreview.querySelectorAll('.badge-instance');
    for (let i = 0; i < allBadgeImgs.length; i++) {
      if (BadgeManager.applyColors) {
        await BadgeManager.applyColors(pdfPreview, i);
      }
    }
    
    // Puis appliquer les layouts
    if (BadgeManager.applyLayouts) {
      BadgeManager.applyLayouts(pdfPreview);
      BadgeManager.attachDragToAll(pdfPreview);
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

