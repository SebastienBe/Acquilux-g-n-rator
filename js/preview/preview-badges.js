// ========================================
// MODULE BADGES (sélection, layouts, drag)
// ========================================
(function () {
  const badgeChoicesContainer = document.getElementById('badgeChoices');
  const badgeLayoutContainer = document.getElementById('badgeLayoutContainer');
  const DEFAULT_HEIGHT = 80;

  let isDraggingBadge = false;
  let dragOffset = { x: 0, y: 0, badgeIndex: 0 };

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

  function getBadgeNamesArray() {
    const stored = sessionStorage.getItem('badgeNames');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const single = sessionStorage.getItem('badgeName');
    return single ? [single] : [];
  }

  async function loadBadges(onChange) {
    if (!badgeChoicesContainer || typeof fetchBadgeList !== 'function') return;
    try {
      badgeChoicesContainer.innerHTML = '<span class="badge-choices-loading">Chargement...</span>';

      const badges = await fetchBadgeList();
      if (!Array.isArray(badges) || badges.length === 0) {
        badgeChoicesContainer.innerHTML = '<span class="badge-choices-loading">Aucun badge disponible</span>';
        return;
      }

      const options = badges.map((b) => {
        if (typeof b === 'string') {
          return { value: b, label: b };
        }
        const value = b.slug || b.name || b.nom || b.label || b.titre || '';
        const label = b.nom || b.name || b.label || b.titre || b.slug || value || 'Badge';
        return { value, label };
      }).filter(o => o.value);

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

      const defaults = getBadgeNamesArray();
      const badgeImageBaseUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_BADGE_IMAGE_URL) 
        ? CONFIG.N8N_BADGE_IMAGE_URL 
        : 'https://n8n-seb.sandbox-jerem.com/webhook/fiche_produit/badge';
      
      // Séparer les badges : "_atout", "logo_", et les autres
      const badgesWithAtout = uniqueOptions.filter(o => o.value.includes('_atout') && !o.value.includes('logo_'));
      const badgesWithLogo = uniqueOptions.filter(o => o.value.includes('logo_'));
      const badgesWithoutSpecial = uniqueOptions.filter(o => !o.value.includes('_atout') && !o.value.includes('logo_'));
      
      // Fonction pour générer le HTML d'un badge
      const generateBadgeHTML = (o) => {
        const checked = defaults.includes(o.value) ? 'checked' : '';
        const badgeImageUrl = `${badgeImageBaseUrl}?name=${encodeURIComponent(o.value)}&cb=${Date.now()}`;
        return `
          <label class="badge-choice">
            <input type="checkbox" value="${o.value}" ${checked}>
            <div class="badge-choice-content">
              <img src="${badgeImageUrl}" alt="${Utils.escapeHtml(o.label)}" class="badge-choice-image" loading="lazy">
              <span class="badge-choice-label">${Utils.escapeHtml(o.label)}</span>
            </div>
          </label>
        `;
      };
      
      // Fonction pour générer le HTML d'un dossier dépliable
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
      
      // Générer le HTML pour les dossiers
      const logoFolderHTML = generateFolderHTML(badgesWithLogo, 'Logo (logo_)', '🖼️');
      const atoutFolderHTML = generateFolderHTML(badgesWithAtout, 'Atouts (_atout)', '📁');
      
      // Générer le HTML pour les autres badges
      const otherBadgesHTML = badgesWithoutSpecial.map(generateBadgeHTML).join('');
      
      // Assembler le HTML final (logo en premier, puis atout, puis les autres)
      badgeChoicesContainer.innerHTML = logoFolderHTML + atoutFolderHTML + otherBadgesHTML;
      
      // Gérer l'ouverture/fermeture de tous les dossiers dépliables
      const folderToggles = badgeChoicesContainer.querySelectorAll('.badge-folder-toggle');
      folderToggles.forEach(folderToggle => {
        folderToggle.addEventListener('click', () => {
          const folder = folderToggle.closest('.badge-folder');
          const folderContent = folder?.querySelector('.badge-folder-content');
          if (!folderContent) return;
          
          const isExpanded = folderToggle.getAttribute('aria-expanded') === 'true';
          
          if (isExpanded) {
            folderContent.style.display = 'none';
            folderToggle.setAttribute('aria-expanded', 'false');
            folderToggle.querySelector('.badge-folder-arrow').textContent = '▼';
          } else {
            folderContent.style.display = 'block';
            folderToggle.setAttribute('aria-expanded', 'true');
            folderToggle.querySelector('.badge-folder-arrow').textContent = '▲';
          }
        });
      });
      
      // Gérer le chargement des images et afficher le label si l'image échoue
      badgeChoicesContainer.querySelectorAll('.badge-choice-image').forEach(img => {
        img.addEventListener('load', () => {
          // Image chargée avec succès, masquer le label
          const label = img.nextElementSibling;
          if (label && label.classList.contains('badge-choice-label')) {
            label.style.display = 'none';
          }
        });
        img.addEventListener('error', () => {
          // Image échouée, masquer l'image et afficher le label
          img.style.display = 'none';
          const label = img.nextElementSibling;
          if (label && label.classList.contains('badge-choice-label')) {
            label.style.display = 'block';
          }
        });
      });

      badgeChoicesContainer.addEventListener('change', () => {
        const selected = Array.from(badgeChoicesContainer.querySelectorAll('input[type="checkbox"]:checked'))
          .map(i => i.value)
          .filter(Boolean);
        if (selected.length > 0) {
          sessionStorage.setItem('badgeNames', JSON.stringify(selected));
          sessionStorage.setItem('badgeName', selected[0]); // compat
        } else {
          sessionStorage.removeItem('badgeNames');
          sessionStorage.removeItem('badgeName');
        }
        ensureLayoutsForBadges(selected.length);
        const pdfPreviewEl = document.getElementById('pdfPreview');
        renderBadgeLayoutControls(selected, pdfPreviewEl);
        updateBadgeCount(selected.length);
        if (typeof onChange === 'function') {
          onChange(selected);
        }
      });
    } catch (err) {
      console.error('❌ Erreur lors du chargement des badges:', err);
      badgeChoicesContainer.innerHTML = '<span class="badge-choices-loading">Erreur de chargement</span>';
    }
  }

  // Layouts
  function defaultLayoutForIndex(idx) {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    return {
      xPercent: Utils.clamp(3 + col * 18, 0, 90),
      yPercent: Utils.clamp(row * 20, 0, 90),
      heightPx: idx === 0 ? DEFAULT_HEIGHT : 70,
      colors: {}
    };
  }

  function getStoredBadgeLayouts() {
    try {
      const raw = sessionStorage.getItem('badgeLayouts');
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object') return {};
      return parsed;
    } catch {
      return {};
    }
  }

  function saveBadgeLayouts(layouts) {
    sessionStorage.setItem('badgeLayouts', JSON.stringify(layouts));
  }

  function getLayoutForIndex(idx) {
    const stored = getStoredBadgeLayouts();
    return stored[idx] || defaultLayoutForIndex(idx);
  }

  function setLayoutForIndex(idx, layout) {
    const layouts = getStoredBadgeLayouts();
    layouts[idx] = {
      xPercent: Utils.clamp(layout.xPercent, 0, 100),
      yPercent: Utils.clamp(layout.yPercent, 0, 100),
      heightPx: layout.heightPx,
      colors: layout.colors || {}
    };
    saveBadgeLayouts(layouts);
  }

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

  function applyBadgeLayoutsToPreview(pdfPreview) {
    if (!pdfPreview) return;
    const badges = pdfPreview.querySelectorAll('.badge-instance');
    badges.forEach((img, idx) => {
      const layout = getLayoutForIndex(idx);
      img.style.position = 'absolute';
      img.style.left = `${Utils.clamp(layout.xPercent, 0, 100)}%`;
      img.style.bottom = `${Utils.clamp(layout.yPercent, 0, 100)}%`;
      img.style.margin = '0';
      img.style.padding = '0';
      img.style.height = `${layout.heightPx}px`;
      img.style.maxWidth = '240px';
      img.style.objectFit = 'contain';
      img.style.zIndex = '100';
      
      // Appliquer les couleurs si définies
      if (layout.colors && Object.keys(layout.colors).length > 0) {
        const badgeName = img.getAttribute('data-badge') || '';
        applyBadgeColorsToPreview(pdfPreview, idx, layout.colors, badgeName);
      } else {
        // Retirer le filtre si aucune couleur
        img.style.filter = '';
      }
    });
  }

  // Appliquer un filtre de couleur à un badge spécifique
  function applyBadgeColorToPreview(pdfPreview, idx, color) {
    if (!pdfPreview || !color) {
      const badges = pdfPreview.querySelectorAll('.badge-instance');
      if (badges[idx]) {
        badges[idx].style.filter = '';
      }
      return;
    }

    const filterId = `badge-color-filter-${idx}`;
    let svgFilterContainer = document.getElementById('badge-filter-svg');
    
    if (!svgFilterContainer) {
      svgFilterContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgFilterContainer.id = 'badge-filter-svg';
      svgFilterContainer.style.position = 'absolute';
      svgFilterContainer.style.width = '0';
      svgFilterContainer.style.height = '0';
      svgFilterContainer.style.pointerEvents = 'none';
      document.body.appendChild(svgFilterContainer);
    }
    
    let defs = svgFilterContainer.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgFilterContainer.appendChild(defs);
    }
    
    let filter = defs.querySelector(`#${filterId}`);
    if (!filter) {
      filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.id = filterId;
      filter.setAttribute('color-interpolation-filters', 'sRGB');
      defs.appendChild(filter);
    }
    
    filter.innerHTML = '';
    
    // Extraire le canal alpha
    const extractAlpha = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    extractAlpha.setAttribute('type', 'matrix');
    extractAlpha.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0');
    extractAlpha.setAttribute('result', 'alpha');
    filter.appendChild(extractAlpha);
    
    // Créer la couleur de remplissage
    const flood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
    flood.setAttribute('flood-color', color);
    flood.setAttribute('result', 'flood');
    filter.appendChild(flood);
    
    // Combiner la couleur avec le canal alpha
    const composite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    composite.setAttribute('in', 'flood');
    composite.setAttribute('in2', 'alpha');
    composite.setAttribute('operator', 'in');
    filter.appendChild(composite);
    
    // Appliquer le filtre au badge spécifique
    const badges = pdfPreview.querySelectorAll('.badge-instance');
    if (badges[idx]) {
      badges[idx].style.filter = `url(#${filterId})`;
    }
  }

  function syncBadgeLayoutInputsFromStored() {
    if (!badgeLayoutContainer) return;
    const layouts = getStoredBadgeLayouts();
    badgeLayoutContainer.querySelectorAll('input[data-idx]').forEach((input) => {
      const idx = Number(input.dataset.idx);
      const layout = layouts[idx] || defaultLayoutForIndex(idx);
      input.value = layout.heightPx;
      // Mettre à jour la valeur affichée
      const valueEl = document.getElementById(`badgeSizeValue-${idx}`);
      if (valueEl) {
        valueEl.textContent = `${layout.heightPx}px`;
      }
    });
  }

  function onBadgeSizeChange(e, pdfPreview) {
    const idx = Number(e.target.dataset.idx || 0);
    const val = Number(e.target.value) || defaultLayoutForIndex(idx).heightPx;
    const layout = getLayoutForIndex(idx);
    setLayoutForIndex(idx, { ...layout, heightPx: val });
    
    // Récupérer pdfPreview depuis le DOM si non fourni
    const previewEl = pdfPreview || document.getElementById('pdfPreview');
    if (previewEl) {
      applyBadgeLayoutsToPreview(previewEl);
    }
  }

  function renderBadgeLayoutControls(badgeNames, pdfPreview) {
    if (!badgeLayoutContainer) return;
    if (!Array.isArray(badgeNames) || badgeNames.length === 0) {
      badgeLayoutContainer.innerHTML = '<p class="empty-state">Sélectionnez un atout pour le configurer</p>';
      const configSection = badgeLayoutContainer.closest('.badges-config-section');
      if (configSection) {
        configSection.classList.remove('has-content');
      }
      return;
    }

    // Couleurs disponibles pour les badges
    const availableColors = [
      { value: '#E65B0C', label: 'Orange' },
      { value: '#F6E2BE', label: 'Beige' },
      { value: '#60191A', label: 'Bordeaux' },
      { value: '#B5DBE8', label: 'Bleu clair' },
      { value: '#000000', label: 'Noir' },
      { value: '#FFFFFF', label: 'Blanc' }
    ];

    const layouts = getStoredBadgeLayouts();
    
    // Générer le HTML pour chaque badge avec chargement asynchrone des couleurs SVG
    const html = badgeNames.map((name, idx) => {
      const layout = layouts[idx] || defaultLayoutForIndex(idx);
      const badgeColors = layout.colors || {};
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
            <div class="control-group badge-colors-container" id="badgeColors-${idx}">
              <label class="control-label">
                <span>Couleurs</span>
              </label>
              <div class="badge-colors-loading">Analyse du SVG...</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    badgeLayoutContainer.innerHTML = html;
    
    // Gérer l'affichage de l'empty state
    const configSection = badgeLayoutContainer.closest('.badges-config-section');
    if (configSection) {
      if (badgeNames.length > 0) {
        configSection.classList.add('has-content');
      } else {
        configSection.classList.remove('has-content');
      }
    }
    
    badgeLayoutContainer.querySelectorAll('input[data-idx]').forEach((input) => {
      input.addEventListener('input', (ev) => {
        // Récupérer pdfPreview depuis le DOM si non fourni
        const previewEl = pdfPreview || document.getElementById('pdfPreview');
        onBadgeSizeChange(ev, previewEl);
        // Mettre à jour la valeur affichée
        const idx = Number(ev.target.dataset.idx);
        const valueEl = document.getElementById(`badgeSizeValue-${idx}`);
        if (valueEl) {
          valueEl.textContent = `${ev.target.value}px`;
        }
      });
    });

    // Charger et analyser les SVG pour chaque badge
    badgeNames.forEach((name, idx) => {
      loadAndAnalyzeBadgeSVG(name, idx, availableColors);
    });
  }

  // Charger et analyser un SVG pour extraire ses couleurs
  async function loadAndAnalyzeBadgeSVG(badgeName, idx, availableColors) {
    const colorsContainer = document.getElementById(`badgeColors-${idx}`);
    if (!colorsContainer) return;

    try {
      const badgeImageBaseUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_BADGE_IMAGE_URL) 
        ? CONFIG.N8N_BADGE_IMAGE_URL 
        : 'https://n8n-seb.sandbox-jerem.com/webhook/fiche_produit/badge';
      
      const badgeUrl = `${badgeImageBaseUrl}?name=${encodeURIComponent(badgeName)}&cb=${Date.now()}`;
      
      // Charger le SVG en tant que texte
      const response = await fetch(badgeUrl);
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const svgText = await response.text();
      
      // Parser le SVG pour extraire les couleurs
      const colors = extractColorsFromSVG(svgText);
      
      if (colors.length === 0) {
        colorsContainer.innerHTML = '<div class="badge-colors-empty">Aucune couleur détectée</div>';
        return;
      }

      // Récupérer les couleurs sauvegardées
      const layout = getLayoutForIndex(idx);
      const savedColors = layout.colors || {};

      // Générer les contrôles de couleur
      const colorsHtml = colors.map((originalColor, colorIdx) => {
        const colorKey = `color-${colorIdx}`;
        const savedColor = savedColors[colorKey] || originalColor;
        return `
          <div class="badge-color-item">
            <label class="control-label-small">
              <span class="color-label">Couleur ${colorIdx + 1}</span>
              <span class="color-preview" style="background-color: ${savedColor};"></span>
            </label>
            <select class="select-input-small badge-color-select" 
                    data-idx="${idx}" 
                    data-color-key="${colorKey}"
                    data-original-color="${originalColor}">
              <option value="${originalColor}" ${savedColor === originalColor ? 'selected' : ''}>Original (${originalColor})</option>
              ${availableColors.map(c => 
                `<option value="${c.value}" ${savedColor === c.value ? 'selected' : ''}>${c.label}</option>`
              ).join('')}
            </select>
          </div>
        `;
      }).join('');

      colorsContainer.innerHTML = `
        <div class="badge-colors-list">${colorsHtml}</div>
      `;

      // Attacher les événements de changement de couleur
      colorsContainer.querySelectorAll('.badge-color-select').forEach((select) => {
        select.addEventListener('change', (ev) => {
          const badgeIdx = Number(ev.target.dataset.idx);
          const colorKey = ev.target.dataset.colorKey;
          const newColor = ev.target.value;
          
          // Mettre à jour les couleurs sauvegardées
          const layout = getLayoutForIndex(badgeIdx);
          if (!layout.colors) layout.colors = {};
          layout.colors[colorKey] = newColor;
          setLayoutForIndex(badgeIdx, layout);
          
          // Mettre à jour le preview
          const previewEl = pdfPreview || document.getElementById('pdfPreview');
          if (previewEl) {
            applyBadgeColorsToPreview(previewEl, badgeIdx, layout.colors, badgeName);
          }
          
          // Mettre à jour le preview de couleur
          const colorPreview = ev.target.previousElementSibling?.querySelector('.color-preview');
          if (colorPreview) {
            colorPreview.style.backgroundColor = newColor;
          }
        });
      });

    } catch (error) {
      console.error('Erreur lors de l\'analyse du SVG:', error);
      colorsContainer.innerHTML = '<div class="badge-colors-error">Erreur de chargement</div>';
    }
  }

  // Extraire toutes les couleurs uniques d'un SVG
  function extractColorsFromSVG(svgText) {
    const colors = new Set();
    
    // Parser le SVG avec un DOMParser
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    
    // Fonction récursive pour parcourir tous les éléments
    function traverseElement(element) {
      if (!element || element.nodeType !== 1) return; // Node.ELEMENT_NODE
      
      // Extraire fill
      const fill = element.getAttribute('fill');
      if (fill && fill !== 'none' && fill !== 'transparent' && !fill.startsWith('url(')) {
        const normalizedFill = normalizeColor(fill);
        if (normalizedFill) colors.add(normalizedFill);
      }
      
      // Extraire stroke
      const stroke = element.getAttribute('stroke');
      if (stroke && stroke !== 'none' && stroke !== 'transparent' && !stroke.startsWith('url(')) {
        const normalizedStroke = normalizeColor(stroke);
        if (normalizedStroke) colors.add(normalizedStroke);
      }
      
      // Parcourir les enfants
      Array.from(element.children).forEach(child => traverseElement(child));
    }
    
    traverseElement(svgDoc.documentElement);
    
    return Array.from(colors);
  }

  // Normaliser une couleur (hex, rgb, nom) en hex
  function normalizeColor(color) {
    if (!color) return null;
    
    // Si c'est déjà en hex
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color.toUpperCase();
    if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
      // Convertir #RGB en #RRGGBB
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    
    // Si c'est en rgb/rgba
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
      return '#' + r + g + b;
    }
    
    // Noms de couleurs CSS
    const colorNames = {
      'black': '#000000', 'white': '#FFFFFF', 'red': '#FF0000',
      'green': '#008000', 'blue': '#0000FF', 'yellow': '#FFFF00',
      'orange': '#FFA500', 'purple': '#800080', 'pink': '#FFC0CB'
    };
    if (colorNames[color.toLowerCase()]) {
      return colorNames[color.toLowerCase()];
    }
    
    return null;
  }

  // Appliquer les couleurs modifiées au badge dans le preview
  async function applyBadgeColorsToPreview(pdfPreview, idx, colors, badgeName) {
    if (!pdfPreview || !colors || Object.keys(colors).length === 0) return;

    try {
      const badgeImageBaseUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_BADGE_IMAGE_URL) 
        ? CONFIG.N8N_BADGE_IMAGE_URL 
        : 'https://n8n-seb.sandbox-jerem.com/webhook/fiche_produit/badge';
      
      const badgeUrl = `${badgeImageBaseUrl}?name=${encodeURIComponent(badgeName)}&cb=${Date.now()}`;
      
      // Charger le SVG original
      const response = await fetch(badgeUrl);
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const svgText = await response.text();
      
      // Modifier les couleurs dans le SVG
      const modifiedSVG = replaceColorsInSVG(svgText, colors);
      
      // Convertir en data URI directement (pas de blob URL pour compatibilité PDF)
      const encoded = btoa(unescape(encodeURIComponent(modifiedSVG)));
      const dataUri = `data:image/svg+xml;base64,${encoded}`;
      
      // Appliquer au badge dans le preview
      const badges = pdfPreview.querySelectorAll('.badge-instance');
      if (badges[idx]) {
        badges[idx].src = dataUri;
        badges[idx].style.filter = ''; // Retirer les anciens filtres
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'application des couleurs:', error);
    }
  }

  // Remplacer les couleurs dans un SVG
  function replaceColorsInSVG(svgText, colorMap) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    
    // Créer un mapping des couleurs originales vers les nouvelles
    const colorKeys = Object.keys(colorMap).sort();
    const originalColors = [];
    
    // Extraire les couleurs originales dans l'ordre
    function extractOriginalColors(element) {
      if (!element || element.nodeType !== 1) return;
      
      const fill = element.getAttribute('fill');
      if (fill && fill !== 'none' && fill !== 'transparent' && !fill.startsWith('url(')) {
        const normalized = normalizeColor(fill);
        if (normalized && !originalColors.includes(normalized)) {
          originalColors.push(normalized);
        }
      }
      
      const stroke = element.getAttribute('stroke');
      if (stroke && stroke !== 'none' && stroke !== 'transparent' && !stroke.startsWith('url(')) {
        const normalized = normalizeColor(stroke);
        if (normalized && !originalColors.includes(normalized)) {
          originalColors.push(normalized);
        }
      }
      
      Array.from(element.children).forEach(child => extractOriginalColors(child));
    }
    
    extractOriginalColors(svgDoc.documentElement);
    
    // Remplacer les couleurs
    function replaceColors(element) {
      if (!element || element.nodeType !== 1) return;
      
      // Remplacer fill
      const fill = element.getAttribute('fill');
      if (fill && fill !== 'none' && fill !== 'transparent' && !fill.startsWith('url(')) {
        const normalized = normalizeColor(fill);
        if (normalized) {
          const colorIdx = originalColors.indexOf(normalized);
          if (colorIdx >= 0 && colorIdx < colorKeys.length) {
            const newColor = colorMap[colorKeys[colorIdx]];
            if (newColor) {
              element.setAttribute('fill', newColor);
            }
          }
        }
      }
      
      // Remplacer stroke
      const stroke = element.getAttribute('stroke');
      if (stroke && stroke !== 'none' && stroke !== 'transparent' && !stroke.startsWith('url(')) {
        const normalized = normalizeColor(stroke);
        if (normalized) {
          const colorIdx = originalColors.indexOf(normalized);
          if (colorIdx >= 0 && colorIdx < colorKeys.length) {
            const newColor = colorMap[colorKeys[colorIdx]];
            if (newColor) {
              element.setAttribute('stroke', newColor);
            }
          }
        }
      }
      
      Array.from(element.children).forEach(child => replaceColors(child));
    }
    
    replaceColors(svgDoc.documentElement);
    
    // Retourner le SVG modifié en tant que string
    return new XMLSerializer().serializeToString(svgDoc.documentElement);
  }

  function updateBadgeCount(count) {
    const badgeCountEl = document.getElementById('badgeCount');
    if (badgeCountEl) {
      badgeCountEl.textContent = count;
      badgeCountEl.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  // Drag & drop
  function attachBadgeDrag(badgeEl) {
    if (!badgeEl) return;
    badgeEl.style.cursor = 'move';
    badgeEl.addEventListener('mousedown', startBadgeDrag);
    badgeEl.addEventListener('touchstart', startBadgeDrag, { passive: false });
  }

  function startBadgeDrag(e) {
    e.preventDefault();
    const badgeEl = e.currentTarget;
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview || !badgeEl) return;

    const point = Utils.getPointFromEvent(e);
    const rect = badgeEl.getBoundingClientRect();
    dragOffset = {
      x: point.x - rect.left,
      y: point.y - rect.top,
      badgeIndex: Array.from(pdfPreview.querySelectorAll('.badge-instance')).indexOf(badgeEl)
    };
    isDraggingBadge = true;

    document.addEventListener('mousemove', onBadgeDragMove);
    document.addEventListener('mouseup', endBadgeDrag);
    document.addEventListener('touchmove', onBadgeDragMove, { passive: false });
    document.addEventListener('touchend', endBadgeDrag);
  }

  function onBadgeDragMove(e) {
    if (!isDraggingBadge) return;
    e.preventDefault();
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) return;

    const point = Utils.getPointFromEvent(e);
    const containerRect = pdfPreview.getBoundingClientRect();

    let leftPx = point.x - dragOffset.x - containerRect.left;
    let topPx = point.y - dragOffset.y - containerRect.top;

    const badgeList = pdfPreview.querySelectorAll('.badge-instance');
    const badge = (dragOffset.badgeIndex != null && dragOffset.badgeIndex >= 0) ? badgeList[dragOffset.badgeIndex] : badgeList[0];
    const badgeRect = badge ? badge.getBoundingClientRect() : { width: 0, height: 0 };
    leftPx = Math.max(0, Math.min(leftPx, containerRect.width - badgeRect.width));
    topPx = Math.max(0, Math.min(topPx, containerRect.height - badgeRect.height));

    const xPercent = (leftPx / containerRect.width) * 100;
    const bottomPx = containerRect.height - (topPx + badgeRect.height);
    const yPercent = (bottomPx / containerRect.height) * 100;

    const badgeIdx = (dragOffset.badgeIndex != null && dragOffset.badgeIndex >= 0) ? dragOffset.badgeIndex : 0;
    const currentLayout = getLayoutForIndex(badgeIdx);
    const layout = {
      xPercent: Utils.clamp(xPercent, 0, 100),
      yPercent: Utils.clamp(yPercent, 0, 100),
      heightPx: badgeRect.height || currentLayout.heightPx,
      color: currentLayout.color || null
    };

    setLayoutForIndex(badgeIdx, layout);
    applyBadgeLayoutsToPreview(pdfPreview);
    syncBadgeLayoutInputsFromStored();
  }

  function endBadgeDrag() {
    isDraggingBadge = false;
    document.removeEventListener('mousemove', onBadgeDragMove);
    document.removeEventListener('mouseup', endBadgeDrag);
    document.removeEventListener('touchmove', onBadgeDragMove);
    document.removeEventListener('touchend', endBadgeDrag);
  }

  function attachDragToAll(pdfPreview) {
    const instances = pdfPreview.querySelectorAll('.badge-instance');
    instances.forEach((img) => attachBadgeDrag(img));
  }

  // Expose module global
  window.BadgeManager = {
    loadBadges,
    getBadgeNames: getBadgeNamesArray,
    renderLayoutControls: renderBadgeLayoutControls,
    applyLayouts: applyBadgeLayoutsToPreview,
    ensureLayouts: ensureLayoutsForBadges,
    attachDragToAll,
    getLayoutForIndex,
    setLayoutForIndex,
    defaultLayoutForIndex,
    syncLayoutInputsFromStored: syncBadgeLayoutInputsFromStored,
    updateBadgeCount
  };
})();

