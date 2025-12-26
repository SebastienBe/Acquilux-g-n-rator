// ========================================
// GÉNÉRATION PDF
// ========================================

/**
 * Force l'application de tous les styles avant le rendu PDF
 * Cette fonction s'assure que tous les computed styles sont à jour
 * @param {HTMLElement} element - Élément racine à traiter
 */
function ensureAllStylesApplied(element) {
  if (!element) return;
  
  // Forcer un reflow pour s'assurer que tous les styles computed sont à jour
  element.offsetHeight;
  
  // Pour tous les éléments [data-editable], forcer le recalcul des styles
  const allEditableElements = element.querySelectorAll('[data-editable]');
  allEditableElements.forEach(el => {
    // Forcer le recalcul des styles computed
    window.getComputedStyle(el);
    
    // S'assurer que les styles inline sont appliqués
    // (html2canvas utilisera les computed styles, donc on force juste le recalcul)
    el.offsetHeight; // Force reflow
  });
  
  // Forcer aussi le recalcul pour l'image container et l'image
  const imageContainer = element.querySelector('.product-image-container');
  if (imageContainer) {
    window.getComputedStyle(imageContainer);
    imageContainer.offsetHeight; // Force reflow
    
    const image = imageContainer.querySelector('img');
    if (image) {
      window.getComputedStyle(image);
      image.offsetHeight; // Force reflow
    }
  }
  
  // Forcer un dernier reflow global
  element.offsetHeight;
}

/**
 * Convertit une image en base64 au chargement
 */
async function convertImageToBase64OnLoad(img) {
  return new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) {
      convertImageToBase64(img).then(resolve);
    } else {
      img.onload = () => convertImageToBase64(img).then(resolve);
      img.onerror = () => resolve(null);
    }
  });
}

/**
 * Convertit une image en base64
 */
function convertImageToBase64(img) {
  return new Promise((resolve) => {
    if (img.src && img.src.startsWith('data:')) {
      resolve(img.src);
      return;
    }

    if (img.src && img.src.startsWith('file://')) {
      console.warn('⚠️ Impossible de convertir une image file:// en base64. Utilisez un serveur local.');
      resolve(null);
      return;
    }

    try {
      // Utiliser les dimensions naturelles pour préserver les proportions
      // Ne pas utiliser les dimensions CSS qui pourraient être déformées
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;
      
      if (!naturalWidth || !naturalHeight || naturalWidth === 0 || naturalHeight === 0) {
        console.warn('⚠️ Dimensions naturelles invalides pour l\'image');
        resolve(null);
        return;
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Utiliser les dimensions naturelles pour préserver le ratio
      canvas.width = naturalWidth;
      canvas.height = naturalHeight;
      // Dessiner l'image sans redimensionnement pour préserver les proportions
      ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);
      // Utiliser PNG pour préserver la qualité (pas de compression JPEG)
      const dataURI = canvas.toDataURL('image/png');
      resolve(dataURI);
    } catch (err) {
      console.warn('⚠️ Erreur conversion base64:', err);
      resolve(null);
    }
  });
}

/**
 * Convertit une image en data URI
 */
async function convertImageToDataURI(img) {
  // Si l'image est déjà un data URI, on la retourne directement
  if (img.src && img.src.startsWith('data:')) {
    return img.src;
  }

  try {
    // Pour les images locales, utiliser fetch pour éviter le problème de "tainted canvas"
    const response = await fetch(img.src);
    const blob = await response.blob();
    return await Utils.blobToDataURI(blob);
  } catch (error) {
    console.warn('⚠️ Erreur lors de la conversion de l\'image en data URI:', error);
    return null;
  }
}

/**
 * Prépare les images pour html2canvas (conversion en data URI)
 */
async function prepareImagesForCanvas(element) {
  const images = element.querySelectorAll('img');
  const imagePromises = [];
  
  for (const img of images) {
    if (img.src) {
      // Pour les images data: (collées), s'assurer qu'elles sont chargées
      if (img.src.startsWith('data:')) {
        imagePromises.push(
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              // Timeout de sécurité
              setTimeout(() => resolve(), 5000);
            }
          })
        );
      }
      // Gérer les blob URLs
      else if (img.src.startsWith('blob:')) {
        imagePromises.push(
          (async () => {
            try {
              const response = await fetch(img.src);
              const blob = await response.blob();
              const reader = new FileReader();
              const dataUri = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              img.src = dataUri;
              // Attendre que l'image soit chargée après conversion
              await new Promise((resolve) => {
                if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                  resolve();
                } else {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                  setTimeout(() => resolve(), 5000);
                }
              });
            } catch (err) {
              console.warn('⚠️ Erreur conversion badge blob pour PDF:', err);
            }
          })()
        );
      } else {
        // Images HTTP normales
        imagePromises.push(
          convertImageToDataURI(img)
            .then(dataURI => {
                if (dataURI) {
                  img.src = dataURI;
                  // Attendre que l'image soit chargée après conversion
                  return new Promise((resolve) => {
                    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                      resolve();
                    } else {
                      img.onload = () => resolve();
                      img.onerror = () => resolve();
                      setTimeout(() => resolve(), 5000);
                    }
                  });
                }
            })
            .catch(err => {
              console.error('❌ Erreur conversion image:', err);
            })
        );
      }
    }
  }
  
  // Attendre que toutes les images soient converties
  await Promise.all(imagePromises);
  
  // Attendre un peu pour que les images soient bien chargées dans le DOM
  await new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * Copie les styles inline en excluant le conteneur d'image
 */
