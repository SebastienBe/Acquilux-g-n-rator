// ========================================
// CREATORS - Créateurs de panels Figma
// ========================================

(function() {
  'use strict';

  if (!window.FigmaPanelHelpers) {
    console.error('FigmaPanelHelpers non disponible');
    return;
  }

  const { escapeHtml, rgbToHex } = window.FigmaPanelHelpers;

  // Créer le panel pour le titre (h1)
  function createTitlePanel(element) {
    const text = element.textContent || '';
    
    const pdfPreview = element.closest('#pdfPreview');
    const headerBand = pdfPreview?.querySelector('.header-orange-band');
    const headerContent = pdfPreview?.querySelector('.header-content');
    
    let currentHeaderColor = '#E65B0C';
    let currentHeaderHeight = 90;
    let currentHeaderPaddingTop = 10;
    let currentHeaderPaddingRight = 20;
    let currentHeaderPaddingBottom = 10;
    let currentHeaderPaddingLeft = 20;
    
    if (headerBand) {
      const computedStyle = window.getComputedStyle(headerBand);
      currentHeaderColor = headerBand.style.backgroundColor || 
                          computedStyle.backgroundColor || 
                          '#E65B0C';
      
      if (headerBand.style.height) {
        currentHeaderHeight = parseFloat(headerBand.style.height);
      } else if (computedStyle.height && computedStyle.height !== 'auto') {
        currentHeaderHeight = parseFloat(computedStyle.height);
      }
    }
    
    if (headerContent) {
      const computedStyle = window.getComputedStyle(headerContent);
      
      if (headerContent.style.paddingTop) {
        currentHeaderPaddingTop = parseFloat(headerContent.style.paddingTop);
      } else if (computedStyle.paddingTop) {
        currentHeaderPaddingTop = parseFloat(computedStyle.paddingTop);
      }
      
      if (headerContent.style.paddingRight) {
        currentHeaderPaddingRight = parseFloat(headerContent.style.paddingRight);
      } else if (computedStyle.paddingRight) {
        currentHeaderPaddingRight = parseFloat(computedStyle.paddingRight);
      }
      
      if (headerContent.style.paddingBottom) {
        currentHeaderPaddingBottom = parseFloat(headerContent.style.paddingBottom);
      } else if (computedStyle.paddingBottom) {
        currentHeaderPaddingBottom = parseFloat(computedStyle.paddingBottom);
      }
      
      if (headerContent.style.paddingLeft) {
        currentHeaderPaddingLeft = parseFloat(headerContent.style.paddingLeft);
      } else if (computedStyle.paddingLeft) {
        currentHeaderPaddingLeft = parseFloat(computedStyle.paddingLeft);
      }
    }
    
    const headerColorHex = rgbToHex(currentHeaderColor);
    
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📝</span>
          <h3>Text</h3>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <textarea 
              id="panelTitleText" 
              class="figma-textarea" 
              rows="2"
              placeholder="Titre du produit"
            >${escapeHtml(text)}</textarea>
          </div>
        </div>
      </div>
      
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">🎨</span>
          <h3>Header Layout</h3>
        </div>
        
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Background Color</label>
            <div class="figma-color-wrapper">
              <input type="color" id="panelHeaderBgColor" class="figma-color-input" value="${headerColorHex}">
              <input type="text" id="panelHeaderBgColorText" class="figma-text-input" value="${headerColorHex}">
            </div>
          </div>
        </div>
        
        <div class="figma-control-row">
          <div class="figma-control-group">
            <label class="figma-label">Height</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelHeaderHeight" class="figma-number-input" value="${currentHeaderHeight}" step="0.1" min="0">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>
        
        <div class="figma-control-row">
          <div class="figma-control-group">
            <label class="figma-label">Padding Top</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelHeaderPaddingTop" class="figma-number-input" value="${currentHeaderPaddingTop}" step="0.1" min="0">
              <span class="figma-unit">px</span>
            </div>
          </div>
          <div class="figma-control-group">
            <label class="figma-label">Padding Right</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelHeaderPaddingRight" class="figma-number-input" value="${currentHeaderPaddingRight}" step="0.1" min="0">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>
        
        <div class="figma-control-row">
          <div class="figma-control-group">
            <label class="figma-label">Padding Bottom</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelHeaderPaddingBottom" class="figma-number-input" value="${currentHeaderPaddingBottom}" step="0.1" min="0">
              <span class="figma-unit">px</span>
            </div>
          </div>
          <div class="figma-control-group">
            <label class="figma-label">Padding Left</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelHeaderPaddingLeft" class="figma-number-input" value="${currentHeaderPaddingLeft}" step="0.1" min="0">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>
      </div>
      
      ${createTypographyPanel(element, 'h1')}
      ${window.createAdvancedSpacingPanel ? window.createAdvancedSpacingPanel(element) : createSpacingPanel(element)}
    `;
  }

  // Créer le panel pour le slogan
  function createSloganPanel(element) {
    const text = element.textContent || '';
    
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📝</span>
          <h3>Text</h3>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <textarea 
              id="panelSloganText" 
              class="figma-textarea" 
              rows="2"
              placeholder="Slogan"
            >${escapeHtml(text)}</textarea>
          </div>
        </div>
      </div>
      
      ${createTypographyPanel(element, 'slogan')}
      ${window.createAdvancedSpacingPanel ? window.createAdvancedSpacingPanel(element) : createSpacingPanel(element)}
      ${window.createAdvancedBordersPanel ? window.createAdvancedBordersPanel(element) : ''}
      ${window.createAdvancedShadowsPanel ? window.createAdvancedShadowsPanel(element) : ''}
    `;
  }

  // Créer le panel pour une section (h2)
  function createSectionPanel(element) {
    const text = element.textContent || '';
    const sectionName = element.getAttribute('data-section') || '';
    const sectionIndex = element.getAttribute('data-section-index');
    const isHidden = element.classList.contains('section-hidden');
    
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📝</span>
          <h3>Text</h3>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <input 
              type="text" 
              id="panelSectionText" 
              class="figma-text-input" 
              placeholder="Titre de section"
              value="${escapeHtml(text)}"
            >
          </div>
        </div>
      </div>
      
      ${createTypographyPanel(element, 'h2')}
      ${window.createAdvancedSpacingPanel ? window.createAdvancedSpacingPanel(element) : createSpacingPanel(element)}
      ${window.createAdvancedBordersPanel ? window.createAdvancedBordersPanel(element) : ''}
      ${window.createAdvancedShadowsPanel ? window.createAdvancedShadowsPanel(element) : ''}
      
      ${createSectionActionsPanel(element, sectionName, isHidden)}
    `;
  }
  
  // Créer le panel d'actions pour les sections
  function createSectionActionsPanel(element, sectionName, isHidden) {
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">⚙️</span>
          <h3>Actions</h3>
        </div>
        <div class="figma-control-row">
          <button class="figma-action-btn ${isHidden ? 'figma-action-btn-success' : 'figma-action-btn-danger'}" 
                  data-action="${isHidden ? 'show-section' : 'hide-section'}"
                  data-section="${sectionName}">
            ${isHidden ? '✓ Afficher la section' : '✕ Masquer la section'}
          </button>
        </div>
      </div>
    `;
  }

  // Créer le panel pour un élément de liste
  function createListItemPanel(element) {
    const listItem = element.closest('li');
    const list = listItem?.closest('ul');
    const sectionIndex = list?.previousElementSibling?.getAttribute('data-section-index');
    
    let content = '';
    if (sectionIndex === '0') {
      const type = listItem.querySelector('strong')?.textContent || '';
      const desc = listItem.textContent.replace(type, '').trim() || '';
      content = `
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Type</label>
            <input type="text" id="panelListItemType" class="figma-text-input" value="${escapeHtml(type)}">
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Description</label>
            <textarea id="panelListItemDesc" class="figma-textarea" rows="2">${escapeHtml(desc)}</textarea>
          </div>
        </div>
      `;
    } else {
      content = `
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <textarea id="panelListItemText" class="figma-textarea" rows="2">${escapeHtml(listItem.textContent)}</textarea>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📝</span>
          <h3>Content</h3>
        </div>
        ${content}
      </div>
      
      ${createTypographyPanel(element, 'p')}
      ${window.createAdvancedSpacingPanel ? window.createAdvancedSpacingPanel(element) : createSpacingPanel(element)}
      ${window.createAdvancedBordersPanel ? window.createAdvancedBordersPanel(element) : ''}
      ${window.createAdvancedShadowsPanel ? window.createAdvancedShadowsPanel(element) : ''}
      ${createListItemActionsPanel(listItem)}
    `;
  }

  // Créer le panel pour une recette
  function createRecipePanel(element) {
    const recipe = element;
    const strong = recipe.querySelector('strong');
    const recipeText = strong?.textContent || '';
    const recipeMatch = recipeText.match(/Recette\s+(Sucrée|Salée)\s*:\s*(.*)/);
    const type = recipeMatch ? recipeMatch[1] : 'Sucrée';
    const name = recipeMatch ? recipeMatch[2] : recipeText.replace(/Recette\s+(Sucrée|Salée)\s*:\s*/, '');
    const ingredients = recipe.querySelector('.recipe-ingredients .ingredients-content')?.textContent || '';
    const astuceEl = recipe.querySelector('.recipe-astuce');
    const astuce = astuceEl ? astuceEl.textContent.replace('💡 Astuce : ', '').trim() : '';
    
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📝</span>
          <h3>Content</h3>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Nom</label>
            <input type="text" id="panelRecipeName" class="figma-text-input" value="${escapeHtml(name)}">
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Type</label>
            <input type="text" id="panelRecipeType" class="figma-text-input" value="${escapeHtml(type)}">
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Ingrédients</label>
            <textarea id="panelRecipeIngredients" class="figma-textarea" rows="3">${escapeHtml(ingredients)}</textarea>
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Astuce</label>
            <textarea id="panelRecipeAstuce" class="figma-textarea" rows="2">${escapeHtml(astuce)}</textarea>
          </div>
        </div>
      </div>
      
      ${createTypographyPanel(recipe, 'recipe')}
      ${window.createAdvancedSpacingPanel ? window.createAdvancedSpacingPanel(recipe) : createSpacingPanel(recipe)}
      ${window.createAdvancedBordersPanel ? window.createAdvancedBordersPanel(recipe) : ''}
      ${window.createAdvancedShadowsPanel ? window.createAdvancedShadowsPanel(recipe) : ''}
      ${createRecipeActionsPanel(recipe)}
    `;
  }

  // Créer le panel pour le bloc principal
  function createMainPanel(element) {
    const pdfPreview = document.getElementById('pdfPreview');
    
    let currentWidth = 595;
    let currentPadding = 20;
    let currentBgColor = '#F6E2BE';
    
    if (pdfPreview) {
      const computedStyle = window.getComputedStyle(pdfPreview);
      
      if (pdfPreview.style.width) {
        currentWidth = parseFloat(pdfPreview.style.width);
      } else if (computedStyle.width && computedStyle.width !== 'auto') {
        currentWidth = parseFloat(computedStyle.width);
      }
      
      if (pdfPreview.style.padding) {
        const paddingMatch = pdfPreview.style.padding.match(/(\d+)px/);
        if (paddingMatch) {
          currentPadding = parseFloat(paddingMatch[1]);
        }
      } else if (computedStyle.padding) {
        const paddingMatch = computedStyle.padding.match(/(\d+)px/);
        if (paddingMatch) {
          currentPadding = parseFloat(paddingMatch[1]);
        }
      }
      
      currentBgColor = pdfPreview.style.backgroundColor || 
                      computedStyle.backgroundColor || 
                      '#F6E2BE';
    }
    
    const bgColorHex = rgbToHex(currentBgColor);
    
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📐</span>
          <h3>Layout</h3>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Width</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelMainWidth" class="figma-number-input" value="${currentWidth}" min="200" max="1200" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>
        ${window.createAdvancedSpacingPanel ? window.createAdvancedSpacingPanel(element) : `
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Padding</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelMainPadding" class="figma-number-input" value="${currentPadding}" min="0" max="100" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>
        `}
      </div>
      
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">🎨</span>
          <h3>Background</h3>
        </div>
        ${window.createAdvancedColorPanel ? window.createAdvancedColorPanel(element, 'backgroundColor') : `
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Color</label>
            <div class="figma-color-wrapper">
              <input type="color" id="panelMainBgColor" class="figma-color-input" value="${bgColorHex}">
              <input type="text" id="panelMainBgColorText" class="figma-text-input" value="${bgColorHex}">
            </div>
            <button class="figma-action-btn" id="applyMainBgColorBtn" style="margin-top: 8px; width: 100%; padding: 8px 12px; font-size: 11px; background: #18A0FB; color: white; border-color: #18A0FB;">✓ Appliquer</button>
            </div>
          </div>
        </div>
        `}
      </div>
      
      ${window.createBadgeSelectionPanel ? window.createBadgeSelectionPanel() : ''}
      ${window.createBadgeConfigPanel ? window.createBadgeConfigPanel() : ''}
      ${window.createStylesPanel ? window.createStylesPanel() : ''}
      ${window.createGridPanel ? window.createGridPanel() : ''}
      ${window.createResponsivePanel ? window.createResponsivePanel() : ''}
      ${window.createExportPanel ? window.createExportPanel() : ''}
    `;
  }

  // Créer le panel d'édition d'image
  function createImagePanel(element) {
    if (!element || element.tagName !== 'IMG') {
      return createDefaultPanel(element);
    }

    const computedStyle = window.getComputedStyle(element);
    const widthMatch = element.style.width ? element.style.width.match(/(\d+)%/) : null;
    const heightMatch = element.style.height ? element.style.height.match(/(\d+)%/) : null;
    const transformMatch = element.style.transform ? element.style.transform.match(/rotate\((-?\d+)deg\)/) : null;
    const brightnessMatch = element.style.filter ? element.style.filter.match(/brightness\((\d+)%\)/) : null;
    const contrastMatch = element.style.filter ? element.style.filter.match(/contrast\((\d+)%\)/) : null;
    const saturationMatch = element.style.filter ? element.style.filter.match(/saturate\((\d+)%\)/) : null;
    const objectFit = computedStyle.objectFit || 'cover';
    const objectPosition = computedStyle.objectPosition || 'center';
    
    const clipPath = element.style.clipPath || computedStyle.clipPath || '';
    const container = element.parentElement;
    const containerTransform = container ? container.style.transform || window.getComputedStyle(container).transform : '';

    function parseObjectPosition(pos) {
      if (!pos) return { x: 50, y: 50 };
      const presets = {
        'center': { x: 50, y: 50 },
        'top': { x: 50, y: 0 },
        'bottom': { x: 50, y: 100 },
        'left': { x: 0, y: 50 },
        'right': { x: 100, y: 50 },
        'top left': { x: 0, y: 0 },
        'top right': { x: 100, y: 0 },
        'bottom left': { x: 0, y: 100 },
        'bottom right': { x: 100, y: 100 }
      };
      if (presets[pos]) return presets[pos];

      const parts = pos.split(' ');
      let x = 50, y = 50;
      if (parts.length === 2) {
        x = parseFloat(parts[0]) || 50;
        y = parseFloat(parts[1]) || 50;
      }
      return { x, y };
    }

    const { x: currentPosX, y: currentPosY } = parseObjectPosition(objectPosition);

    function parseClipPathInset(cp) {
      const defaults = { top: 0, right: 0, bottom: 0, left: 0 };
      if (!cp || !cp.startsWith('inset(')) return defaults;
      const inside = cp.slice(6, -1).trim();
      const parts = inside.split(/\s+/);
      if (parts.length < 4) return defaults;
      const [t, r, b, l] = parts;
      const toNum = (v) => {
        if (!v) return 0;
        if (v.endsWith('%')) return parseFloat(v);
        if (v.endsWith('px')) return parseFloat(v);
        return parseFloat(v) || 0;
      };
      return {
        top: toNum(t),
        right: toNum(r),
        bottom: toNum(b),
        left: toNum(l)
      };
    }

    const clip = parseClipPathInset(clipPath);
    const currentCropTop = element.dataset.cropTop != null
      ? parseFloat(element.dataset.cropTop) || 0
      : clip.top;
    const currentCropRight = element.dataset.cropRight != null
      ? parseFloat(element.dataset.cropRight) || 0
      : clip.right;
    const currentCropBottom = element.dataset.cropBottom != null
      ? parseFloat(element.dataset.cropBottom) || 0
      : clip.bottom;
    const currentCropLeft = element.dataset.cropLeft != null
      ? parseFloat(element.dataset.cropLeft) || 0
      : clip.left;

    function parseTranslateY(transform) {
      if (!transform || transform === 'none') return 0;
      const match = transform.match(/translateY\((-?\d+(?:\.\d+)?)px\)/i);
      if (match) return parseFloat(match[1]);
      return 0;
    }
    const currentBlockOffsetY = parseTranslateY(containerTransform);

    const currentZoom = 100;

    const currentWidth = widthMatch ? parseInt(widthMatch[1]) : 100;
    const currentHeight = heightMatch ? parseInt(heightMatch[1]) : (element.style.height === 'auto' ? 100 : 100);
    const currentRotation = transformMatch ? parseInt(transformMatch[1]) : 0;
    const currentBrightness = brightnessMatch ? parseInt(brightnessMatch[1]) : 100;
    const currentContrast = contrastMatch ? parseInt(contrastMatch[1]) : 100;
    const currentSaturation = saturationMatch ? parseInt(saturationMatch[1]) : 100;

    const panelId = `image-panel-${Date.now()}`;
    element.dataset.imagePanelId = panelId;

    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📐</span>
          <h3>Fitting</h3>
        </div>
        <div class="figma-control-row">
          <div class="figma-button-group" style="width: 100%; display: flex; gap: 4px;">
            <button class="figma-icon-btn ${objectFit === 'fill' ? 'active' : ''}" 
                    data-image-fit="fill" 
                    data-panel-id="${panelId}"
                    title="Fill - Étirer l'image pour remplir le conteneur">
              <span>Fill</span>
            </button>
            <button class="figma-icon-btn ${objectFit === 'cover' ? 'active' : ''}" 
                    data-image-fit="cover" 
                    data-panel-id="${panelId}"
                    title="Cover - Remplir le conteneur en conservant les proportions">
              <span>Cover</span>
            </button>
            <button class="figma-icon-btn ${objectFit === 'contain' ? 'active' : ''}" 
                    data-image-fit="contain" 
                    data-panel-id="${panelId}"
                    title="Contain - Afficher l'image entière dans le conteneur">
              <span>Contain</span>
            </button>
            <button class="figma-icon-btn ${objectFit === 'none' ? 'active' : ''}" 
                    data-image-fit="none" 
                    data-panel-id="${panelId}"
                    title="None - Taille originale">
              <span>None</span>
            </button>
          </div>
        </div>
        <div class="figma-control-row" style="margin-top: 8px;">
          <div class="figma-control-group full-width">
            <label class="figma-label">Position</label>
            <select class="figma-select" data-image-position data-panel-id="${panelId}">
              <option value="center" ${objectPosition === 'center' ? 'selected' : ''}>Center</option>
              <option value="top" ${objectPosition === 'top' ? 'selected' : ''}>Top</option>
              <option value="bottom" ${objectPosition === 'bottom' ? 'selected' : ''}>Bottom</option>
              <option value="left" ${objectPosition === 'left' ? 'selected' : ''}>Left</option>
              <option value="right" ${objectPosition === 'right' ? 'selected' : ''}>Right</option>
              <option value="top left" ${objectPosition === 'top left' ? 'selected' : ''}>Top Left</option>
              <option value="top right" ${objectPosition === 'top right' ? 'selected' : ''}>Top Right</option>
              <option value="bottom left" ${objectPosition === 'bottom left' ? 'selected' : ''}>Bottom Left</option>
              <option value="bottom right" ${objectPosition === 'bottom right' ? 'selected' : ''}>Bottom Right</option>
            </select>
          </div>
        </div>
        <div class="figma-control-row" style="margin-top: 8px; gap: 10px;">
          <div class="figma-control-group">
            <label class="figma-label">Offset X</label>
            <div class="figma-slider-wrapper">
              <input type="range"
                     class="figma-slider"
                     data-image-pos-x
                     data-panel-id="${panelId}"
                     min="-100"
                     max="200"
                     step="1"
                     value="${currentPosX}">
              <span class="figma-slider-value" data-image-pos-x-value>${currentPosX}%</span>
            </div>
          </div>
          <div class="figma-control-group">
            <label class="figma-label">Offset Y</label>
            <div class="figma-slider-wrapper">
              <input type="range"
                     class="figma-slider"
                     data-image-pos-y
                     data-panel-id="${panelId}"
                     min="-100"
                     max="200"
                     step="1"
                     value="${currentPosY}">
              <span class="figma-slider-value" data-image-pos-y-value>${currentPosY}%</span>
            </div>
          </div>
        </div>
        <div class="figma-control-row" style="margin-top: 8px;">
          <div class="figma-control-group full-width">
            <label class="figma-label">Zoom (Crop)</label>
            <div class="figma-slider-wrapper">
              <input type="range"
                     class="figma-slider"
                     data-image-zoom
                     data-panel-id="${panelId}"
                     min="50"
                     max="200"
                     step="1"
                     value="${currentZoom}">
              <span class="figma-slider-value" data-image-zoom-value>${currentZoom}%</span>
            </div>
          </div>
        </div>
        <div class="figma-control-row" style="margin-top: 8px;">
          <div class="figma-control-group full-width">
            <label class="figma-label">Position bloc (Y)</label>
            <div class="figma-slider-wrapper">
              <input type="range"
                     class="figma-slider"
                     data-image-block-offset-y
                     data-panel-id="${panelId}"
                     min="-200"
                     max="200"
                     step="1"
                     value="${currentBlockOffsetY}">
              <span class="figma-slider-value" data-image-block-offset-y-value>${currentBlockOffsetY}px</span>
            </div>
          </div>
        </div>
      </div>

      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">✂️</span>
          <h3>Crop avancé</h3>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Haut</label>
            <div class="figma-slider-wrapper">
              <input type="range"
                     class="figma-slider"
                     data-image-crop-top
                     data-panel-id="${panelId}"
                     min="0"
                     max="50"
                     step="1"
                     value="${currentCropTop}">
              <span class="figma-slider-value" data-image-crop-top-value>${currentCropTop}%</span>
            </div>
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Bas</label>
            <div class="figma-slider-wrapper">
              <input type="range"
                     class="figma-slider"
                     data-image-crop-bottom
                     data-panel-id="${panelId}"
                     min="0"
                     max="50"
                     step="1"
                     value="${currentCropBottom}">
              <span class="figma-slider-value" data-image-crop-bottom-value>${currentCropBottom}%</span>
            </div>
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Gauche</label>
            <div class="figma-slider-wrapper">
              <input type="range"
                     class="figma-slider"
                     data-image-crop-left
                     data-panel-id="${panelId}"
                     min="0"
                     max="50"
                     step="1"
                     value="${currentCropLeft}">
              <span class="figma-slider-value" data-image-crop-left-value>${currentCropLeft}%</span>
            </div>
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Droite</label>
            <div class="figma-slider-wrapper">
              <input type="range"
                     class="figma-slider"
                     data-image-crop-right
                     data-panel-id="${panelId}"
                     min="0"
                     max="50"
                     step="1"
                     value="${currentCropRight}">
              <span class="figma-slider-value" data-image-crop-right-value>${currentCropRight}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">↔</span>
          <h3>Transform</h3>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group">
            <label class="figma-label">W</label>
            <div class="figma-input-wrapper">
              <input type="number" 
                     class="figma-number-input" 
                     data-image-width 
                     data-panel-id="${panelId}"
                     min="10" 
                     max="200" 
                     step="1" 
                     value="${currentWidth}">
              <span class="figma-unit">%</span>
            </div>
          </div>
          <div class="figma-control-group">
            <label class="figma-label">H</label>
            <div class="figma-input-wrapper">
              <input type="number" 
                     class="figma-number-input" 
                     data-image-height 
                     data-panel-id="${panelId}"
                     min="10" 
                     max="200" 
                     step="1" 
                     value="${currentHeight}">
              <span class="figma-unit">%</span>
            </div>
          </div>
          <button class="figma-link-btn" 
                  data-image-maintain-ratio 
                  data-panel-id="${panelId}"
                  title="Conserver les proportions">
            <span class="link-icon">🔗</span>
          </button>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Rotation</label>
            <div class="figma-input-wrapper">
              <input type="number" 
                     class="figma-number-input" 
                     data-image-rotation 
                     data-panel-id="${panelId}"
                     min="-180" 
                     max="180" 
                     step="1" 
                     value="${currentRotation}">
              <span class="figma-unit">°</span>
            </div>
          </div>
        </div>
        <div class="figma-button-group">
          <button class="figma-icon-btn" 
                  data-image-rotate-left 
                  data-panel-id="${panelId}"
                  title="Rotation -90°">↺</button>
          <button class="figma-icon-btn" 
                  data-image-rotate-right 
                  data-panel-id="${panelId}"
                  title="Rotation +90°">↻</button>
          <button class="figma-icon-btn" 
                  data-image-flip-h 
                  data-panel-id="${panelId}"
                  title="Retourner horizontalement">↔</button>
          <button class="figma-icon-btn" 
                  data-image-flip-v 
                  data-panel-id="${panelId}"
                  title="Retourner verticalement">↕</button>
        </div>
      </div>

      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">✨</span>
          <h3>Effects</h3>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Brightness</label>
            <div class="figma-slider-wrapper">
              <input type="range" 
                     class="figma-slider" 
                     data-image-brightness 
                     data-panel-id="${panelId}"
                     min="0" 
                     max="200" 
                     step="1" 
                     value="${currentBrightness}">
              <span class="figma-slider-value" data-image-brightness-value>${currentBrightness}%</span>
            </div>
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Contrast</label>
            <div class="figma-slider-wrapper">
              <input type="range" 
                     class="figma-slider" 
                     data-image-contrast 
                     data-panel-id="${panelId}"
                     min="0" 
                     max="200" 
                     step="1" 
                     value="${currentContrast}">
              <span class="figma-slider-value" data-image-contrast-value>${currentContrast}%</span>
            </div>
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Saturation</label>
            <div class="figma-slider-wrapper">
              <input type="range" 
                     class="figma-slider" 
                     data-image-saturation 
                     data-panel-id="${panelId}"
                     min="0" 
                     max="200" 
                     step="1" 
                     value="${currentSaturation}">
              <span class="figma-slider-value" data-image-saturation-value>${currentSaturation}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">⚙️</span>
          <h3>Actions</h3>
        </div>
        <div class="figma-control-row">
          <button class="figma-action-btn" 
                  data-image-reset 
                  data-panel-id="${panelId}"
                  style="width: 100%;">
            ↶ Réinitialiser
          </button>
        </div>
        <div class="figma-control-row">
          <button class="figma-action-btn figma-action-btn-danger" 
                  data-image-delete 
                  data-panel-id="${panelId}"
                  style="width: 100%;">
            🗑️ Supprimer
          </button>
        </div>
      </div>
    `;
  }

  // Créer le panel par défaut
  function createDefaultPanel(element) {
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">ℹ️</span>
          <h3>Info</h3>
        </div>
        <p style="padding: 8px; color: rgba(0,0,0,0.6); font-size: 11px;">
          Éditeur non disponible pour ce type d'élément
        </p>
      </div>
    `;
  }

  // Créer le panel de typographie
  function createTypographyPanel(element, type) {
    const computedStyle = window.getComputedStyle(element);
    const fontSize = parseFloat(computedStyle.fontSize) || 16;
    const fontWeight = computedStyle.fontWeight || '400';
    
    let lineHeightValue = 1.5;
    const lineHeightStr = computedStyle.lineHeight;
    if (lineHeightStr && lineHeightStr !== 'normal') {
      if (lineHeightStr.includes('px')) {
        const lineHeightPx = parseFloat(lineHeightStr);
        lineHeightValue = lineHeightPx / fontSize;
      } else {
        lineHeightValue = parseFloat(lineHeightStr);
      }
    }
    
    const color = computedStyle.color || '#000000';
    
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">✍️</span>
          <h3>Typography</h3>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Font Size</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelFontSize" class="figma-number-input" value="${Math.round(fontSize)}" min="8" max="72" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Font Weight</label>
            <select id="panelFontWeight" class="figma-select">
              <option value="300" ${fontWeight === '300' ? 'selected' : ''}>Light (300)</option>
              <option value="400" ${fontWeight === '400' ? 'selected' : ''}>Regular (400)</option>
              <option value="500" ${fontWeight === '500' ? 'selected' : ''}>Medium (500)</option>
              <option value="600" ${fontWeight === '600' ? 'selected' : ''}>Semi Bold (600)</option>
              <option value="700" ${fontWeight === '700' ? 'selected' : ''}>Bold (700)</option>
              <option value="900" ${fontWeight === '900' ? 'selected' : ''}>Black (900)</option>
            </select>
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Line Height</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelLineHeight" class="figma-number-input" value="${lineHeightValue.toFixed(1)}" min="0.5" max="3" step="0.1">
              <span class="figma-unit">×</span>
            </div>
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Color</label>
            <div class="figma-color-wrapper">
              <input type="color" id="panelTextColor" class="figma-color-input" value="${rgbToHex(color)}">
              <input type="text" id="panelTextColorText" class="figma-text-input" value="${rgbToHex(color)}">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Créer le panel d'espacement
  function createSpacingPanel(element) {
    const computedStyle = window.getComputedStyle(element);
    const marginTop = parseFloat(computedStyle.marginTop) || 0;
    const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
    const padding = parseFloat(computedStyle.padding) || 0;
    
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📏</span>
          <h3>Spacing</h3>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group">
            <label class="figma-label">M Top</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelMarginTop" class="figma-number-input" value="${Math.round(marginTop)}" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
          <div class="figma-control-group">
            <label class="figma-label">M Bottom</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelMarginBottom" class="figma-number-input" value="${Math.round(marginBottom)}" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Padding</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelPadding" class="figma-number-input" value="${Math.round(padding)}" min="0" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Créer le panel d'actions pour les list items
  function createListItemActionsPanel(listItem) {
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">⚙️</span>
          <h3>Actions</h3>
        </div>
        <div class="figma-control-row">
          <button class="figma-action-btn figma-action-btn-danger" data-action="delete-item">
            🗑️ Supprimer
          </button>
        </div>
      </div>
    `;
  }

  // Créer le panel d'actions pour les recettes
  function createRecipeActionsPanel(recipe) {
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">⚙️</span>
          <h3>Actions</h3>
        </div>
        <div class="figma-control-row">
          <button class="figma-action-btn figma-action-btn-danger" data-action="delete-recipe">
            🗑️ Supprimer
          </button>
        </div>
      </div>
    `;
  }

  // Exposer les fonctions globalement
  window.FigmaPanelCreators = {
    createTitlePanel,
    createSloganPanel,
    createSectionPanel,
    createSectionActionsPanel,
    createListItemPanel,
    createListItemActionsPanel,
    createRecipePanel,
    createRecipeActionsPanel,
    createMainPanel,
    createImagePanel,
    createDefaultPanel,
    createTypographyPanel,
    createSpacingPanel
  };

  // Exposer les fonctions globalement pour compatibilité
  window.createTitlePanel = createTitlePanel;
  window.createSloganPanel = createSloganPanel;
  window.createSectionPanel = createSectionPanel;
  window.createListItemPanel = createListItemPanel;
  window.createRecipePanel = createRecipePanel;
  window.createMainPanel = createMainPanel;
  window.createImagePanel = createImagePanel;
  window.createDefaultPanel = createDefaultPanel;
  window.createTypographyPanel = createTypographyPanel;
  window.createSpacingPanel = createSpacingPanel;
})();


