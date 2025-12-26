// ========================================
// MODULE GESTION DES ATOUTS/BADGES
// ========================================
(function () {
  'use strict';

  const badgeChoicesContainer = document.getElementById('badgeChoices');
  const badgeLayoutContainer = document.getElementById('badgeLayoutContainer');
  const DEFAULT_HEIGHT = 80;
  
  // Couleurs disponibles pour les badges
  const AVAILABLE_COLORS = {
    orange: '#E65B0C', // Orange actuel
    beige: '#F6E2BE',  // Beige du background
    blue: '#B5DBE8',   // Bleu clair
    darkRed: '#60191A', // Rouge foncé
    white: '#FFF',     // Blanc
    black: '#000'      // Noir
  };

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================

  /**
   * Récupère les badges sélectionnés depuis sessionStorage
   * @returns {Array<string>} Tableau des noms de badges
   */
  function getBadgeNamesArray() {
    const stored = sessionStorage.getItem('badgeNames');
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('❌ Erreur lors du parsing des badges:', e);
      }
    }
    
    const single = sessionStorage.getItem('badgeName');
    return single ? [single] : [];
  }

  /**
   * Extrait un badge unique depuis pdfContent
   * @param {Object} pdfContent - Contenu PDF
   * @returns {string} Nom du badge ou chaîne vide
   */
  function getBadgeNameFromContent(pdfContent) {
    return (
      pdfContent?.badge ||
      pdfContent?.badgeName ||
      pdfContent?.atout ||
      pdfContent?.atoutName ||
      pdfContent?.badgeSlug ||
      pdfContent?.badge_slug ||
      ''
    );
  }

  /**
   * Extrait les badges depuis pdfContent (tableau ou badge unique)
   * @param {Object} pdfContent - Contenu PDF
   * @returns {Array<string>} Tableau des badges
   */
  function extractBadgesFromContent(pdfContent) {
    if (!pdfContent) return [];
    
    // Si c'est un tableau
    if (pdfContent.badges && Array.isArray(pdfContent.badges) && pdfContent.badges.length > 0) {
      return pdfContent.badges.filter(Boolean).map(b => typeof b === 'string' ? b : (b.nom || b.name || b.slug || b.label || String(b)));
    }
    
    // Sinon, chercher un badge unique
    const singleBadge = getBadgeNameFromContent(pdfContent);
    return singleBadge ? [singleBadge] : [];
  }

  /**
   * Normalise un badge (chaîne ou objet) en chaîne
   * @param {string|Object} badge - Badge à normaliser
   * @returns {string|null} Nom du badge normalisé
   */
  function normalizeBadge(badge) {
    if (!badge) return null;
    if (typeof badge === 'string') return badge;
    if (typeof badge === 'object') {
      return badge.nom || badge.name || badge.slug || badge.label || badge.titre || null;
    }
    return String(badge);
  }

  // ========================================
  // CHARGEMENT DES BADGES DEPUIS L'API
  // ========================================

  /**
   * Charge la liste des badges disponibles depuis l'API
   * @param {Function} onChange - Callback appelé quand la sélection change
   */
  async function loadBadges(onChange) {
    
    if (!badgeChoicesContainer) {
      console.error('❌ BadgeManager: badgeChoicesContainer non trouvé dans le DOM');
      return;
    }
    
    if (typeof fetchBadgeList !== 'function') {
      console.error('❌ BadgeManager: fetchBadgeList n\'est pas une fonction. Vérifiez que api.js est chargé avant preview-badges.js');
      return;
    }

    try {
      badgeChoicesContainer.innerHTML = '<span class="badge-choices-loading">Chargement des badges...</span>';

      // Charger les badges depuis l'API
      const badges = await fetchBadgeList();
      
      if (!Array.isArray(badges) || badges.length === 0) {
        badgeChoicesContainer.innerHTML = '<span class="badge-choices-loading">Aucun badge disponible</span>';
        return;
      }

      // Normaliser les badges
      const options = badges.map(badge => {
        const normalized = normalizeBadge(badge);
        if (!normalized) return null;
        
        const label = typeof badge === 'object' 
          ? (badge.nom || badge.name || badge.label || badge.titre || normalized)
          : normalized;
        
        return { value: normalized, label };
      }).filter(o => o && o.value);

      // Dédupliquer
      const seen = new Set();
      const uniqueOptions = options.filter(o => {
        if (seen.has(o.value)) return false;
        seen.add(o.value);
        return true;
      });

      if (uniqueOptions.length === 0) {
        badgeChoicesContainer.innerHTML = '<span class="badge-choices-loading">Aucun badge disponible</span>';
        return;
      }

      // Récupérer les badges sélectionnés actuellement
      const selectedBadges = getBadgeNamesArray();
      
      // URL de base pour les images de badges
      const badgeImageBaseUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_BADGE_IMAGE_URL) 
        ? CONFIG.N8N_BADGE_IMAGE_URL 
        : 'http://localhost:5678/webhook/fiche_produit/badge/get';

      // Organiser les badges par catégorie
      const badgesWithAtout = uniqueOptions.filter(o => o.value.includes('_atout') && !o.value.includes('logo_'));
      const badgesWithLogo = uniqueOptions.filter(o => o.value.includes('logo_'));
      const badgesWithoutSpecial = uniqueOptions.filter(o => !o.value.includes('_atout') && !o.value.includes('logo_'));

      // Fonction pour générer le HTML d'un badge
      const generateBadgeHTML = (option) => {
        const isChecked = selectedBadges.includes(option.value) ? 'checked' : '';
        const badgeImageUrl = `${badgeImageBaseUrl}?name=${encodeURIComponent(option.value)}&cb=${Date.now()}`;
        const Utils = window.Utils || { escapeHtml: (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') };
        
        return `
          <label class="badge-choice">
            <input type="checkbox" value="${Utils.escapeHtml(option.value)}" ${isChecked}>
            <div class="badge-choice-content">
              <img src="${badgeImageUrl}" alt="${Utils.escapeHtml(option.label)}" class="badge-choice-image" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
              <span class="badge-choice-label" style="display: none;">${Utils.escapeHtml(option.label)}</span>
            </div>
          </label>
        `;
      };

      // Fonction pour générer un dossier dépliable
      const generateFolderHTML = (badges, folderTitle, folderIcon = '📁') => {
        if (badges.length === 0) return '';
        const allBadgesHTML = badges.map(generateBadgeHTML).join('');
        return `
          <div class="badge-folder">
            <button class="badge-folder-toggle" type="button" aria-expanded="false">
              <span class="badge-folder-icon">${folderIcon}</span>
              <span class="badge-folder-title">${folderTitle}</span>
              <span class="badge-folder-count">${badges.length}</span>
              <span class="badge-folder-arrow">▼</span>
            </button>
            <div class="badge-folder-content" style="display: none;">
              <div class="badge-folder-items">
                ${allBadgesHTML}
              </div>
            </div>
          </div>
        `;
      };

      // Générer le HTML final
      const logoFolderHTML = generateFolderHTML(badgesWithLogo, 'Logo (logo_)', '🖼️');
      const atoutFolderHTML = generateFolderHTML(badgesWithAtout, 'Atouts (_atout)', '📁');
      const otherBadgesHTML = badgesWithoutSpecial.map(generateBadgeHTML).join('');

      badgeChoicesContainer.innerHTML = logoFolderHTML + atoutFolderHTML + otherBadgesHTML;

      // Gérer l'ouverture/fermeture des dossiers
      badgeChoicesContainer.querySelectorAll('.badge-folder-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
          const folder = toggle.closest('.badge-folder');
          const content = folder?.querySelector('.badge-folder-content');
          if (!content) return;
          
          const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
          content.style.display = isExpanded ? 'none' : 'block';
          toggle.setAttribute('aria-expanded', !isExpanded);
          toggle.querySelector('.badge-folder-arrow').textContent = isExpanded ? '▼' : '▲';
        });
      });

      // Gérer les changements de sélection
      badgeChoicesContainer.addEventListener('change', async (e) => {
        if (e.target.type === 'checkbox') {
          const selected = Array.from(badgeChoicesContainer.querySelectorAll('input[type="checkbox"]:checked'))
            .map(input => input.value)
            .filter(Boolean);
          
          // Sauvegarder dans sessionStorage
          if (selected.length > 0) {
            sessionStorage.setItem('badgeNames', JSON.stringify(selected));
            sessionStorage.setItem('badgeName', selected[0]); // Compatibilité
          } else {
            sessionStorage.removeItem('badgeNames');
            sessionStorage.removeItem('badgeName');
          }
          
          // Mettre à jour les contrôles de layout
          ensureLayoutsForBadges(selected.length);
          const pdfPreviewEl = document.getElementById('pdfPreview');
          await renderBadgeLayoutControls(selected, pdfPreviewEl);
          updateBadgeCount(selected.length);
          
          // Appeler le callback pour régénérer la preview
          if (typeof onChange === 'function') {
            onChange(selected);
          } else {
            // Régénération manuelle si le callback n'est pas disponible
            if (window.currentPdfContent && typeof generateHTML === 'function') {
              window.currentPdfContent.badges = selected;
              window.currentPdfContent.badge = selected[0] || '';
              const html = generateHTML(window.currentPdfContent);
              if (typeof displayPreview === 'function') {
                displayPreview(html, window.currentProductName || '');
              }
            }
          }
        }
      });

    } catch (err) {
      console.error('❌ Erreur lors du chargement des badges:', err);
      badgeChoicesContainer.innerHTML = '<span class="badge-choices-loading">Erreur de chargement</span>';
    }
  }

  // ========================================
  // GESTION DES LAYOUTS (POSITION, TAILLE)
  // ========================================

  /**
   * Layout par défaut pour un badge à un index donné
   * Positionne les badges au centre du PDF
   * @param {number} idx - Index du badge
   * @returns {Object} Layout par défaut
   */
  function defaultLayoutForIndex(idx) {
    // Positionner au centre du PDF (50% de gauche, 50% du bas)
    // Pour les badges multiples : légèrement décalés
    const offsetX = idx * 15; // Décalage horizontal en pixels
    const offsetY = idx * 20; // Décalage vertical en pixels (du bas vers le haut)
    
    return {
      xPercent: 50, // Centré horizontalement (sera ajusté avec offsetX en pixels)
      yPercent: 50, // Centré verticalement (sera ajusté avec offsetY en pixels)
      offsetXPx: offsetX, // Décalage horizontal en pixels
      offsetYPx: offsetY, // Décalage vertical en pixels
      heightPx: DEFAULT_HEIGHT,
      colors: {}
    };
  }

  /**
   * Récupère les layouts sauvegardés
   * @returns {Object} Layouts par index
   */
  function getStoredBadgeLayouts() {
    try {
      // Utiliser localStorage pour persister même après un rafraîchissement
      const raw = localStorage.getItem('badgeLayouts');
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  /**
   * Sauvegarde les layouts
   * @param {Object} layouts - Layouts à sauvegarder
   */
  function saveBadgeLayouts(layouts) {
    try {
      // Utiliser localStorage pour persister même après un rafraîchissement
      localStorage.setItem('badgeLayouts', JSON.stringify(layouts));
    } catch (err) {
      console.warn('⚠️ Impossible de sauvegarder les layouts de badges dans localStorage:', err);
      // Fallback vers sessionStorage si localStorage n'est pas disponible
      try {
        sessionStorage.setItem('badgeLayouts', JSON.stringify(layouts));
      } catch (fallbackErr) {
        console.error('❌ Impossible de sauvegarder dans sessionStorage non plus:', fallbackErr);
      }
    }
  }

  /**
   * Récupère le layout pour un index donné
   * @param {number} idx - Index du badge
   * @returns {Object} Layout
   */
  function getLayoutForIndex(idx) {
    const stored = getStoredBadgeLayouts();
    return stored[idx] || defaultLayoutForIndex(idx);
  }

  /**
   * Définit le layout pour un index donné
   * @param {number} idx - Index du badge
   * @param {Object} layout - Layout à sauvegarder
   */
  function setLayoutForIndex(idx, layout) {
    const layouts = getStoredBadgeLayouts();
    layouts[idx] = {
      xPercent: layout.xPercent !== undefined ? Math.max(0, Math.min(layout.xPercent, 100)) : 50,
      yPercent: layout.yPercent !== undefined ? Math.max(0, Math.min(layout.yPercent, 100)) : 50,
      offsetXPx: layout.offsetXPx || 0,
      offsetYPx: layout.offsetYPx || 0,
      heightPx: layout.heightPx || DEFAULT_HEIGHT,
      colors: layout.colors || {}
    };
    saveBadgeLayouts(layouts);
  }

  /**
   * S'assure qu'il y a des layouts pour tous les badges
   * @param {number} count - Nombre de badges
   */
  function ensureLayoutsForBadges(count) {
    const layouts = getStoredBadgeLayouts();
    let changed = false;
    for (let i = 0; i < count; i++) {
      if (!layouts[i]) {
        layouts[i] = defaultLayoutForIndex(i);
        changed = true;
      }
    }
    if (changed) saveBadgeLayouts(layouts);
  }

  /**
   * Applique les couleurs personnalisées à un badge spécifique
   * @param {HTMLElement} pdfPreview - Élément de preview
   * @param {number} badgeIndex - Index du badge
   */
  async function applyBadgeColorsToPreview(pdfPreview, badgeIndex) {
    if (!pdfPreview) return;
    
    const badges = pdfPreview.querySelectorAll('.badge-instance');
    const badgeImg = badges[badgeIndex];
    if (!badgeImg) return;
    
    // Stocker le SVG original si ce n'est pas déjà fait
    if (!badgeImg.dataset.originalSvgDataUri && badgeImg.src) {
      badgeImg.dataset.originalSvgDataUri = badgeImg.src;
    }
    
    // Extraire et stocker la liste des couleurs indexées si pas déjà fait
    let colorIndexList = null;
    if (badgeImg.dataset.colorIndexList) {
      try {
        colorIndexList = JSON.parse(badgeImg.dataset.colorIndexList);
      } catch (e) {
        console.warn('Impossible de parser colorIndexList:', e);
      }
    }
    
    if (!colorIndexList) {
      const originalSVG = decodeSVGDataURI(badgeImg.dataset.originalSvgDataUri || badgeImg.src);
      if (originalSVG) {
        colorIndexList = extractColorsFromSVG(originalSVG);
        badgeImg.dataset.colorIndexList = JSON.stringify(colorIndexList);
      }
    }
    
    const layout = getLayoutForIndex(badgeIndex);
    if (!layout.colors || Object.keys(layout.colors).length === 0) {
      // Pas de couleurs personnalisées, restaurer l'original
      if (badgeImg.dataset.originalSvgDataUri) {
        badgeImg.src = badgeImg.dataset.originalSvgDataUri;
      }
      return;
    }
    
    // Appliquer les couleurs avec la liste d'index
    applyBadgeColors(badgeImg, layout.colors, colorIndexList);
  }

  /**
   * Met à jour seulement la taille d'un badge, sans toucher à sa position
   * @param {HTMLElement} pdfPreview - Élément de preview
   * @param {number} idx - Index du badge
   * @param {number} newWidth - Nouvelle largeur (la valeur du slider)
   */
  function updateBadgeSizeOnly(pdfPreview, idx, newWidth) {
    if (!pdfPreview) return;
    
    const badgeNames = getBadgeNamesArray();
    if (idx < 0 || idx >= badgeNames.length) return;
    
    const badgeName = badgeNames[idx];
    const badgeImg = Array.from(pdfPreview.querySelectorAll('.badge-instance'))
      .find(img => img.dataset.badge === badgeName);
    
    if (!badgeImg) return;
    
    // Mettre à jour seulement la largeur et la hauteur, sans toucher à la position
    badgeImg.style.width = `${newWidth}px`;
    
    // Calculer la hauteur proportionnelle
    if (badgeImg.naturalWidth && badgeImg.naturalHeight && badgeImg.naturalWidth > 0 && badgeImg.naturalHeight > 0) {
      const aspectRatio = badgeImg.naturalHeight / badgeImg.naturalWidth;
      const calculatedHeight = newWidth * aspectRatio;
      badgeImg.style.height = `${calculatedHeight}px`;
      badgeImg.style.minHeight = 'auto';
      badgeImg.style.maxHeight = 'none';
    } else {
      badgeImg.style.height = 'auto';
      badgeImg.style.minHeight = '40px';
      badgeImg.style.maxHeight = 'none';
    }
  }

  /**
   * Applique les layouts aux badges dans la preview
   * @param {HTMLElement} pdfPreview - Élément de preview
   */
  function applyBadgeLayoutsToPreview(pdfPreview) {
    if (!pdfPreview) return;
    
    // Les badges doivent être positionnés dans le PDF, pas dans the header
    // Rechercher les badges directement dans pdfPreview (ils peuvent déjà y être)
    let badges = Array.from(pdfPreview.querySelectorAll('.badge-instance'));
    
    // Si les badges sont encore dans badge-group, les déplacer vers le pdfPreview
    const badgeGroup = pdfPreview.querySelector('.badge-group');
    if (badgeGroup) {
      badges.forEach((img) => {
        if (img.parentElement === badgeGroup) {
          pdfPreview.appendChild(img);
        }
      });
    }
    
    // Re-chercher les badges après déplacement pour avoir la liste à jour
    badges = Array.from(pdfPreview.querySelectorAll('.badge-instance'));
    
    // Récupérer la liste des noms de badges pour faire correspondre par nom plutôt que par index
    const badgeNames = getBadgeNamesArray();
    
    // S'assurer que tous les badges ont un layout initialisé
    ensureLayoutsForBadges(badgeNames.length);
    
    // Positionner les badges directement dans le pdfPreview au centre
    // Faire correspondre par nom (data-badge) plutôt que par index DOM pour éviter les problèmes d'ordre
    badgeNames.forEach((badgeName, idx) => {
      // Trouver le badge correspondant par son attribut data-badge
      const badgeImg = badges.find(img => img.dataset.badge === badgeName);
      if (!badgeImg) {
        console.warn(`Badge "${badgeName}" non trouvé dans le DOM`);
        return; // Badge non trouvé, ignorer
      }
      
      const layout = getLayoutForIndex(idx);
      
      // Lire la position actuelle du badge depuis les styles inline pour la préserver
      // Cela évite de repositionner le badge quand on change seulement la taille
      const hasExistingPosition = badgeImg.style.left && badgeImg.style.left !== '' && 
                                   badgeImg.style.bottom && badgeImg.style.bottom !== '';
      
      // Préserver les styles existants et n'écraser que ce qui est nécessaire
      // Si le badge a déjà une position en style inline, la conserver
      if (!hasExistingPosition) {
        // Positionner au centre du PDF (50% de gauche, 50% du bas) seulement si pas de position existante
        const offsetX = layout.offsetXPx || 0;
        const offsetY = layout.offsetYPx || 0;
        badgeImg.style.position = 'absolute';
        badgeImg.style.left = `calc(50% + ${offsetX}px)`;
        badgeImg.style.bottom = `calc(50% + ${-offsetY}px)`;
      } else {
        // Conserver la position existante, juste s'assurer que position est absolute
        // Ne pas toucher à left et bottom, ils sont déjà définis dans style inline
        if (!badgeImg.style.position || badgeImg.style.position === 'static') {
          badgeImg.style.position = 'absolute';
        }
      }
      
      badgeImg.style.margin = '0';
      badgeImg.style.padding = '0';
      // Utiliser la largeur comme base (la valeur du slider devient la largeur)
      badgeImg.style.width = `${layout.heightPx}px`;
      
      // Calculer la hauteur proportionnelle en fonction de la largeur et du ratio d'aspect
      // Si l'image a des dimensions naturelles, utiliser son ratio, sinon utiliser 'auto'
      if (badgeImg.naturalWidth && badgeImg.naturalHeight && badgeImg.naturalWidth > 0 && badgeImg.naturalHeight > 0) {
        const aspectRatio = badgeImg.naturalHeight / badgeImg.naturalWidth; // Ratio hauteur/largeur
        const calculatedHeight = layout.heightPx * aspectRatio; // Hauteur = largeur × (hauteur/largeur)
        badgeImg.style.height = `${calculatedHeight}px`;
        // Supprimer les limites minHeight/maxHeight pour permettre l'agrandissement complet
        badgeImg.style.minHeight = 'auto';
        badgeImg.style.maxHeight = 'none';
      } else {
        // Fallback si les dimensions naturelles ne sont pas encore disponibles
        badgeImg.style.height = 'auto';
        badgeImg.style.minHeight = '40px';
        badgeImg.style.maxHeight = 'none'; // Permettre l'agrandissement
      }
      
      badgeImg.style.objectFit = 'contain';
      badgeImg.style.zIndex = '10000';
      badgeImg.style.display = 'block';
      badgeImg.style.visibility = 'visible';
      badgeImg.style.opacity = '1';
      badgeImg.style.pointerEvents = 'auto';
      badgeImg.style.transform = 'translate(-50%, 50%)';
      badgeImg.style.userSelect = 'none';
    });
    
  }

  // ========================================
  // GESTION DES COULEURS SVG
  // ========================================

  /**
   * Extrait chaque élément SVG avec sa couleur individuellement
   * Permet de changer chaque élément indépendamment même s'ils ont la même couleur
   * @param {string} svgContent - Contenu SVG (XML string)
   * @returns {Array<{index: number, color: string, elementType: string, attribute: string, originalMatch: string}>} Tableau des éléments avec leur couleur
   */
  function extractColorsFromSVG(svgContent) {
    if (!svgContent) return [];
    
    const colorsList = [];
    let index = 0;
    
    // Expressions régulières pour trouver les éléments SVG avec leurs attributs fill/stroke
    // On cherche chaque occurrence individuelle, pas les couleurs uniques
    
    // Pattern pour les éléments SVG (rect, path, circle, ellipse, line, polyline, polygon, g)
    const elementPattern = /<(\w+)([^>]*?)>/gi;
    let elementMatch;
    
    while ((elementMatch = elementPattern.exec(svgContent)) !== null) {
      const elementType = elementMatch[1].toLowerCase();
      const attributes = elementMatch[2];
      
      // Ignorer les éléments qui ne sont généralement pas colorés
      if (elementType === 'svg' || elementType === 'defs' || elementType === 'clipPath' || elementType === 'mask') {
        continue;
      }
      
      // Chercher fill dans les attributs
      const fillAttrMatch = attributes.match(/fill=["']([^"']+)["']/i);
      if (fillAttrMatch) {
        const color = fillAttrMatch[1].trim();
        if (isValidColor(color)) {
          colorsList.push({
            index: index++,
            color: color,
            elementType: elementType,
            attribute: 'fill',
            originalMatch: fillAttrMatch[0]
          });
        }
      }
      
      // Chercher stroke dans les attributs
      const strokeAttrMatch = attributes.match(/stroke=["']([^"']+)["']/i);
      if (strokeAttrMatch) {
        const color = strokeAttrMatch[1].trim();
        if (isValidColor(color)) {
          colorsList.push({
            index: index++,
            color: color,
            elementType: elementType,
            attribute: 'stroke',
            originalMatch: strokeAttrMatch[0]
          });
        }
      }
      
      // Chercher fill dans les styles inline
      const styleAttrMatch = attributes.match(/style=["']([^"']+)["']/i);
      if (styleAttrMatch) {
        const styleContent = styleAttrMatch[1];
        const fillStyleMatch = styleContent.match(/fill\s*:\s*([^;]+)/i);
        if (fillStyleMatch) {
          const color = fillStyleMatch[1].trim();
          if (isValidColor(color)) {
            colorsList.push({
              index: index++,
              color: color,
              elementType: elementType,
              attribute: 'fill',
              originalMatch: fillStyleMatch[0],
              inStyle: true
            });
          }
        }
        
        const strokeStyleMatch = styleContent.match(/stroke\s*:\s*([^;]+)/i);
        if (strokeStyleMatch) {
          const color = strokeStyleMatch[1].trim();
          if (isValidColor(color)) {
            colorsList.push({
              index: index++,
              color: color,
              elementType: elementType,
              attribute: 'stroke',
              originalMatch: strokeStyleMatch[0],
              inStyle: true
            });
          }
        }
      }
    }
    
    // Retourner juste les couleurs pour compatibilité, mais aussi stocker les infos complètes
    return colorsList.map(item => item.color);
  }
  
  /**
   * Extrait chaque élément SVG avec ses détails complets pour modifications indépendantes
   * @param {string} svgContent - Contenu SVG (XML string)
   * @returns {Array<{index: number, color: string, elementType: string, attribute: string, originalMatch: string, position: number}>} Tableau des éléments avec détails
   */
  function extractSVGElementsWithColors(svgContent) {
    if (!svgContent) return [];
    
    const elementsList = [];
    let index = 0;
    
    // Pattern pour les éléments SVG
    const elementPattern = /<(\w+)([^>]*?)>/gi;
    let elementMatch;
    
    while ((elementMatch = elementPattern.exec(svgContent)) !== null) {
      const elementType = elementMatch[1].toLowerCase();
      const attributes = elementMatch[2];
      const elementPosition = elementMatch.index;
      const fullMatch = elementMatch[0];
      
      // Ignorer les éléments qui ne sont généralement pas colorés
      if (elementType === 'svg' || elementType === 'defs' || elementType === 'clipPath' || elementType === 'mask') {
        continue;
      }
      
      // Chercher fill dans les attributs
      const fillAttrMatch = attributes.match(/fill=["']([^"']+)["']/i);
      if (fillAttrMatch) {
        const color = fillAttrMatch[1].trim();
        if (isValidColor(color)) {
          elementsList.push({
            index: index++,
            color: color,
            elementType: elementType,
            attribute: 'fill',
            originalMatch: fillAttrMatch[0],
            elementPosition: elementPosition,
            fullElementMatch: fullMatch,
            attributePosition: elementMatch.index + elementMatch[1].length + 1 + attributes.indexOf(fillAttrMatch[0])
          });
        }
      }
      
      // Chercher stroke dans les attributs
      const strokeAttrMatch = attributes.match(/stroke=["']([^"']+)["']/i);
      if (strokeAttrMatch) {
        const color = strokeAttrMatch[1].trim();
        if (isValidColor(color)) {
          elementsList.push({
            index: index++,
            color: color,
            elementType: elementType,
            attribute: 'stroke',
            originalMatch: strokeAttrMatch[0],
            elementPosition: elementPosition,
            fullElementMatch: fullMatch,
            attributePosition: elementMatch.index + elementMatch[1].length + 1 + attributes.indexOf(strokeAttrMatch[0])
          });
        }
      }
      
      // Chercher fill dans les styles inline
      const styleAttrMatch = attributes.match(/style=["']([^"']+)["']/i);
      if (styleAttrMatch) {
        const styleContent = styleAttrMatch[1];
        const fillStyleMatch = styleContent.match(/fill\s*:\s*([^;]+)/i);
        if (fillStyleMatch) {
          const color = fillStyleMatch[1].trim();
          if (isValidColor(color)) {
            elementsList.push({
              index: index++,
              color: color,
              elementType: elementType,
              attribute: 'fill',
              originalMatch: fillStyleMatch[0],
              inStyle: true,
              elementPosition: elementPosition,
              fullElementMatch: fullMatch
            });
          }
        }
        
        const strokeStyleMatch = styleContent.match(/stroke\s*:\s*([^;]+)/i);
        if (strokeStyleMatch) {
          const color = strokeStyleMatch[1].trim();
          if (isValidColor(color)) {
            elementsList.push({
              index: index++,
              color: color,
              elementType: elementType,
              attribute: 'stroke',
              originalMatch: strokeStyleMatch[0],
              inStyle: true,
              elementPosition: elementPosition,
              fullElementMatch: fullMatch
            });
          }
        }
      }
    }
    
    return elementsList;
  }
  
  /**
   * Extrait toutes les occurrences de couleurs avec leur index pour permettre des modifications indépendantes
   * @param {string} svgContent - Contenu SVG (XML string)
   * @returns {Array<{index: number, color: string}>} Tableau des couleurs avec leur index
   */
  function extractColorsWithIndex(svgContent) {
    if (!svgContent) return [];
    
    const colorsList = [];
    const seenColors = new Map();
    
    // Expressions régulières pour trouver fill et stroke dans les attributs
    const fillRegex = /fill=["']([^"']+)["']/gi;
    const strokeRegex = /stroke=["']([^"']+)["']/gi;
    
    // Expressions régulières pour trouver fill et stroke dans les styles inline
    const styleFillRegex = /fill\s*:\s*([^;]+)/gi;
    const styleStrokeRegex = /stroke\s*:\s*([^;]+)/gi;
    
    let match;
    
    // Chercher dans les attributs fill
    while ((match = fillRegex.exec(svgContent)) !== null) {
      const color = match[1].trim();
      if (isValidColor(color) && !seenColors.has(color)) {
        const index = colorsList.length;
        seenColors.set(color, index);
        colorsList.push({ index, color });
      }
    }
    
    // Chercher dans les attributs stroke
    while ((match = strokeRegex.exec(svgContent)) !== null) {
      const color = match[1].trim();
      if (isValidColor(color) && !seenColors.has(color)) {
        const index = colorsList.length;
        seenColors.set(color, index);
        colorsList.push({ index, color });
      }
    }
    
    // Chercher dans les styles inline fill
    while ((match = styleFillRegex.exec(svgContent)) !== null) {
      const color = match[1].trim();
      if (isValidColor(color) && !seenColors.has(color)) {
        const index = colorsList.length;
        seenColors.set(color, index);
        colorsList.push({ index, color });
      }
    }
    
    // Chercher dans les styles inline stroke
    while ((match = styleStrokeRegex.exec(svgContent)) !== null) {
      const color = match[1].trim();
      if (isValidColor(color) && !seenColors.has(color)) {
        const index = colorsList.length;
        seenColors.set(color, index);
        colorsList.push({ index, color });
      }
    }
    
    return colorsList;
  }

  /**
   * Vérifie si une valeur est une couleur valide à remplacer
   * @param {string} color - Valeur de couleur
   * @returns {boolean} True si c'est une couleur valide
   */
  function isValidColor(color) {
    if (!color) return false;
    // Ignorer 'none', 'transparent', les gradients (url(...)), et les valeurs CSS complexes
    if (color === 'none' || color === 'transparent' || color === 'inherit' || color === 'currentColor') {
      return false;
    }
    if (color.startsWith('url(') || color.startsWith('linear-gradient') || color.startsWith('radial-gradient')) {
      return false;
    }
    // Accepter les codes hexadécimaux (#rgb, #rrggbb), rgb/rgba(), et les noms de couleurs CSS
    return true;
  }

  /**
   * Applique des remplacements de couleurs à un SVG selon leur index
   * Permet de changer chaque couleur indépendamment même si plusieurs éléments ont la même couleur
   * @param {string} svgContent - Contenu SVG original
   * @param {Object} colorMap - Map des remplacements { index: nouvelleCouleur }
   * @param {Array<string>} colorIndexList - Liste des couleurs dans l'ordre de leur index [color0, color1, ...]
   * @returns {string} SVG modifié
   */
  function applyColorsToSVG(svgContent, colorMap, colorIndexList) {
    if (!svgContent || !colorMap || Object.keys(colorMap).length === 0 || !colorIndexList) return svgContent;
    
    let modified = svgContent;
    
    // Pour chaque index dans le colorMap, remplacer uniquement la couleur correspondante
    // Cela permet de changer chaque occurrence indépendamment
    Object.entries(colorMap).forEach(([indexStr, newColor]) => {
      const index = parseInt(indexStr, 10);
      if (isNaN(index) || index < 0 || index >= colorIndexList.length) return;
      
      const oldColor = colorIndexList[index];
      if (!oldColor) return;
      
      const escapedColor = escapeRegex(oldColor);
      
      // Remplacer uniquement la première occurrence de cette couleur dans le SVG
      // Pour permettre des changements indépendants, on remplace une occurrence à la fois
      // On utilise une fonction de remplacement pour ne remplacer que la première occurrence
      let replaced = false;
      
      // Remplacer dans les attributs fill="..." et stroke="..."
      modified = modified.replace(
        new RegExp(`(fill|stroke)=["']\\s*${escapedColor}\\s*["']`, 'i'),
        (match, prop) => {
          if (!replaced) {
            replaced = true;
            return `${prop}="${newColor}"`;
          }
          return match;
        }
      );
      
      // Si pas encore remplacé, essayer dans les styles inline
      if (!replaced) {
        modified = modified.replace(
          new RegExp(`(fill|stroke)\\s*:\\s*${escapedColor}(\\s*[;\\s]|$)`, 'i'),
          (match, prop, suffix) => {
            if (!replaced) {
              replaced = true;
              return `${prop}: ${newColor}${suffix || ''}`;
            }
            return match;
          }
        );
      }
    });
    
    return modified;
  }
  
  /**
   * Applique des remplacements de couleurs à un SVG en remplaçant chaque élément individuellement
   * Permet de changer chaque élément indépendamment même s'ils ont la même couleur
   * @param {string} svgContent - Contenu SVG original
   * @param {Object} colorMap - Map des remplacements { index: nouvelleCouleur }
   * @param {Array<string>} colorIndexList - Liste des couleurs dans l'ordre de leur index [color0, color1, ...]
   * @returns {string} SVG modifié
   */
  function applyColorsToSVGByIndex(svgContent, colorMap, colorIndexList) {
    if (!svgContent || !colorMap || Object.keys(colorMap).length === 0 || !colorIndexList) return svgContent;
    
    // Extraire tous les éléments SVG avec leurs détails et positions exactes
    const elementsList = extractSVGElementsWithColors(svgContent);
    
    // Créer un mapping index -> nouvelle couleur
    const indexToNewColor = {};
    Object.entries(colorMap).forEach(([indexStr, newColor]) => {
      const index = parseInt(indexStr, 10);
      if (!isNaN(index) && index >= 0 && index < elementsList.length) {
        indexToNewColor[index] = newColor;
      }
    });
    
    // Filtrer les éléments qui doivent être modifiés
    const elementsToReplace = elementsList
      .map((el, idx) => ({ ...el, originalIndex: idx }))
      .filter(el => indexToNewColor[el.index] && indexToNewColor[el.index] !== el.color)
      .sort((a, b) => (b.attributePosition || b.elementPosition || 0) - (a.attributePosition || a.elementPosition || 0));
    
    let modified = svgContent;
    
    // Remplacer chaque élément en partant de la fin pour préserver les positions
    elementsToReplace.forEach((element) => {
      const newColor = indexToNewColor[element.index];
      const escapedOldColor = escapeRegex(element.color);
      
      if (element.inStyle) {
        // Remplacer dans un style inline
        // Trouver la balise style complète et remplacer la couleur dedans
        const elementStart = element.elementPosition;
        const elementEnd = modified.indexOf('>', elementStart);
        if (elementEnd > elementStart) {
          const elementTag = modified.substring(elementStart, elementEnd + 1);
          const styleMatch = elementTag.match(/style=["']([^"']+)["']/i);
          if (styleMatch) {
            const styleContent = styleMatch[1];
            const newStyleContent = styleContent.replace(
              new RegExp(`(${element.attribute}\\s*:\\s*)${escapedOldColor}(\\s*[;]?)`, 'i'),
              `$1${newColor}$2`
            );
            const newElementTag = elementTag.replace(styleMatch[0], `style="${newStyleContent}"`);
            modified = modified.substring(0, elementStart) + newElementTag + modified.substring(elementEnd + 1);
          }
        }
      } else if (element.attributePosition !== undefined) {
        // Remplacer dans un attribut direct
        const attrStart = element.attributePosition;
        const attrEnd = modified.indexOf('"', attrStart + element.attribute.length + 2);
        if (attrEnd > attrStart) {
          const before = modified.substring(0, attrStart);
          const after = modified.substring(attrEnd + 1);
          const newAttr = `${element.attribute}="${newColor}"`;
          modified = before + newAttr + after;
        }
      }
    });
    
    return modified;
  }

  /**
   * Échappe les caractères spéciaux pour les expressions régulières
   * @param {string} str - Chaîne à échapper
   * @returns {string} Chaîne échappée
   */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Décode un data URI SVG et retourne le contenu XML
   * @param {string} dataUri - Data URI (data:image/svg+xml;base64,... ou data:image/svg+xml;charset=utf-8,...)
   * @returns {string|null} Contenu SVG ou null si erreur
   */
  function decodeSVGDataURI(dataUri) {
    if (!dataUri || !dataUri.startsWith('data:image/svg+xml')) {
      return null;
    }
    
    try {
      // Format base64
      if (dataUri.includes(';base64,')) {
        const base64 = dataUri.split(';base64,')[1];
        return atob(base64);
      }
      // Format URL encoded
      else if (dataUri.includes(',')) {
        const encoded = dataUri.split(',')[1];
        return decodeURIComponent(encoded);
      }
    } catch (e) {
      console.error('Erreur lors du décodage du SVG:', e);
    }
    
    return null;
  }

  /**
   * Encode un SVG en data URI
   * @param {string} svgContent - Contenu SVG
   * @returns {string} Data URI
   */
  function encodeSVGToDataURI(svgContent) {
    if (!svgContent) return '';
    const encoded = btoa(unescape(encodeURIComponent(svgContent)));
    return `data:image/svg+xml;base64,${encoded}`;
  }

  /**
   * Obtient les couleurs d'un badge depuis son image
   * @param {HTMLImageElement} badgeImg - Élément image du badge
   * @returns {Array<string>} Tableau des couleurs
   */
  async function getBadgeColors(badgeImg) {
    if (!badgeImg || !badgeImg.src) return [];
    
    // Utiliser l'original si disponible, sinon le src actuel
    const srcToUse = badgeImg.dataset.originalSvgDataUri || badgeImg.src;
    const svgContent = decodeSVGDataURI(srcToUse);
    if (!svgContent) return [];
    
    return extractColorsFromSVG(svgContent);
  }

  /**
   * Applique les couleurs personnalisées à un badge
   * @param {HTMLImageElement} badgeImg - Élément image du badge
   * @param {Object} colorMap - Map des remplacements de couleurs { index: nouvelleCouleur }
   * @param {Array<string>} colorIndexList - Liste des couleurs dans l'ordre de leur index
   */
  function applyBadgeColors(badgeImg, colorMap, colorIndexList) {
    if (!badgeImg || !colorMap) return;
    
    // Stocker le SVG original si ce n'est pas déjà fait
    if (!badgeImg.dataset.originalSvgDataUri) {
      badgeImg.dataset.originalSvgDataUri = badgeImg.src;
    }
    
    // Stocker aussi la liste des couleurs indexées si elle n'est pas fournie
    if (!colorIndexList && badgeImg.dataset.colorIndexList) {
      try {
        colorIndexList = JSON.parse(badgeImg.dataset.colorIndexList);
      } catch (e) {
        console.warn('Impossible de parser colorIndexList:', e);
        return;
      }
    }
    
    if (!colorIndexList) {
      // Extraire les couleurs depuis le SVG original
      const originalSVG = decodeSVGDataURI(badgeImg.dataset.originalSvgDataUri);
      if (!originalSVG) return;
      colorIndexList = extractColorsFromSVG(originalSVG);
      badgeImg.dataset.colorIndexList = JSON.stringify(colorIndexList);
    }
    
    const originalSVG = decodeSVGDataURI(badgeImg.dataset.originalSvgDataUri);
    if (!originalSVG) return;
    
    // Utiliser la liste des éléments SVG stockée ou l'extraire
    let svgElementsList = null;
    if (badgeImg.dataset.svgElementsList) {
      try {
        svgElementsList = JSON.parse(badgeImg.dataset.svgElementsList);
      } catch (e) {
        console.warn('Impossible de parser svgElementsList:', e);
      }
    }
    
    if (!svgElementsList) {
      svgElementsList = extractSVGElementsWithColors(originalSVG);
      badgeImg.dataset.svgElementsList = JSON.stringify(svgElementsList);
    }
    
    const modifiedSVG = applyColorsToSVGByIndex(originalSVG, colorMap, colorIndexList);
    badgeImg.src = encodeSVGToDataURI(modifiedSVG);
  }

  /**
   * Affiche les contrôles de layout pour les badges sélectionnés
   * @param {Array<string>} badgeNames - Noms des badges sélectionnés
   * @param {HTMLElement} pdfPreview - Élément de preview
   */
  async function renderBadgeLayoutControls(badgeNames, pdfPreview) {
    if (!badgeLayoutContainer) return;
    
    if (!Array.isArray(badgeNames) || badgeNames.length === 0) {
      badgeLayoutContainer.innerHTML = '<p class="empty-state">Sélectionnez un atout pour le configurer</p>';
      const configSection = badgeLayoutContainer.closest('.badges-config-section');
      if (configSection) {
        configSection.classList.remove('has-content');
      }
      return;
    }

    const layouts = getStoredBadgeLayouts();
    const Utils = window.Utils || { escapeHtml: (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') };

    // Générer les contrôles pour chaque badge
    const htmlPromises = badgeNames.map(async (name, idx) => {
      const layout = layouts[idx] || defaultLayoutForIndex(idx);
      let badgeColors = [];
      
      // Essayer d'abord de récupérer les couleurs depuis le badge dans la preview
      const badgeImgs = pdfPreview ? pdfPreview.querySelectorAll('.badge-instance') : [];
      const badgeImg = badgeImgs[idx];
      
      // Stocker les éléments SVG complets pour permettre les modifications individuelles
      let svgElementsList = [];
      
      if (badgeImg && badgeImg.src) {
        badgeColors = await getBadgeColors(badgeImg);
        // Essayer d'extraire aussi les détails complets depuis le SVG original
        if (badgeImg.dataset.originalSvgDataUri) {
          const originalSVG = decodeSVGDataURI(badgeImg.dataset.originalSvgDataUri);
          if (originalSVG) {
            svgElementsList = extractSVGElementsWithColors(originalSVG);
          }
        }
      }
      
      // Si on n'a pas réussi à extraire les couleurs depuis la preview,
      // charger le badge depuis l'URL pour extraire ses couleurs
      if (badgeColors.length === 0) {
        try {
          const badgeImageBaseUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_BADGE_IMAGE_URL) 
            ? CONFIG.N8N_BADGE_IMAGE_URL 
            : 'http://localhost:5678/webhook/fiche_produit/badge';
          const badgeUrl = `${badgeImageBaseUrl}?name=${encodeURIComponent(name)}`;
          
          const response = await fetch(badgeUrl);
          if (response.ok) {
            const svgText = await response.text();
            badgeColors = extractColorsFromSVG(svgText);
            svgElementsList = extractSVGElementsWithColors(svgText);
            
            // Stocker la liste des éléments dans le badge pour référence future
            if (badgeImg) {
              badgeImg.dataset.svgElementsList = JSON.stringify(svgElementsList);
            }
          }
        } catch (err) {
          console.warn(`Impossible de charger le badge ${name} pour extraire les couleurs:`, err);
        }
      }
      
      // Construire les contrôles de couleur
      // Regrouper les éléments qui ont la même couleur d'origine dans un seul sélecteur
      const colorGroupsMap = new Map(); // Map: couleur originale -> { indices: [0,1,2], elements: [...] }
      
      // Grouper les éléments par couleur originale
      badgeColors.forEach((color, colorIdx) => {
        if (!colorGroupsMap.has(color)) {
          colorGroupsMap.set(color, {
            originalColor: color,
            indices: [],
            elements: []
          });
        }
        const group = colorGroupsMap.get(color);
        group.indices.push(colorIdx);
        if (svgElementsList && svgElementsList[colorIdx]) {
          group.elements.push(svgElementsList[colorIdx]);
        }
      });
      
      // Créer les contrôles de couleur groupés
      const colorControlsHtml = `
        <div class="control-group badge-colors-group">
          <label class="control-label">Couleurs</label>
          ${colorGroupsMap.size > 0 ? `
            <div class="badge-colors-list">
              ${Array.from(colorGroupsMap.values()).map((group, groupIdx) => {
                // Utiliser la première couleur de la liste comme clé (couleur originale)
                const originalColor = group.originalColor;
                const colorIndex = String(group.indices[0]); // Utiliser le premier index comme clé
                
                // Vérifier si cette couleur a été modifiée
                const currentColor = layout.colors && layout.colors[colorIndex] 
                  ? layout.colors[colorIndex] 
                  : originalColor;
                
                // Créer un label descriptif avec les types d'éléments
                let elementLabel = '';
                if (group.elements.length > 0) {
                  const elementTypes = group.elements.map(el => `${el.elementType} (${el.attribute})`);
                  const uniqueTypes = [...new Set(elementTypes)];
                  if (uniqueTypes.length === 1) {
                    elementLabel = `${group.elements.length} × ${uniqueTypes[0]}`;
                  } else {
                    elementLabel = `${group.elements.length} éléments (${uniqueTypes.slice(0, 2).join(', ')}${uniqueTypes.length > 2 ? '...' : ''})`;
                  }
                } else {
                  elementLabel = `${group.indices.length} élément(s)`;
                }
                
                return `
                  <div class="badge-color-item">
                    <div class="color-preview" style="background-color: ${Utils.escapeHtml(currentColor)}; width: 24px; height: 24px; border-radius: 4px; border: 1px solid #ddd;"></div>
                    <div style="flex: 1; min-width: 0;">
                      <div style="font-size: 11px; color: #666; margin-bottom: 2px;">${Utils.escapeHtml(elementLabel)}</div>
                      <select class="badge-color-select" data-idx="${idx}" data-color-index="${colorIndex}" data-original-color="${Utils.escapeHtml(originalColor)}" data-all-indices="${group.indices.join(',')}">
                        <option value="${Utils.escapeHtml(originalColor)}" ${currentColor === originalColor ? 'selected' : ''}>Original (${Utils.escapeHtml(originalColor)})</option>
                        ${Object.entries(AVAILABLE_COLORS).map(([key, value]) => `
                          <option value="${value}" ${currentColor === value ? 'selected' : ''}>${key} (${value})</option>
                        `).join('')}
                      </select>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <p class="badge-colors-empty">Aucune couleur détectée dans ce badge</p>
          `}
        </div>
      `;
      
      return `
        <div class="badge-layout-container" data-badge-idx="${idx}" data-badge-name="${Utils.escapeHtml(name)}">
          <div class="badge-layout-header">
            <label class="badge-layout-label">${Utils.escapeHtml(name)}</label>
          </div>
          <div class="badge-layout-controls">
            <div class="control-group">
              <label class="control-label" for="badgeSize-${idx}">
                <span>Taille</span>
                <span class="control-value" id="badgeSizeValue-${idx}">${layout.heightPx}px</span>
              </label>
              <input type="range" id="badgeSize-${idx}" data-idx="${idx}" min="40" max="180" value="${layout.heightPx}" step="2">
            </div>
            ${colorControlsHtml}
          </div>
        </div>
      `;
    });
    
    // Attendre que tous les badges soient analysés
    const htmlParts = await Promise.all(htmlPromises);
    const html = htmlParts.join('');

    badgeLayoutContainer.innerHTML = html;

    // Gérer l'état de la section
    const configSection = badgeLayoutContainer.closest('.badges-config-section');
    if (configSection) {
      configSection.classList.add('has-content');
    }

    // Attacher les événements de changement de taille
    badgeLayoutContainer.querySelectorAll('input[data-idx]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.idx);
        const val = Number(e.target.value) || DEFAULT_HEIGHT;
        const layout = getLayoutForIndex(idx);
        setLayoutForIndex(idx, { ...layout, heightPx: val });
        
        const previewEl = pdfPreview || document.getElementById('pdfPreview');
        if (previewEl) {
          // Mettre à jour seulement la taille, sans toucher à la position
          updateBadgeSizeOnly(previewEl, idx, val);
        }
        
        const valueEl = document.getElementById(`badgeSizeValue-${idx}`);
        if (valueEl) {
          valueEl.textContent = `${val}px`;
        }
      });
    });
    
    // Attacher les événements de changement de couleur
    badgeLayoutContainer.querySelectorAll('.badge-color-select').forEach(select => {
      // Mettre à jour l'indicateur de couleur au changement
      const updateColorPreview = () => {
        const colorPreview = select.closest('.badge-color-item')?.querySelector('.color-preview');
        if (colorPreview) {
          const selectedColor = select.value;
          colorPreview.style.backgroundColor = selectedColor;
        }
      };
      
      // Mettre à jour lors du changement de sélection
      select.addEventListener('change', async (e) => {
        const idx = Number(e.target.dataset.idx);
        const colorIndex = String(e.target.dataset.colorIndex); // Index principal (premier de la groupe)
        const originalColor = e.target.dataset.originalColor;
        const allIndicesStr = e.target.dataset.allIndices; // Tous les indices du groupe
        const allIndices = allIndicesStr ? allIndicesStr.split(',').map(i => parseInt(i, 10)) : [parseInt(colorIndex, 10)];
        const newColor = e.target.value;
        
        // Mettre à jour l'indicateur de couleur immédiatement
        updateColorPreview();
        
        const layout = getLayoutForIndex(idx);
        const colors = { ...(layout.colors || {}) };
        
        // Appliquer la nouvelle couleur à tous les indices du groupe (éléments avec la même couleur d'origine)
        if (newColor === originalColor) {
          // Retour à la couleur originale - supprimer l'entrée pour tous les indices du groupe
          allIndices.forEach(index => {
            delete colors[String(index)];
          });
        } else {
          // Nouvelle couleur personnalisée - stocker avec tous les indices du groupe
          allIndices.forEach(index => {
            colors[String(index)] = newColor;
          });
        }
        
        setLayoutForIndex(idx, { ...layout, colors });
        
        // Appliquer les couleurs au badge dans la preview
        // IMPORTANT: Ne pas réappliquer les layouts pour éviter de réinitialiser la position
        const previewEl = pdfPreview || document.getElementById('pdfPreview');
        if (previewEl) {
          await applyBadgeColorsToPreview(previewEl, idx);
          // Ne pas appeler applyBadgeLayoutsToPreview ici pour préserver la position
        }
      });
      
      // Initialiser l'indicateur avec la couleur actuelle
      updateColorPreview();
    });
  }

  /**
   * Met à jour le compteur de badges
   * @param {number} count - Nombre de badges
   */
  function updateBadgeCount(count) {
    const badgeCountEl = document.getElementById('badgeCount');
    if (badgeCountEl) {
      badgeCountEl.textContent = count;
      badgeCountEl.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  // ========================================
  // DRAG & DROP
  // ========================================

  let isDraggingBadge = false;
  let dragOffset = { x: 0, y: 0, badgeIndex: 0 };
  let dragBadgeElement = null;
  let dragAnimationFrame = null;

  /**
   * Attache le drag & drop à un badge
   * @param {HTMLElement} badgeEl - Élément badge
   */
  function attachBadgeDrag(badgeEl) {
    if (!badgeEl) return;
    badgeEl.style.cursor = 'move';
    badgeEl.addEventListener('mousedown', startBadgeDrag);
    badgeEl.addEventListener('touchstart', startBadgeDrag, { passive: false });
  }

  /**
   * Démarre le drag d'un badge
   * @param {Event} e - Événement
   */
  function startBadgeDrag(e) {
    e.preventDefault();
    e.stopPropagation(); // Empêcher les conflits avec d'autres systèmes de drag
    
    const badgeEl = e.currentTarget;
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview || !badgeEl) return;

    // Empêcher la sélection de texte pendant le drag
    if (e.cancelable) {
      e.preventDefault();
    }

    const Utils = window.Utils || {};
    const getPointFromEvent = Utils.getPointFromEvent || ((e) => ({
      x: e.touches ? e.touches[0].clientX : e.clientX,
      y: e.touches ? e.touches[0].clientY : e.clientY
    }));

    const point = getPointFromEvent(e);
    const rect = badgeEl.getBoundingClientRect();
    const badgeIndex = Array.from(pdfPreview.querySelectorAll('.badge-instance')).indexOf(badgeEl);
    const containerRect = pdfPreview.getBoundingClientRect();
    
    // Calculer l'offset initial : distance entre le point de clic et le centre du badge
    const badgeCenterX = rect.left + rect.width / 2;
    const badgeCenterY = rect.top + rect.height / 2;
    
    dragOffset = {
      x: point.x - badgeCenterX, // Offset horizontal de la souris par rapport au centre du badge
      y: point.y - badgeCenterY, // Offset vertical de la souris par rapport au centre du badge
      badgeIndex: badgeIndex
    };
    dragBadgeElement = badgeEl;
    isDraggingBadge = true;

    // Ajouter une classe pour le style pendant le drag
    badgeEl.classList.add('dragging');

    // Utiliser capture phase pour intercepter les événements avant les autres handlers
    document.addEventListener('mousemove', onBadgeDragMove, { passive: false, capture: true });
    document.addEventListener('mouseup', endBadgeDrag, { capture: true });
    document.addEventListener('touchmove', onBadgeDragMove, { passive: false, capture: true });
    document.addEventListener('touchend', endBadgeDrag, { capture: true });
  }

  /**
   * Gère le mouvement pendant le drag - Version optimisée avec requestAnimationFrame
   * @param {Event} e - Événement
   */
  function onBadgeDragMove(e) {
    if (!isDraggingBadge || !dragBadgeElement) return;
    
    e.preventDefault();
    e.stopPropagation(); // Empêcher les conflits
    
    // Annuler l'animation frame précédente si elle existe
    if (dragAnimationFrame) {
      cancelAnimationFrame(dragAnimationFrame);
    }
    
    // Utiliser requestAnimationFrame pour une animation fluide
    dragAnimationFrame = requestAnimationFrame(() => {
      updateBadgePosition(e);
    });
  }

  /**
   * Met à jour la position du badge pendant le drag
   * @param {Event} e - Événement
   */
  function updateBadgePosition(e) {
    if (!isDraggingBadge || !dragBadgeElement) return;
    
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) return;

    const Utils = window.Utils || {};
    const getPointFromEvent = Utils.getPointFromEvent || ((e) => ({
      x: e.touches ? e.touches[0].clientX : e.clientX,
      y: e.touches ? e.touches[0].clientY : e.clientY
    }));

    const point = getPointFromEvent(e);
    const containerRect = pdfPreview.getBoundingClientRect();

    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    // Calculer où se trouve le centre du badge maintenant (en suivant la souris)
    const badgeCenterX = point.x - dragOffset.x;
    const badgeCenterY = point.y - dragOffset.y;
    
    // Convertir en coordonnées relatives au conteneur PDF
    const badgeCenterXInContainer = badgeCenterX - containerRect.left;
    const badgeCenterYInContainer = badgeCenterY - containerRect.top;

    const badgeRect = dragBadgeElement.getBoundingClientRect();
    const badgeWidth = badgeRect.width || 80;
    const badgeHeight = badgeRect.height || 60;
    
    // Limiter la position du centre dans les bounds du conteneur
    const limitedCenterX = Math.max(badgeWidth / 2, Math.min(badgeCenterXInContainer, containerRect.width - badgeWidth / 2));
    const limitedCenterY = Math.max(badgeHeight / 2, Math.min(badgeCenterYInContainer, containerRect.height - badgeHeight / 2));

    // Calculer l'offset depuis le centre du PDF
    // X : positif = badge vers la droite du centre
    const offsetXPx = limitedCenterX - centerX;
    // Y : on utilise bottom donc il faut convertir
    // Si limitedCenterY augmente (vers le bas), le badge doit descendre, donc bottom doit diminuer
    // bottom = 50% - offsetY (car bottom fonctionne à l'envers)
    const offsetYPxFromTop = limitedCenterY - centerY; // Positif = vers le bas depuis le centre

    // Appliquer directement le style
    // Pour bottom, on inverse le signe car bottom augmente vers le haut
    dragBadgeElement.style.left = `calc(50% + ${offsetXPx}px)`;
    dragBadgeElement.style.bottom = `calc(50% + ${-offsetYPxFromTop}px)`;
    
    // Sauvegarder temporairement dans le dragOffset pour la sauvegarde finale
    dragOffset.currentOffsetX = offsetXPx;
    dragOffset.currentOffsetY = -offsetYPxFromTop; // Inversé car on utilise bottom
  }

  /**
   * Termine le drag et sauvegarde la position finale
   */
  function endBadgeDrag(e) {
    if (!isDraggingBadge) return;
    
    if (e) {
      e.stopPropagation();
    }
    
    // Annuler l'animation frame si elle existe
    if (dragAnimationFrame) {
      cancelAnimationFrame(dragAnimationFrame);
      dragAnimationFrame = null;
    }
    
    if (dragBadgeElement) {
      // Retirer la classe de drag
      dragBadgeElement.classList.remove('dragging');
      
      // Sauvegarder la position finale dans le layout
      const pdfPreview = document.getElementById('pdfPreview');
      if (pdfPreview && dragOffset.currentOffsetX !== undefined && dragOffset.currentOffsetY !== undefined) {
        const currentLayout = getLayoutForIndex(dragOffset.badgeIndex);
        const layout = {
          xPercent: 50,
          yPercent: 50,
          offsetXPx: dragOffset.currentOffsetX,
          offsetYPx: dragOffset.currentOffsetY, // Déjà dans le bon format pour bottom
          heightPx: currentLayout.heightPx || DEFAULT_HEIGHT,
          colors: currentLayout.colors || {}
        };
        
        setLayoutForIndex(dragOffset.badgeIndex, layout);
      }
      
      dragBadgeElement = null;
    }
    
    isDraggingBadge = false;
    
    // Retirer les listeners
    document.removeEventListener('mousemove', onBadgeDragMove, { capture: true });
    document.removeEventListener('mouseup', endBadgeDrag, { capture: true });
    document.removeEventListener('touchmove', onBadgeDragMove, { capture: true });
    document.removeEventListener('touchend', endBadgeDrag, { capture: true });
  }

  /**
   * Attache le drag & drop à tous les badges
   * @param {HTMLElement} pdfPreview - Élément de preview
   */
  function attachDragToAll(pdfPreview) {
    if (!pdfPreview) return;
    const instances = pdfPreview.querySelectorAll('.badge-instance');
    instances.forEach(img => attachBadgeDrag(img));
  }

  // ========================================
  // API PUBLIQUE
  // ========================================

  window.BadgeManager = {
    loadBadges,
    getBadgeNames: getBadgeNamesArray,
    renderLayoutControls: renderBadgeLayoutControls,
    applyLayouts: applyBadgeLayoutsToPreview,
    applyColors: applyBadgeColorsToPreview,
    ensureLayouts: ensureLayoutsForBadges,
    attachDragToAll,
    getLayoutForIndex,
    setLayoutForIndex,
    defaultLayoutForIndex,
    updateBadgeCount,
    extractBadgesFromContent,
    getBadgeColors,
    applyBadgeColors
  };

  // Exposer aussi pour compatibilité
  if (typeof window.getBadgeNamesArray === 'undefined') {
    window.getBadgeNamesArray = getBadgeNamesArray;
  }
  
  if (typeof window.getBadgeNameFromContent === 'undefined') {
    window.getBadgeNameFromContent = getBadgeNameFromContent;
  }

  // BadgeManager initialisé
})();