function copyInlineStyles(source, target) {
  if (!source || !target) return;
  
  // Exclure le conteneur d'image de la copie récursive pour éviter les conflits
  if (source.classList && source.classList.contains('product-image-container')) {
    return;
  }
  
  // Copier les styles inline de l'élément
  if (source.style && source.style.cssText) {
    target.style.cssText = source.style.cssText;
  }
  
  // MODE TEST : Pour les éléments de typographie (h1, h2, li, p, etc.), copier aussi les styles computed
  // si pas de styles inline, pour garantir un rendu identique
  const isTypographyElement = source.tagName && ['H1', 'H2', 'H3', 'P', 'LI', 'SPAN', 'STRONG', 'EM'].includes(source.tagName);
  if (isTypographyElement && (!source.style.cssText || source.style.cssText.trim() === '')) {
    try {
      const computedStyle = window.getComputedStyle(source);
      // Copier les propriétés de typographie importantes
      if (computedStyle.fontSize) target.style.fontSize = computedStyle.fontSize;
      if (computedStyle.fontWeight) target.style.fontWeight = computedStyle.fontWeight;
      if (computedStyle.fontFamily) target.style.fontFamily = computedStyle.fontFamily;
      if (computedStyle.lineHeight) target.style.lineHeight = computedStyle.lineHeight;
      if (computedStyle.letterSpacing) target.style.letterSpacing = computedStyle.letterSpacing;
      if (computedStyle.color) target.style.color = computedStyle.color;
    } catch (e) {
      // Ignorer les erreurs de computed style
    }
  }
  
  // Pour les éléments [data-editable], préserver aussi les computed styles si pas de styles inline
  // Cela garantit que les styles appliqués via Figma sont préservés
  if (source.hasAttribute && source.hasAttribute('data-editable')) {
    if (!source.style.cssText || source.style.cssText.trim() === '') {
      try {
        const computedStyle = window.getComputedStyle(source);
        // Préserver les propriétés importantes (marges, padding, couleurs, typographie)
        if (computedStyle.marginTop) target.style.marginTop = computedStyle.marginTop;
        if (computedStyle.marginRight) target.style.marginRight = computedStyle.marginRight;
        if (computedStyle.marginBottom) target.style.marginBottom = computedStyle.marginBottom;
        if (computedStyle.marginLeft) target.style.marginLeft = computedStyle.marginLeft;
        if (computedStyle.paddingTop) target.style.paddingTop = computedStyle.paddingTop;
        if (computedStyle.paddingRight) target.style.paddingRight = computedStyle.paddingRight;
        if (computedStyle.paddingBottom) target.style.paddingBottom = computedStyle.paddingBottom;
        if (computedStyle.paddingLeft) target.style.paddingLeft = computedStyle.paddingLeft;
        if (computedStyle.color) target.style.color = computedStyle.color;
        if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          target.style.backgroundColor = computedStyle.backgroundColor;
        }
        if (computedStyle.fontSize) target.style.fontSize = computedStyle.fontSize;
        if (computedStyle.fontWeight) target.style.fontWeight = computedStyle.fontWeight;
        if (computedStyle.fontFamily) target.style.fontFamily = computedStyle.fontFamily;
        if (computedStyle.lineHeight) target.style.lineHeight = computedStyle.lineHeight;
        if (computedStyle.letterSpacing) target.style.letterSpacing = computedStyle.letterSpacing;
        if (computedStyle.textAlign) target.style.textAlign = computedStyle.textAlign;
      } catch (e) {
        // Ignorer les erreurs de computed style
      }
    }
  }
  
  // Copier récursivement pour tous les enfants (sauf le conteneur d'image)
  const sourceChildren = source.children || [];
  const targetChildren = target.children || [];
  
  for (let i = 0; i < Math.min(sourceChildren.length, targetChildren.length); i++) {
    const sourceChild = sourceChildren[i];
    const targetChild = targetChildren[i];
    
    if (sourceChild.classList && sourceChild.classList.contains('product-image-container')) {
      continue;
    }
    
    copyInlineStyles(sourceChild, targetChild);
  }
  
  // Copier aussi pour les nodes (pour capturer les text nodes si nécessaire)
  const sourceNodes = source.childNodes || [];
  const targetNodes = target.childNodes || [];
  
  for (let i = 0; i < Math.min(sourceNodes.length, targetNodes.length); i++) {
    if (sourceNodes[i].nodeType === 1 && targetNodes[i].nodeType === 1) {
      if (sourceNodes[i].classList && sourceNodes[i].classList.contains('product-image-container')) {
        continue;
      }
      copyInlineStyles(sourceNodes[i], targetNodes[i]);
    }
  }
}

/**
 * Capture les styles critiques du conteneur d'image et de l'image
 */
function captureImageStyles(originalElement) {
  const result = {
    containerHeight: null,
    containerMarginTop: '',
    imageStyles: {
      width: '100%',
      height: '100%',
      transform: '',
      filter: '',
      objectFit: 'cover',
      objectPosition: 'center',
      clipPath: 'none'
    }
  };
  
  try {
    const container = originalElement.querySelector('.product-image-container');
    const image = container?.querySelector('img');
    
    if (container) {
      // Capturer la hauteur depuis le style inline en priorité (plus fiable que computedHeight avec marginTop)
      const styleHeight = container.style.height;
      const computedHeight = container.clientHeight || container.offsetHeight;
      
      // Priorité au style inline car il reflète exactement ce qui a été calculé
      if (styleHeight && typeof styleHeight === 'string' && styleHeight.endsWith('px')) {
        const parsedHeight = parseFloat(styleHeight);
        if (parsedHeight && isFinite(parsedHeight) && parsedHeight > 0) {
          result.containerHeight = parsedHeight;
        }
      }
      
      // Fallback sur computedHeight si pas de style inline
      if (!result.containerHeight && computedHeight && isFinite(computedHeight) && computedHeight > 0) {
        result.containerHeight = computedHeight;
      }
      
      // Capturer le top ou marginTop (important pour le déplacement Y)
      // Priorité au top si position est absolute, sinon marginTop
      if (container.style.position === 'absolute' || window.getComputedStyle(container).position === 'absolute') {
        result.containerMarginTop = container.style.top || '';
      } else {
        result.containerMarginTop = container.style.marginTop || '';
      }
      
      if (image) {
        const computedStyle = window.getComputedStyle(image);
        
        // Crop et zoom supprimés - valeurs fixes
        const widthPercent = image.dataset.widthPercent ? parseFloat(image.dataset.widthPercent) : 100;
        const heightPercent = image.dataset.heightPercent ? parseFloat(image.dataset.heightPercent) : 100;
        
        result.imageStyles = {
          // Utiliser widthPercent et heightPercent comme valeurs principales
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
          transform: image.style.transform || '',
          filter: image.style.filter || '',
          objectFit: image.style.objectFit || computedStyle.objectFit || 'cover',
          objectPosition: image.style.objectPosition || computedStyle.objectPosition || 'center',
          clipPath: image.style.clipPath || 'none',
          // Crop et zoom supprimés - valeurs fixes
          cropTop: 0,
          cropBottom: 0,
          cropLeft: 0,
          cropRight: 0,
          zoom: 100,
          widthPercent: widthPercent,
          heightPercent: heightPercent
        };
      }
    }
  } catch (e) {
    console.warn('⚠️ Erreur lors de la capture des styles d\'image:', e);
  }
  
  return result;
}

