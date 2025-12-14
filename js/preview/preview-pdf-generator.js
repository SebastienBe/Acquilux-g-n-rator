// ========================================
// GÉNÉRATION PDF
// ========================================

/**
 * Convertit une image en base64 au chargement
 */
async function convertImageToBase64OnLoad(img) {
  return new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) {
      // Image déjà chargée
      convertImageToBase64(img).then(resolve);
    } else {
      img.onload = () => convertImageToBase64(img).then(resolve);
      img.onerror = () => resolve(null); // Si l'image ne charge pas, retourner null
    }
  });
}

/**
 * Convertit une image en base64
 */
function convertImageToBase64(img) {
  return new Promise((resolve) => {
    // Si l'image est déjà en base64, la retourner directement
    if (img.src && img.src.startsWith('data:')) {
      resolve(img.src);
      return;
    }

    // Pour les images file://, essayer d'utiliser XMLHttpRequest avec blob
    if (img.src && img.src.startsWith('file://')) {
      // Malheureusement, XMLHttpRequest ne fonctionne pas avec file://
      // Il faut utiliser un serveur local
      console.warn('⚠️ Impossible de convertir une image file:// en base64. Utilisez un serveur local.');
      resolve(null);
      return;
    }

    // Pour les autres images, essayer avec canvas
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0);
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
 * Prépare les images pour html2canvas
 */
async function prepareImagesForCanvas(element) {
  const images = element.querySelectorAll('img');
  const imagePromises = [];
  
  for (const img of images) {
    if (img.src && !img.src.startsWith('data:')) {
      imagePromises.push(
        convertImageToDataURI(img)
          .then(dataURI => {
            img.src = dataURI;
            console.log('✅ Image convertie en data URI:', img.alt || 'sans alt');
          })
          .catch(err => {
            console.error('❌ Erreur conversion image:', err);
          })
      );
    }
  }
  
  // Attendre que toutes les images soient converties
  await Promise.all(imagePromises);
  
  // Attendre un peu pour que les images soient bien chargées dans le DOM
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Télécharge le PDF
 */
async function downloadPDF() {
  try {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span>⏳</span><span>Génération du PDF...</span>';

    // Vérifier que les données sont toujours disponibles
    if (!window.currentPdfContent) {
      // Essayer de recharger depuis sessionStorage
      const pdfContentStr = sessionStorage.getItem('pdfContent');
      if (pdfContentStr) {
        window.currentPdfContent = JSON.parse(pdfContentStr);
        console.log('🔄 Données rechargées depuis sessionStorage pour PDF');
      } else {
        throw new Error('Données perdues. Veuillez régénérer la fiche.');
      }
    }

    // Vérifier que le contenu HTML est correct dans le DOM
    const element = document.getElementById('pdfPreview');
    if (!element) {
      throw new Error('Élément pdfPreview non trouvé');
    }
    
    const htmlContent = element.innerHTML;
    const mobile = Utils.isMobile();
    console.log('📱 Mode mobile détecté:', mobile);
    
    console.log('📄 Vérification avant génération PDF:');
    console.log('- Élément trouvé:', !!element);
    console.log('- HTML contient "Caractéristiques":', htmlContent.includes('Caractéristiques'));
    console.log('- Nombre de <li> dans caractéristiques:', (htmlContent.match(/<li><strong>.*?<\/strong> : .*?<\/li>/g) || []).length);
    console.log('- Données originales disponibles:', !!window.currentPdfContent);
    console.log('- Caractéristiques dans données:', window.currentPdfContent?.caracteristiques?.length || 0);

    // NE PAS régénérer le HTML sauf en cas d'urgence absolue
    // La régénération efface tous les styles inline appliqués avec les modals Figma
    // Vérifier seulement si le HTML est vraiment vide ou complètement cassé
    const hasContent = htmlContent.trim().length > 0;
    const hasCharacteristics = htmlContent.includes('Caractéristiques') || 
                              (htmlContent.match(/<li><strong>.*?<\/strong> : .*?<\/li>/g) || []).length > 0;
    
    if (!hasContent) {
      // Seulement si le HTML est complètement vide, régénérer
      console.warn('⚠️ HTML complètement vide, régénération nécessaire...');
      const html = generateHTML(window.currentPdfContent);
      element.innerHTML = html;
      console.log('✅ HTML régénéré (mais tous les styles inline sont perdus)');
    } else if (!hasCharacteristics && window.currentPdfContent?.caracteristiques?.length > 0) {
      // Seulement si les caractéristiques sont vraiment manquantes ET qu'elles existent dans les données
      console.warn('⚠️ Caractéristiques manquantes dans le HTML mais présentes dans les données');
      // Ne pas régénérer automatiquement - cela effacerait les styles
      // À la place, juste logger un avertissement
      console.warn('⚠️ Les caractéristiques ne seront peut-être pas dans le PDF, mais les styles sont préservés');
    }
    
    // Dimensions selon le format d'export si disponible
    let a5Width = 559;   // px (148mm à 96 DPI) - A5 par défaut
    let a5Height = 794;  // px (210mm à 96 DPI) - A5 par défaut
    
    if (window.getExportOptions && window.getDimensionsForFormat) {
      const exportOpts = window.getExportOptions();
      const dims = window.getDimensionsForFormat(exportOpts.format, exportOpts.customWidth, exportOpts.customHeight);
      a5Width = dims.width;
      a5Height = dims.height;
    }
    
    // Sur mobile, on force les dimensions A5 pour la capture
    // Sur desktop, on utilise les dimensions réelles mais limitées à A5
    const elementWidth = mobile ? a5Width : Math.min(element.scrollWidth || a5Width, a5Width);
    const elementHeight = element.scrollHeight || a5Height;
    
    // Scale adapté selon la qualité d'export si disponible
    let scale = mobile ? 2 : 3;
    if (window.getExportOptions && window.getScaleForQuality) {
      const exportOpts = window.getExportOptions();
      scale = window.getScaleForQuality(exportOpts.quality);
    }
    
    console.log('📐 Dimensions:', {
      mobile,
      elementWidth,
      elementHeight,
      scale,
      a5Width,
      a5Height,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight
    });

    // Préparer toutes les images avant la capture (conversion en data URI)
    // Cela inclut les badges avec leurs couleurs modifiées
    await prepareImagesForCanvas(element);
    
    // S'assurer que les badges avec couleurs modifiées sont bien convertis
    // Les badges avec couleurs modifiées utilisent déjà des data URI, mais vérifions
    const badgeImgs = element.querySelectorAll('.badge-instance');
    for (const badgeImg of badgeImgs) {
      const imgSrc = badgeImg.currentSrc || badgeImg.src || '';
      // Si c'est une blob URL, la convertir en data URI
      if (imgSrc.startsWith('blob:')) {
        try {
          const response = await fetch(imgSrc);
          const blob = await response.blob();
          const reader = new FileReader();
          const dataUri = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          badgeImg.src = dataUri;
          console.log('✅ Badge blob converti en data URI pour PDF:', badgeImg.alt || 'sans alt');
        } catch (err) {
          console.warn('⚠️ Erreur conversion badge blob pour PDF:', err);
        }
      } else if (imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
        try {
          const dataUri = await convertImageToDataURI(badgeImg);
          if (dataUri) {
            badgeImg.src = dataUri;
            console.log('✅ Badge HTTP converti en data URI pour PDF:', badgeImg.alt || 'sans alt');
          }
        } catch (err) {
          console.warn('⚠️ Erreur conversion badge HTTP pour PDF:', err);
        }
      }
    }
    
    // Attendre un peu pour que les images soient bien chargées
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Capture avec html2canvas - Dimensions selon le format sélectionné
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#F6E2BE', // Fond beige Otera identité
      width: a5Width,  // Largeur selon format (A5: 559px, A4: 794px, custom: selon dimensions)
      height: elementHeight, // Hauteur dynamique selon le contenu
      windowWidth: a5Width,
      windowHeight: elementHeight,
      x: 0,
      y: 0,
      onclone: async (clonedDoc) => {
        // Forcer des dimensions exactes dans le clone pour cohérence
        const clonedElement = clonedDoc.getElementById('pdfPreview');
        const originalElement = document.getElementById('pdfPreview');
        
        if (clonedElement && originalElement) {
          // Copier tous les styles inline de l'élément original vers le clone
          // Cela préserve tous les changements faits avec les modals Figma
          function copyInlineStyles(source, target) {
            if (!source || !target) return;
            
            // Copier les styles inline de l'élément
            if (source.style && source.style.cssText) {
              target.style.cssText = source.style.cssText;
            }
            
            // Copier récursivement pour tous les enfants
            const sourceChildren = source.children || [];
            const targetChildren = target.children || [];
            
            for (let i = 0; i < Math.min(sourceChildren.length, targetChildren.length); i++) {
              copyInlineStyles(sourceChildren[i], targetChildren[i]);
            }
            
            // Copier aussi pour les nodes (pour capturer les text nodes si nécessaire)
            const sourceNodes = source.childNodes || [];
            const targetNodes = target.childNodes || [];
            
            for (let i = 0; i < Math.min(sourceNodes.length, targetNodes.length); i++) {
              if (sourceNodes[i].nodeType === 1 && targetNodes[i].nodeType === 1) { // Element nodes
                copyInlineStyles(sourceNodes[i], targetNodes[i]);
              }
            }
          }
          
          // Masquer la grille et les guides si nécessaire
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
          
          // Forcer exactement les dimensions (selon le format)
          clonedElement.style.width = a5Width + 'px';
          clonedElement.style.height = 'auto';
          clonedElement.style.maxWidth = a5Width + 'px';
          clonedElement.style.minWidth = a5Width + 'px';
          clonedElement.style.maxHeight = a5Height + 'px';
          clonedElement.style.minHeight = a5Height + 'px';
          clonedElement.style.height = 'auto';
          clonedElement.style.padding = '0';
          clonedElement.style.overflow = 'visible'; // Important : visible pour que le header orange qui sort soit capturé
          clonedElement.style.margin = '0';
          clonedElement.style.position = 'relative';
          clonedElement.style.boxSizing = 'border-box';
          clonedElement.style.borderRadius = '8px'; // Garder les arrondis comme dans la preview
          clonedElement.style.background = '#F6E2BE'; // Fond beige
          
          // S'assurer que le contenu est bien aligné
          clonedElement.style.display = 'flex';
          clonedElement.style.flexDirection = 'column';
          clonedElement.style.alignItems = 'stretch';
          clonedElement.style.justifyContent = 'flex-start';
          
          // Récupérer les paramètres sauvegardés une seule fois
          const savedSettings = typeof getSavedSettings === 'function' ? getSavedSettings() : {};
          
          // Appliquer la couleur de fond sauvegardée
          if (savedSettings.bgColor) {
            clonedElement.style.background = savedSettings.bgColor;
          }
          
          // Appliquer la couleur de texte sauvegardée
          if (savedSettings.textColor) {
            clonedElement.style.color = savedSettings.textColor;
          }
          
          // Copier les styles inline de tous les éléments pour préserver l'apparence exacte
          copyInlineStyles(originalElement, clonedElement);
          
          // S'assurer que le header orange garde sa rotation et son positionnement
          const headerBand = clonedElement.querySelector('.header-orange-band');
          const originalHeaderBand = originalElement.querySelector('.header-orange-band');
          if (headerBand && originalHeaderBand) {
            // Copier tous les styles inline du header orange original
            copyInlineStyles(originalHeaderBand, headerBand);
            
            // Appliquer la couleur de header sauvegardée si elle existe
            if (savedSettings.headerColor) {
              headerBand.style.background = savedSettings.headerColor;
            }
          }
          
          // S'assurer que le header-content garde son positionnement exact
          const headerContent = clonedElement.querySelector('.header-orange-band .header-content');
          const originalHeaderContent = originalElement.querySelector('.header-orange-band .header-content');
          if (headerContent && originalHeaderContent) {
            // Copier tous les styles inline du header-content original
            copyInlineStyles(originalHeaderContent, headerContent);
          }
          
          // S'assurer que le badge (image) est bien positionné en bas à gauche
          const badgeGroup = clonedElement.querySelector('.badge-group');
          if (badgeGroup) {
            badgeGroup.style.position = 'absolute';
            badgeGroup.style.display = 'flex';
            badgeGroup.style.alignItems = 'flex-end';
            badgeGroup.style.gap = '12px';
            badgeGroup.style.margin = '0';
            badgeGroup.style.padding = '0';
            badgeGroup.style.zIndex = '100';
            
            // Appliquer les layouts badges stockés avec les couleurs
            const badges = badgeGroup.querySelectorAll('.badge-instance');
            badges.forEach((badge, idx) => {
              const layout = typeof BadgeManager !== 'undefined' && BadgeManager.getLayoutForIndex 
                ? BadgeManager.getLayoutForIndex(idx)
                : { xPercent: 3, yPercent: 0, heightPx: 80, colors: {} };
              badge.style.position = 'absolute';
              badge.style.left = `${Utils.clamp(layout.xPercent, 0, 100)}%`;
              badge.style.bottom = `${Utils.clamp(layout.yPercent, 0, 100)}%`;
              badge.style.margin = '0';
              badge.style.padding = '0';
              badge.style.height = `${layout.heightPx}px`;
              badge.style.maxWidth = '240px';
              badge.style.objectFit = 'contain';
              badge.style.zIndex = '100';
              
              // Les couleurs sont déjà appliquées dans le src (data URI) de l'image originale
              // Le clone hérite automatiquement du src avec les couleurs modifiées
              // S'assurer que l'image est bien en data URI
              if (badge.src && !badge.src.startsWith('data:')) {
                // Si l'image n'est pas encore en data URI, essayer de la convertir
                // (normalement cela devrait déjà être fait par prepareImagesForCanvas)
                console.warn('⚠️ Badge pas encore en data URI dans le clone:', badge.src);
              }
            });
          }
          
          // Copier les styles inline du h1 et slogan pour préserver leur apparence exacte
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
          
          // Appliquer les espacements sauvegardés pour les h2
          
          // Premier h2 - Centrage content
          const firstH2 = clonedElement.querySelector('h2:first-of-type');
          const headerContentH2 = clonedElement.querySelector('.header-content + h2');
          const firstH2MarginTop = savedSettings.firstH2MarginTop || '12px';
          if (firstH2) {
            firstH2.style.marginTop = firstH2MarginTop;
            // Appliquer la taille et le poids sauvegardés
            if (savedSettings.h2Size) {
              firstH2.style.fontSize = savedSettings.h2Size;
            }
            if (savedSettings.h2Weight) {
              firstH2.style.fontWeight = savedSettings.h2Weight;
            }
          }
          if (headerContentH2) {
            headerContentH2.style.marginTop = firstH2MarginTop;
            if (savedSettings.h2Size) {
              headerContentH2.style.fontSize = savedSettings.h2Size;
            }
            if (savedSettings.h2Weight) {
              headerContentH2.style.fontWeight = savedSettings.h2Weight;
            }
          }
          
          // Autres h2 - Marge sections
          const allH2 = clonedElement.querySelectorAll('h2');
          const sectionMargin = savedSettings.sectionMargin || '4px';
          allH2.forEach((h2, index) => {
            if (index > 0) {
              h2.style.margin = `${sectionMargin} 20px 6px 20px`;
              // Appliquer la taille et le poids sauvegardés
              if (savedSettings.h2Size) {
                h2.style.fontSize = savedSettings.h2Size;
              }
              if (savedSettings.h2Weight) {
                h2.style.fontWeight = savedSettings.h2Weight;
              }
            }
          });
          
          // Appliquer les styles de typographie au texte (li, recipe p, recipe em)
          const textElements = clonedElement.querySelectorAll('ul li, .recipe p, .recipe em');
          textElements.forEach(el => {
            if (savedSettings.textSize) {
              el.style.fontSize = savedSettings.textSize;
            }
            if (savedSettings.textWeight) {
              el.style.fontWeight = savedSettings.textWeight;
            }
          });
          
          // Appliquer les styles aux strong
          const strongElements = clonedElement.querySelectorAll('ul li strong');
          strongElements.forEach(el => {
            if (savedSettings.strongWeight) {
              el.style.fontWeight = savedSettings.strongWeight;
            }
          });
          
          // Appliquer la couleur d'accent
          if (savedSettings.accentColor) {
            const accentElements = clonedElement.querySelectorAll('ul li strong, .recipe strong, .recipe p strong');
            accentElements.forEach(el => {
              el.style.color = savedSettings.accentColor;
            });
            // Pour les puces ::before, créer un style dans le head du clone
            const style = clonedDoc.createElement('style');
            style.textContent = `
              #pdfPreview ul li::before {
                background: ${savedSettings.accentColor} !important;
              }
            `;
            clonedDoc.head.appendChild(style);
            // Appliquer aussi aux bordures des recettes
            const recipes = clonedElement.querySelectorAll('.recipe');
            recipes.forEach(recipe => {
              recipe.style.borderLeftColor = savedSettings.accentColor;
            });
          }
          
          // Padding contenu (ul et .recipe)
          const contentPadding = savedSettings.contentPadding || '20px';
          const uls = clonedElement.querySelectorAll('ul');
          const recipes = clonedElement.querySelectorAll('.recipe');
          [...uls, ...recipes].forEach(el => {
            el.style.marginLeft = contentPadding;
            el.style.marginRight = contentPadding;
          });
          
          // Footer centré - S'assurer qu'il est visible avec le padding sauvegardé
          const footer = clonedElement.querySelector('.otera-footer');
          if (footer) {
            footer.style.textAlign = 'center';
            footer.style.marginTop = 'auto';
            footer.style.flexShrink = '0';
            footer.style.minHeight = '50px';
            const footerPadding = savedSettings.footerPadding || '36px';
            footer.style.padding = `${footerPadding} 20px`;
          }
          
          // IMPORTANT: Copier TOUS les styles inline de l'original vers le clone APRÈS toutes les autres modifications
          // Cela préserve tous les changements faits avec les modals Figma (couleurs, tailles, paddings, etc.)
          copyInlineStyles(originalElement, clonedElement);
          console.log('✅ Styles inline copiés depuis l\'original vers le clone pour le PDF');
          
          // Réappliquer quelques styles spécifiques pour le PDF qui doivent prévaloir sur les styles inline
          // (comme border-radius: 0 pour le PDF)
          clonedElement.style.borderRadius = '0';
          const headerBandAfter = clonedElement.querySelector('.header-orange-band');
          if (headerBandAfter) {
            headerBandAfter.style.borderRadius = '0';
            headerBandAfter.style.borderTopLeftRadius = '0';
            headerBandAfter.style.borderTopRightRadius = '0';
          }
        }
      }
    });

    const imgData = canvas.toDataURL('image/png', 0.95);
    const { jsPDF } = window.jspdf;

    // Déterminer le format jsPDF selon les options d'export
    let jsPdfFormat = 'a5'; // par défaut
    let pdfWidth = 148; // A5 en mm
    let pdfHeight = 210; // A5 en mm
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
          // Pour format personnalisé, convertir px en mm (1px = 0.264583mm à 96 DPI)
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
    let offsetY = 0;
    if (renderHeight < pdfHeight) {
      offsetY = (pdfHeight - renderHeight) / 2;
    }

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
window.convertImageToBase64OnLoad = convertImageToBase64OnLoad;