/**
 * Réapplique les styles critiques du conteneur d'image et de l'image dans le clone
 */
async function reapplyImageStyles(clonedElement, imageStyles) {
  try {
    const container = clonedElement.querySelector('.product-image-container');
    const image = container?.querySelector('img');
    
    if (container && image) {
      const styles = imageStyles.imageStyles;
      
      // Crop et zoom supprimés - valeurs fixes
      const cropTop = 0;
      const cropBottom = 0;
      const zoom = 100;
      const widthPercent = styles.widthPercent || 100;
      const heightPercent = styles.heightPercent || 100;
      
      // IMPORTANT : Appliquer position et width AVANT de calculer containerWidth
      // pour que le calcul soit identique à la preview
      container.style.position = 'absolute';
      container.style.left = '0';
      container.style.right = '0';
      container.style.margin = '0';
      container.style.width = '100%';
      container.style.display = 'block';
      
      // Forcer un reflow pour que la largeur soit calculée
      container.offsetWidth;
      
      // MAINTENANT calculer la largeur avec la même logique que la preview
      // Utiliser clientWidth comme dans la preview (calculé après les styles)
      // IMPORTANT : S'assurer que le parent a sa largeur définie (comme dans la preview)
      const parent = container.parentElement;
      if (parent) {
        // Forcer un reflow du parent pour que sa largeur soit calculée
        parent.offsetWidth;
      }
      
      let containerWidth = container.clientWidth || image.clientWidth || 1;
      if (!containerWidth || containerWidth === 0) {
        // Fallback sur le parent si nécessaire
        containerWidth = parent ? (parent.offsetWidth || parent.clientWidth || 400) : 400;
      }
      
      // S'assurer que la largeur est valide (identique à la preview qui utilise || 1)
      if (!containerWidth || containerWidth === 0) {
        containerWidth = 1; // Valeur par défaut comme dans la preview
      }
      
      // Recalculer la hauteur avec la même logique que dans la preview
      // IMPORTANT : Le crop ne réduit PAS la hauteur du conteneur pour éviter l'aplatissement
      // Le crop est géré uniquement via object-position
      // S'assurer que l'image a ses dimensions naturelles avant de calculer
      if (!image.complete || !image.naturalWidth || !image.naturalHeight) {
        // Attendre que l'image soit chargée
        await new Promise((resolve) => {
          if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
            resolve();
          } else {
            image.onload = () => resolve();
            image.onerror = () => resolve();
            setTimeout(() => resolve(), 5000);
          }
        });
      }
      
      const ratio = image.naturalHeight && image.naturalWidth
        ? image.naturalHeight / image.naturalWidth
        : 1;
      
      let calculatedHeight = containerWidth * ratio;
      calculatedHeight *= (heightPercent / 100);
      calculatedHeight *= (zoom / 100);
      // Réduire la hauteur de base de 40px pour un meilleur rendu (même logique que la preview)
      calculatedHeight = Math.max(80, calculatedHeight - 40);
      
      // Ajuster object-position pour gérer le crop avec un meilleur centrage (même logique que la preview)
      // Décaler la position Y de base de 70px vers le bas (20px + 50px)
      const baseOffsetY = calculatedHeight > 0 ? (70 / calculatedHeight) * 100 : 0;
      
      // Extraire posY depuis objectPosition
      let posY = 50; // Valeur par défaut
      const currentObjectPosition = styles.objectPosition || 'center';
      const posYMatch = currentObjectPosition.match(/(\d+)%\s+(\d+)%/);
      if (posYMatch) {
        posY = parseFloat(posYMatch[2]);
      } else if (currentObjectPosition.includes('top')) {
        posY = 0;
      } else if (currentObjectPosition.includes('bottom')) {
        posY = 100;
      }
      
      // Crop supprimé - utiliser simplement posY sans ajustements
      const adjustedPosY = posY + baseOffsetY;
      
      const finalHeight = calculatedHeight;
      
      // Appliquer la hauteur recalculée (identique à la preview)
      container.style.height = `${finalHeight}px`;
      container.style.transform = '';
      
      // Utiliser top au lieu de marginTop pour le positionnement vertical
      // Convertir marginTop/top en top si présent, sinon utiliser 50px par défaut (identique à la preview)
      let topValue = 50; // Valeur par défaut
      if (imageStyles.containerMarginTop && imageStyles.containerMarginTop !== '0px') {
        const marginTopMatch = imageStyles.containerMarginTop.match(/(\d+)px/);
        if (marginTopMatch) {
          topValue = parseFloat(marginTopMatch[1]);
        }
      }
      container.style.top = `${topValue}px`;
      
      // Forcer la mise à jour du layout
      container.offsetHeight; // Force reflow
      
      // Créer ou mettre à jour un élément spacer pour réserver l'espace dans le flux
      let spacer = container.previousElementSibling;
      if (!spacer || !spacer.classList.contains('product-image-spacer')) {
        spacer = document.createElement('div');
        spacer.className = 'product-image-spacer';
        spacer.style.display = 'block';
        spacer.style.width = '100%';
        spacer.style.height = '0';
        spacer.style.margin = '0';
        spacer.style.padding = '0';
        container.parentElement.insertBefore(spacer, container);
      }
      // Ajuster la hauteur du spacer pour réserver l'espace (hauteur + top)
      spacer.style.height = `${finalHeight + topValue}px`;
      
      // Forcer un nouveau reflow après l'application du top
      container.offsetHeight;
      
      // Appliquer les styles de l'image (identique à la preview)
      image.style.width = `${widthPercent}%`;
      image.style.height = `${heightPercent}%`;
      const zoomFactor = zoom / 100;
      // Appliquer le transform sans zoom (zoom supprimé)
      const transformMatch = styles.transform ? styles.transform.match(/rotate\((-?\d+)deg\)/) : null;
      const rotation = transformMatch ? parseFloat(transformMatch[1]) : 0;
      const scaleXMatch = styles.transform ? styles.transform.match(/scaleX\((-?\d+(?:\.\d+)?)\)/) : null;
      const scaleYMatch = styles.transform ? styles.transform.match(/scaleY\((-?\d+(?:\.\d+)?)\)/) : null;
      const currentScaleX = scaleXMatch ? parseFloat(scaleXMatch[1]) : 1;
      const currentScaleY = scaleYMatch ? parseFloat(scaleYMatch[1]) : 1;
      image.style.transform = `rotate(${rotation}deg) scaleX(${currentScaleX}) scaleY(${currentScaleY})`;
      image.style.filter = styles.filter;
      image.style.clipPath = 'none';
      
      // Appliquer object-position ajusté pour le crop (identique à la preview)
      const posX = styles.objectPosition.match(/(\d+)%/)?.[1] || 50;
      image.style.objectPosition = `${posX}% ${adjustedPosY}%`;
      image.style.display = 'block';
    } else if (container && imageStyles.containerHeight) {
      // Fallback si pas d'image mais conteneur présent
      // Rendre le conteneur flottant
      container.style.position = 'absolute';
      container.style.left = '0';
      container.style.right = '0';
      container.style.margin = '0';
      container.style.top = '50px'; // Top de base de 50px
      container.style.height = imageStyles.containerHeight + 'px';
      container.style.minHeight = imageStyles.containerHeight + 'px';
      container.style.maxHeight = imageStyles.containerHeight + 'px';
      container.style.width = '100%';
      container.offsetHeight;
      if (imageStyles.containerMarginTop && imageStyles.containerMarginTop !== '0px') {
        const marginTopMatch = imageStyles.containerMarginTop.match(/(\d+)px/);
        if (marginTopMatch) {
          container.style.top = marginTopMatch[1] + 'px';
        } else {
          container.style.top = imageStyles.containerMarginTop;
        }
      }
      container.offsetHeight;
    }
  } catch (e) {
    console.warn('⚠️ Impossible de réappliquer les styles d\'image:', e);
  }
}

/**
 * Applique les styles sauvegardés aux éléments du clone
 */
function applySavedStyles(clonedElement, savedSettings) {
  // Couleurs de fond et texte
  if (savedSettings.bgColor) {
    clonedElement.style.background = savedSettings.bgColor;
  }
  if (savedSettings.textColor) {
    clonedElement.style.color = savedSettings.textColor;
  }
  
  // Header orange
  const headerBand = clonedElement.querySelector('.header-orange-band');
  if (headerBand && savedSettings.headerColor) {
    headerBand.style.background = savedSettings.headerColor;
  }
  
  // H2 - Premier et autres
  const firstH2 = clonedElement.querySelector('h2:first-of-type');
  const headerContentH2 = clonedElement.querySelector('.header-content + h2');
  const firstH2MarginTop = savedSettings.firstH2MarginTop || '12px';
  const sectionMargin = savedSettings.sectionMargin || '4px';
  
  [firstH2, headerContentH2].forEach(h2 => {
    if (h2) {
      h2.style.marginTop = firstH2MarginTop;
      if (savedSettings.h2Size) h2.style.fontSize = savedSettings.h2Size;
      if (savedSettings.h2Weight) h2.style.fontWeight = savedSettings.h2Weight;
    }
  });
  
  // Autres h2
  const allH2 = clonedElement.querySelectorAll('h2');
  allH2.forEach((h2, index) => {
    if (index > 0) {
      h2.style.margin = `${sectionMargin} 20px 6px 20px`;
      if (savedSettings.h2Size) h2.style.fontSize = savedSettings.h2Size;
      if (savedSettings.h2Weight) h2.style.fontWeight = savedSettings.h2Weight;
    }
  });
  
  // Typographie texte
  const textElements = clonedElement.querySelectorAll('ul li');
  textElements.forEach(el => {
    if (savedSettings.textSize) el.style.fontSize = savedSettings.textSize;
    if (savedSettings.textWeight) el.style.fontWeight = savedSettings.textWeight;
  });
  
  // Strong
  const strongElements = clonedElement.querySelectorAll('ul li strong');
  strongElements.forEach(el => {
    if (savedSettings.strongWeight) el.style.fontWeight = savedSettings.strongWeight;
  });
  
  // Couleur d'accent
  if (savedSettings.accentColor) {
    const accentElements = clonedElement.querySelectorAll('ul li strong');
    accentElements.forEach(el => {
      el.style.color = savedSettings.accentColor;
    });
    
    // Style pour les puces ::before
    const style = document.createElement('style');
    style.textContent = `#pdfPreview ul li::before { background: ${savedSettings.accentColor} !important; }`;
    clonedElement.ownerDocument.head.appendChild(style);
  }
  
  // Padding contenu
  const contentPadding = savedSettings.contentPadding || '20px';
  clonedElement.querySelectorAll('ul').forEach(el => {
    el.style.marginLeft = contentPadding;
    el.style.marginRight = contentPadding;
  });
  
  // Footer
  const footer = clonedElement.querySelector('.otera-footer');
  if (footer) {
    footer.style.textAlign = 'center';
    footer.style.marginTop = 'auto';
    footer.style.flexShrink = '0';
    footer.style.minHeight = '50px';
    footer.style.padding = `${savedSettings.footerPadding || '36px'} 20px`;
  }
}

/**
 * Configure les badges dans le clone
 */
async function configureBadges(clonedElement) {
  // html2canvas clone le DOM tel qu'il est
  // Les badges peuvent être soit dans badge-group, soit déjà dans pdfPreview
  
  // Chercher les badges partout dans le clone
  let badges = Array.from(clonedElement.querySelectorAll('.badge-instance'));
  
  // Si aucun badge trouvé, il n'y a rien à faire
  if (!badges || badges.length === 0) {
    console.warn('⚠️ Aucun badge trouvé dans le clone pour le PDF');
    return;
  }
  
  // Si les badges sont dans badge-group, les déplacer vers clonedElement
  const badgeGroup = clonedElement.querySelector('.badge-group');
  if (badgeGroup) {
    badges.forEach((badge) => {
      if (badge.parentElement === badgeGroup) {
        clonedElement.appendChild(badge);
      }
    });
    // Re-chercher les badges après déplacement
    badges = Array.from(clonedElement.querySelectorAll('.badge-instance'));
  }
  
  // Récupérer les noms de badges pour faire correspondre par nom plutôt que par index
  const badgeNames = typeof BadgeManager !== 'undefined' && BadgeManager.getBadgeNames
    ? BadgeManager.getBadgeNames()
    : (typeof window.getBadgeNamesArray !== 'undefined' ? window.getBadgeNamesArray() : []);
  
  if (badgeNames.length === 0) {
    // Fallback : utiliser les badges dans l'ordre DOM
    for (let idx = 0; idx < badges.length; idx++) {
      const badge = badges[idx];
      const layout = typeof BadgeManager !== 'undefined' && BadgeManager.getLayoutForIndex 
        ? BadgeManager.getLayoutForIndex(idx)
        : { offsetXPx: 0, offsetYPx: 0, heightPx: 80, colors: {} };
      
      await applyBadgeLayout(badge, layout);
    }
    return;
  }
  
  // Faire correspondre par nom (data-badge) pour garantir le bon layout
  for (let idx = 0; idx < badgeNames.length; idx++) {
    const badgeName = badgeNames[idx];
    const badge = badges.find(img => img.dataset.badge === badgeName);
    if (!badge) {
      console.warn(`⚠️ Badge "${badgeName}" non trouvé dans le clone`);
      continue;
    }
    
    const layout = typeof BadgeManager !== 'undefined' && BadgeManager.getLayoutForIndex 
      ? BadgeManager.getLayoutForIndex(idx)
      : { offsetXPx: 0, offsetYPx: 0, heightPx: 80, colors: {} };
    
    await applyBadgeLayout(badge, layout);
  }
}

/**
 * Applique le layout à un badge individuel
 */
async function applyBadgeLayout(badge, layout) {
  const offsetX = layout.offsetXPx || 0;
  const offsetY = layout.offsetYPx || 0;
  
  // Positionner au centre du PDF avec les offsets
  badge.style.position = 'absolute';
  badge.style.left = `calc(50% + ${offsetX}px)`;
  badge.style.bottom = `calc(50% + ${-offsetY}px)`;
  badge.style.margin = '0';
  badge.style.padding = '0';
  
  // Utiliser la largeur comme base (la valeur du slider devient la largeur)
  badge.style.width = `${layout.heightPx}px`;
  
  // Calculer la hauteur proportionnelle en fonction de la largeur et du ratio d'aspect
  // Si les dimensions naturelles ne sont pas encore disponibles, essayer de les obtenir
  let naturalWidth = badge.naturalWidth || badge.width || 0;
  let naturalHeight = badge.naturalHeight || badge.height || 0;
  
  // Si toujours pas de dimensions, attendre un peu et réessayer
  if (naturalWidth === 0 || naturalHeight === 0) {
    // Essayer de forcer le chargement en attendant un tick
    await new Promise(resolve => setTimeout(resolve, 0));
    naturalWidth = badge.naturalWidth || badge.width || 0;
    naturalHeight = badge.naturalHeight || badge.height || 0;
  }
  
  if (naturalWidth > 0 && naturalHeight > 0) {
    const aspectRatio = naturalHeight / naturalWidth; // Ratio hauteur/largeur
    const calculatedHeight = layout.heightPx * aspectRatio; // Hauteur = largeur × (hauteur/largeur)
    badge.style.height = `${calculatedHeight}px`;
    badge.style.minHeight = 'auto';
    badge.style.maxHeight = 'none';
  } else {
    // Fallback si les dimensions naturelles ne sont toujours pas disponibles
    // Utiliser un ratio par défaut de 0.5 (hauteur = moitié de la largeur)
    badge.style.height = `${layout.heightPx * 0.5}px`;
    badge.style.minHeight = '40px';
    badge.style.maxHeight = 'none';
  }
  
  badge.style.objectFit = 'contain';
  badge.style.zIndex = '10000';
  badge.style.display = 'block';
  badge.style.visibility = 'visible';
  badge.style.opacity = '1';
  badge.style.transform = 'translate(-50%, 50%)';
  badge.style.userSelect = 'none';
  
  // Appliquer les couleurs personnalisées si disponibles
  if (layout.colors && Object.keys(layout.colors).length > 0) {
    // Les couleurs sont déjà appliquées dans le SVG data URI, donc on ne fait rien ici
    // Mais on s'assure que le src est bien défini
  }
}

/**
 * Télécharge le PDF
 */
async function downloadPDF() {
  try {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span>⏳</span><span>Génération du PDF...</span>';

    // Vérifier que les données sont disponibles
    if (!window.currentPdfContent) {
      const pdfContentStr = sessionStorage.getItem('pdfContent');
      if (pdfContentStr) {
        window.currentPdfContent = JSON.parse(pdfContentStr);
      } else {
        throw new Error('Données perdues. Veuillez régénérer la fiche.');
      }
    }

    const element = document.getElementById('pdfPreview');
    if (!element) {
      throw new Error('Élément pdfPreview non trouvé');
    }
    
    // Vérifier le contenu HTML (régénérer seulement si vraiment vide)
    const htmlContent = element.innerHTML;
    if (!htmlContent.trim()) {
      console.warn('⚠️ HTML vide, régénération nécessaire...');
      const html = generateHTML(window.currentPdfContent);
      element.innerHTML = html;
    }
    
    // Dimensions selon le format d'export
    let a5Width = 559;
    let a5Height = 794;
    
    if (window.getExportOptions && window.getDimensionsForFormat) {
      const exportOpts = window.getExportOptions();
      const dims = window.getDimensionsForFormat(exportOpts.format, exportOpts.customWidth, exportOpts.customHeight);
      a5Width = dims.width;
      a5Height = dims.height;
    }
    
    const mobile = Utils.isMobile();
    const elementWidth = mobile ? a5Width : Math.min(element.scrollWidth || a5Width, a5Width);
    const elementHeight = element.scrollHeight || a5Height;
    
    // Scale selon la qualité
    let scale = mobile ? 2 : 3;
    if (window.getExportOptions && window.getScaleForQuality) {
      const exportOpts = window.getExportOptions();
      scale = window.getScaleForQuality(exportOpts.quality);
    }
    
    // NE PAS réappliquer les layouts dans l'original (cela repositionnerait les badges)
    // Les badges sont déjà positionnés correctement dans l'original
    // Ils seront configurés dans le clone via configureBadges()
    
    // Préparer toutes les images
    await prepareImagesForCanvas(element);
    
    // Forcer l'application de tous les styles avant le rendu
    ensureAllStylesApplied(element);
    
    // MODE TEST : Utiliser les dimensions exactes de l'élément pour garantir un rendu identique
    const actualElementWidth = element.offsetWidth || element.clientWidth || a5Width;
    const actualElementHeight = element.scrollHeight || element.offsetHeight || elementHeight;
    
    // Capture avec html2canvas
    // IMPORTANT : Configuration pour préserver les proportions des images
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: false, // Éviter les problèmes de sécurité qui pourraient déformer les images
      logging: false,
      backgroundColor: '#F6E2BE',
      width: actualElementWidth,
      height: actualElementHeight,
      windowWidth: actualElementWidth,
      windowHeight: actualElementHeight,
      x: 0,
      y: 0,
      // Préserver les proportions des images
      imageTimeout: 15000,
      removeContainer: false,
      foreignObjectRendering: false, // Utiliser le rendu natif pour préserver tous les styles
      onclone: async (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById('pdfPreview');
        const originalElement = document.getElementById('pdfPreview');
        
        if (!clonedElement || !originalElement) return;
        
        // Masquer grille et guides si nécessaire
          if (window.getExportOptions) {
            const exportOpts = window.getExportOptions();
            if (!exportOpts.includeGrid) {
              const gridOverlay = clonedDoc.getElementById('figmaGridOverlay');
              if (gridOverlay) gridOverlay.style.display = 'none';
            }
            if (!exportOpts.includeGuides) {
              clonedDoc.querySelectorAll('.figma-guide').forEach(guide => {
                guide.style.display = 'none';
              });
            }
          }
          
        // MODE TEST : Utiliser les dimensions exactes de l'original pour garantir un rendu identique
        const originalWidth = originalElement.offsetWidth || originalElement.clientWidth || a5Width;
        const originalScrollHeight = originalElement.scrollHeight || originalElement.offsetHeight || a5Height;
        const fixedHeight = Math.max(originalScrollHeight, a5Height);
        
        // Configurer les dimensions du clone avec les dimensions exactes de l'original
        // IMPORTANT : Utiliser la largeur de l'original pour que les typographies soient identiques
        clonedElement.style.width = originalWidth + 'px';
        clonedElement.style.maxWidth = originalWidth + 'px';
        clonedElement.style.minWidth = originalWidth + 'px';
        clonedElement.style.padding = '0';
        clonedElement.style.margin = '0';
        clonedElement.style.position = 'relative';
        clonedElement.style.boxSizing = 'border-box';
        clonedElement.style.display = 'flex';
        clonedElement.style.flexDirection = 'column';
        clonedElement.style.alignItems = 'stretch';
        clonedElement.style.justifyContent = 'flex-start';
        
        // Forcer un reflow pour que la largeur soit calculée AVANT reapplyImageStyles
        clonedElement.offsetWidth;
        
        // Ensuite appliquer la hauteur
        clonedElement.style.height = fixedHeight + 'px';
        clonedElement.style.maxHeight = fixedHeight + 'px';
        clonedElement.style.minHeight = fixedHeight + 'px';
        clonedElement.style.overflow = 'visible';
        clonedElement.style.borderRadius = '8px';
        clonedElement.style.background = '#F6E2BE';
          
        // Récupérer les paramètres sauvegardés
          const savedSettings = typeof getSavedSettings === 'function' ? getSavedSettings() : {};
          
        // Capturer les styles critiques de l'image AVANT copyInlineStyles
        const imageStyles = captureImageStyles(originalElement);
          
        // Copier les styles inline (le conteneur d'image est exclu automatiquement)
          copyInlineStyles(originalElement, clonedElement);
          
        // Réappliquer les styles critiques de l'image
        await reapplyImageStyles(clonedElement, imageStyles);
        
        // Copier les styles du header orange et header-content
          const headerBand = clonedElement.querySelector('.header-orange-band');
          const originalHeaderBand = originalElement.querySelector('.header-orange-band');
          if (headerBand && originalHeaderBand) {
            copyInlineStyles(originalHeaderBand, headerBand);
          }
          
          const headerContent = clonedElement.querySelector('.header-orange-band .header-content');
          const originalHeaderContent = originalElement.querySelector('.header-orange-band .header-content');
          if (headerContent && originalHeaderContent) {
            copyInlineStyles(originalHeaderContent, headerContent);
          }
          
        // Copier les styles du h1 et slogan
          const h1 = clonedElement.querySelector('.header-orange-band .header-content h1');
          const originalH1 = originalElement.querySelector('.header-orange-band .header-content h1');
          if (h1 && originalH1) {
            copyInlineStyles(originalH1, h1);
            }
          
          const slogan = clonedElement.querySelector('.header-orange-band .header-content .slogan');
          const originalSlogan = originalElement.querySelector('.header-orange-band .header-content .slogan');
          if (slogan && originalSlogan) {
            copyInlineStyles(originalSlogan, slogan);
          }
          
        // Copier tous les styles des badges de l'original vers le clone
        // pour préserver leur position, taille et autres propriétés exactes
        // Faire correspondre par data-badge pour garantir la bonne correspondance
        
        // D'abord, s'assurer que les badges sont bien dans le clone (pas dans badge-group)
        const badgeGroup = clonedElement.querySelector('.badge-group');
        if (badgeGroup) {
          const badgesInGroup = Array.from(badgeGroup.querySelectorAll('.badge-instance'));
          badgesInGroup.forEach(badge => {
            clonedElement.appendChild(badge);
          });
        }
        
        const originalBadges = Array.from(originalElement.querySelectorAll('.badge-instance'));
        const clonedBadges = Array.from(clonedElement.querySelectorAll('.badge-instance'));
        
        originalBadges.forEach(originalBadge => {
          const badgeName = originalBadge.dataset.badge;
          if (!badgeName) return;
          
          const clonedBadge = clonedBadges.find(b => b.dataset.badge === badgeName);
          if (!clonedBadge) return;
          
          // Copier les styles inline de l'original (qui préservent le ratio d'aspect)
          // plutôt que les computed styles pour éviter l'étirement des SVG
          clonedBadge.style.position = originalBadge.style.position || 'absolute';
          clonedBadge.style.left = originalBadge.style.left || '';
          clonedBadge.style.bottom = originalBadge.style.bottom || '';
          clonedBadge.style.top = originalBadge.style.top || '';
          clonedBadge.style.right = originalBadge.style.right || '';
          
          // Pour width et height, préserver le ratio d'aspect des SVG
          // Si width est défini, utiliser height: auto pour laisser object-fit: contain gérer le ratio
          // Cela évite l'étirement si les valeurs ne correspondent pas exactement au ratio
          clonedBadge.style.width = originalBadge.style.width || 'auto';
          
          // IMPORTANT : Si width est défini en pixels, utiliser height: auto pour préserver le ratio
          // Ne pas copier height en pixels fixes car cela pourrait étirer le SVG
          if (originalBadge.style.width && originalBadge.style.width !== 'auto' && originalBadge.style.width !== '') {
            // Si width est défini, laisser height en auto pour que object-fit: contain préserve le ratio
            clonedBadge.style.height = 'auto';
          } else {
            // Si width n'est pas défini, copier height tel quel
            clonedBadge.style.height = originalBadge.style.height || 'auto';
          }
          
          clonedBadge.style.minWidth = originalBadge.style.minWidth || '';
          clonedBadge.style.maxWidth = originalBadge.style.maxWidth || '';
          clonedBadge.style.minHeight = originalBadge.style.minHeight || '';
          clonedBadge.style.maxHeight = originalBadge.style.maxHeight || '';
          
          // IMPORTANT : object-fit doit être 'contain' pour préserver le ratio d'aspect des SVG
          clonedBadge.style.objectFit = originalBadge.style.objectFit || 'contain';
          
          clonedBadge.style.transform = originalBadge.style.transform || '';
          clonedBadge.style.zIndex = originalBadge.style.zIndex || '10000';
          clonedBadge.style.display = originalBadge.style.display || 'block';
          clonedBadge.style.visibility = originalBadge.style.visibility || 'visible';
          clonedBadge.style.opacity = originalBadge.style.opacity || '1';
          clonedBadge.style.margin = originalBadge.style.margin || '0';
          clonedBadge.style.padding = originalBadge.style.padding || '0';
          clonedBadge.style.userSelect = originalBadge.style.userSelect || 'none';
        });
        
        // NE PAS appeler configureBadges ici car on a déjà copié tous les styles
        // configureBadges réappliquerait les layouts depuis le stockage, ce qui écraserait
        // les styles actuels du badge (position, taille, etc.)
        
        // Appliquer les styles sauvegardés
        applySavedStyles(clonedElement, savedSettings);
        
        // Deuxième copie des styles inline (pour préserver tous les changements)
        // IMPORTANT : Sauvegarder les styles du conteneur d'image avant copyInlineStyles
        const containerBeforeCopy = clonedElement.querySelector('.product-image-container');
        const imageBeforeCopy = containerBeforeCopy?.querySelector('img');
        const savedContainerStyles = containerBeforeCopy ? {
          height: containerBeforeCopy.style.height,
          top: containerBeforeCopy.style.top,
          position: containerBeforeCopy.style.position,
          left: containerBeforeCopy.style.left,
          right: containerBeforeCopy.style.right,
          margin: containerBeforeCopy.style.margin,
          minHeight: containerBeforeCopy.style.minHeight,
          maxHeight: containerBeforeCopy.style.maxHeight,
          width: containerBeforeCopy.style.width,
          transform: containerBeforeCopy.style.transform,
          display: containerBeforeCopy.style.display
        } : null;
        const savedImageStyles = imageBeforeCopy ? {
          width: imageBeforeCopy.style.width,
          height: imageBeforeCopy.style.height,
          transform: imageBeforeCopy.style.transform,
          filter: imageBeforeCopy.style.filter,
          objectFit: imageBeforeCopy.style.objectFit,
          objectPosition: imageBeforeCopy.style.objectPosition,
          clipPath: imageBeforeCopy.style.clipPath,
          display: imageBeforeCopy.style.display
        } : null;
        
        copyInlineStyles(originalElement, clonedElement);
        
        // Restaurer les styles du conteneur d'image après copyInlineStyles pour éviter qu'ils soient écrasés
        if (containerBeforeCopy && savedContainerStyles) {
          if (savedContainerStyles.height) containerBeforeCopy.style.height = savedContainerStyles.height;
          if (savedContainerStyles.top) containerBeforeCopy.style.top = savedContainerStyles.top;
          if (savedContainerStyles.position) containerBeforeCopy.style.position = savedContainerStyles.position;
          if (savedContainerStyles.left) containerBeforeCopy.style.left = savedContainerStyles.left;
          if (savedContainerStyles.right) containerBeforeCopy.style.right = savedContainerStyles.right;
          if (savedContainerStyles.margin) containerBeforeCopy.style.margin = savedContainerStyles.margin;
          if (savedContainerStyles.minHeight) containerBeforeCopy.style.minHeight = savedContainerStyles.minHeight;
          if (savedContainerStyles.maxHeight) containerBeforeCopy.style.maxHeight = savedContainerStyles.maxHeight;
          if (savedContainerStyles.width) containerBeforeCopy.style.width = savedContainerStyles.width;
          if (savedContainerStyles.transform) containerBeforeCopy.style.transform = savedContainerStyles.transform;
          if (savedContainerStyles.display) containerBeforeCopy.style.display = savedContainerStyles.display;
        }
        
        // Restaurer les styles de l'image après copyInlineStyles
        if (imageBeforeCopy && savedImageStyles) {
          if (savedImageStyles.width) imageBeforeCopy.style.width = savedImageStyles.width;
          if (savedImageStyles.height) imageBeforeCopy.style.height = savedImageStyles.height;
          if (savedImageStyles.transform) imageBeforeCopy.style.transform = savedImageStyles.transform;
          if (savedImageStyles.filter) imageBeforeCopy.style.filter = savedImageStyles.filter;
          if (savedImageStyles.objectFit) imageBeforeCopy.style.objectFit = savedImageStyles.objectFit;
          if (savedImageStyles.objectPosition) imageBeforeCopy.style.objectPosition = savedImageStyles.objectPosition;
          if (savedImageStyles.clipPath) imageBeforeCopy.style.clipPath = savedImageStyles.clipPath;
          if (savedImageStyles.display) imageBeforeCopy.style.display = savedImageStyles.display;
        }
        
        // Réappliquer les styles critiques de l'image après le deuxième copyInlineStyles
        await reapplyImageStyles(clonedElement, imageStyles);
        
        // Préserver spécifiquement tous les styles computed pour les éléments [data-editable]
        // Cela garantit que les styles appliqués via les panneaux Figma sont préservés
        // IMPORTANT : Utiliser le document original pour getComputedStyle car onclone utilise un document cloné
        const clonedEditableElements = clonedElement.querySelectorAll('[data-editable]');
        const originalEditableElements = originalElement.querySelectorAll('[data-editable]');
        
        for (let i = 0; i < Math.min(clonedEditableElements.length, originalEditableElements.length); i++) {
          const originalEl = originalEditableElements[i];
          const clonedEl = clonedEditableElements[i];
          
          if (originalEl && clonedEl) {
            try {
              // Toujours copier les computed styles importants pour garantir la préservation
              // même si des styles inline existent (pour s'assurer que tout est préservé)
              const computedStyle = window.getComputedStyle(originalEl);
              
              // Copier les propriétés critiques qui peuvent être modifiées via Figma
              // (marges, padding, couleurs, typographie)
              if (computedStyle.marginTop && computedStyle.marginTop !== '0px') {
                clonedEl.style.marginTop = computedStyle.marginTop;
              }
              if (computedStyle.marginRight && computedStyle.marginRight !== '0px') {
                clonedEl.style.marginRight = computedStyle.marginRight;
              }
              if (computedStyle.marginBottom && computedStyle.marginBottom !== '0px') {
                clonedEl.style.marginBottom = computedStyle.marginBottom;
              }
              if (computedStyle.marginLeft && computedStyle.marginLeft !== '0px') {
                clonedEl.style.marginLeft = computedStyle.marginLeft;
              }
              if (computedStyle.paddingTop && computedStyle.paddingTop !== '0px') {
                clonedEl.style.paddingTop = computedStyle.paddingTop;
              }
              if (computedStyle.paddingRight && computedStyle.paddingRight !== '0px') {
                clonedEl.style.paddingRight = computedStyle.paddingRight;
              }
              if (computedStyle.paddingBottom && computedStyle.paddingBottom !== '0px') {
                clonedEl.style.paddingBottom = computedStyle.paddingBottom;
              }
              if (computedStyle.paddingLeft && computedStyle.paddingLeft !== '0px') {
                clonedEl.style.paddingLeft = computedStyle.paddingLeft;
              }
              // Préserver aussi les couleurs et la typographie
              if (computedStyle.color && computedStyle.color !== 'rgb(0, 0, 0)') {
                clonedEl.style.color = computedStyle.color;
              }
              if (computedStyle.fontSize) {
                clonedEl.style.fontSize = computedStyle.fontSize;
              }
              if (computedStyle.fontWeight) {
                clonedEl.style.fontWeight = computedStyle.fontWeight;
              }
            } catch (e) {
              // Ignorer les erreurs
            }
          }
        }
          
        // Styles finaux pour le PDF
          clonedElement.style.borderRadius = '0';
          const headerBandAfter = clonedElement.querySelector('.header-orange-band');
          if (headerBandAfter) {
            headerBandAfter.style.borderRadius = '0';
            headerBandAfter.style.borderTopLeftRadius = '0';
            headerBandAfter.style.borderTopRightRadius = '0';
        }
      }
    });

    const imgData = canvas.toDataURL('image/png', 0.95);
    const { jsPDF } = window.jspdf;

    // Déterminer le format jsPDF
    let jsPdfFormat = 'a5';
    let pdfWidth = 148;
    let pdfHeight = 210;
    let isCustomFormat = false;
    
    if (window.getExportOptions) {
      const exportOpts = window.getExportOptions();
      switch (exportOpts.format) {
        case 'A5':
          jsPdfFormat = 'a5';
          pdfWidth = 148;
          pdfHeight = 210;
          break;
        case 'A4':
          jsPdfFormat = 'a4';
          pdfWidth = 210;
          pdfHeight = 297;
          break;
        case 'custom':
          pdfWidth = exportOpts.customWidth * 0.264583;
          pdfHeight = exportOpts.customHeight * 0.264583;
          isCustomFormat = true;
          break;
      }
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: isCustomFormat ? [pdfWidth, pdfHeight] : jsPdfFormat,
      compress: true
    });

    const actualWidth = canvas.width / scale;
    const actualHeight = canvas.height / scale;
    const pxToMm = 25.4 / 96;
    const imgWidthMm = actualWidth * pxToMm;
    const imgHeightMm = actualHeight * pxToMm;
    const ratio = pdfWidth / imgWidthMm;
    const renderWidth = pdfWidth;
    const renderHeight = imgHeightMm * ratio;
    const offsetX = 0;
    const offsetY = renderHeight < pdfHeight ? (pdfHeight - renderHeight) / 2 : 0;

    pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight, '', 'FAST');

    const filename = `Fiche_${(window.currentProductName || 'Produit').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    pdf.save(filename);

    setTimeout(() => {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<span>⬇️</span><span>Télécharger le PDF</span>';
    }, 1000);

  } catch (err) {
    console.error('❌ Erreur PDF:', err);
    alert('❌ Erreur lors de la génération du PDF: ' + err.message);
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = '<span>⬇️</span><span>Télécharger le PDF</span>';
  }
}

window.downloadPDF = downloadPDF;
window.convertImageToDataURI = convertImageToDataURI;
window.convertImageToBase64OnLoad = convertImageToBase64OnLoad;
