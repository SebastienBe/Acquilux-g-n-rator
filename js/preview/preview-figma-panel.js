// ========================================
// SYSTÈME DE PANEL FIGMA - Modals pour chaque bloc
// ========================================

(function() {
  let currentPanel = null;
  let currentElement = null;
  let panelContainer = null;
  
  // Système d'historique pour undo/redo
  let historyStack = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50;

  // Initialisation
  function init() {
    createPanelContainer();
    setupPanelSystem();
    setupUndoRedo();
  }

  // Créer le conteneur de panel
  function createPanelContainer() {
    panelContainer = document.createElement('div');
    panelContainer.id = 'figmaPanelContainer';
    panelContainer.className = 'figma-panel-container';
    document.body.appendChild(panelContainer);
  }

  // Configurer le système de panel
  function setupPanelSystem() {
    // Détecter les clics sur les éléments éditables
    document.addEventListener('click', (e) => {
      const editableElement = e.target.closest('[data-editable]');
      if (editableElement) {
        e.preventDefault();
        e.stopPropagation();
        openPanelForElement(editableElement);
      }
    }, true);
    
    // Bouton pour ouvrir le panel principal (document)
    const openMainPanelBtn = document.getElementById('openMainPanelBtn');
    if (openMainPanelBtn) {
      openMainPanelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.openMainPanel();
      });
    }
  }
  
  // Configurer le système undo/redo
  function setupUndoRedo() {
    // Raccourcis clavier pour undo/redo
    document.addEventListener('keydown', (e) => {
      // Ctrl+Z ou Cmd+Z pour undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y ou Ctrl+Shift+Z pour redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    });
  }
  
  // Fonction undo
  function undo() {
    if (historyIndex > 0) {
      historyIndex--;
      const state = historyStack[historyIndex];
      if (state && state.element) {
        applyHistoryState(state);
      }
    }
  }
  
  // Fonction redo
  function redo() {
    if (historyIndex < historyStack.length - 1) {
      historyIndex++;
      const state = historyStack[historyIndex];
      if (state && state.element) {
        applyHistoryState(state);
      }
    }
  }
  
  // Appliquer un état de l'historique
  function applyHistoryState(state) {
    if (!state || !state.element) return;
    
    // Restaurer les styles
    if (state.styles) {
      Object.keys(state.styles).forEach(prop => {
        state.element.style.setProperty(prop, state.styles[prop], 'important');
      });
    }
    
    // Restaurer le contenu si présent
    if (state.content !== undefined) {
      state.element.textContent = state.content;
    }
  }
  
  // Sauvegarder l'état actuel dans l'historique
  function saveToHistory(element, type, property, oldValue, newValue) {
    if (!element) return;
    
    // Créer un snapshot de l'état actuel
    const state = {
      element: element,
      styles: {},
      content: element.textContent || undefined,
      type: type || 'general',
      property: property,
      oldValue: oldValue,
      newValue: newValue
    };
    
    // Sauvegarder les styles inline importants
    const computedStyle = window.getComputedStyle(element);
    const importantProps = ['color', 'background-color', 'font-size', 'font-weight', 'line-height', 'padding', 'margin', 'width', 'height'];
    importantProps.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'initial' && value !== 'normal') {
        state.styles[prop] = value;
      }
    });
    
    // Supprimer les états futurs si on n'est pas à la fin
    if (historyIndex < historyStack.length - 1) {
      historyStack = historyStack.slice(0, historyIndex + 1);
    }
    
    // Ajouter le nouvel état
    historyStack.push(state);
    historyIndex = historyStack.length - 1;
    
    // Limiter la taille de l'historique
    if (historyStack.length > MAX_HISTORY) {
      historyStack.shift();
      historyIndex--;
    }
  }
  
  // Exposer saveToHistory globalement pour compatibilité
  window.saveToHistory = saveToHistory;
  
  // Exposer la fonction pour ouvrir le panel principal
  window.openMainPanel = function() {
    const pdfPreview = document.getElementById('pdfPreview');
    if (pdfPreview) {
      // Créer un élément virtuel avec le type 'main'
      const virtualElement = {
        getAttribute: (attr) => attr === 'data-editable-type' ? 'main' : null,
        closest: () => pdfPreview
      };
      openPanelForElement(virtualElement);
    }
  };

  // Ouvrir un panel pour un élément
  function openPanelForElement(element) {
    if (!element) return;

    // Support pour les éléments virtuels (comme pour openMainPanelBtn)
    let editableType = null;
    if (typeof element.getAttribute === 'function') {
      editableType = element.getAttribute('data-editable-type');
    } else if (element.getAttribute) {
      // Support pour les objets avec méthode getAttribute
      editableType = element.getAttribute('data-editable-type');
    }
    
    // Si pas de type, essayer de déterminer depuis l'élément réel
    if (!editableType) {
      const realElement = typeof element.closest === 'function' ? element.closest('[data-editable]') : element;
      if (realElement && realElement.getAttribute) {
        editableType = realElement.getAttribute('data-editable-type');
      }
    }
    
    // Si toujours pas de type, essayer de déterminer depuis l'ID ou le tagName
    if (!editableType && element) {
      if (element.id === 'mainTitle') {
        editableType = 'title';
      } else if (element.id === 'mainSlogan') {
        editableType = 'slogan';
      } else if (element.tagName === 'H2' && element.hasAttribute('data-section')) {
        editableType = 'section';
      } else if (element.tagName === 'LI') {
        editableType = 'list-item';
      } else if (element.classList && element.classList.contains('recipe')) {
        editableType = 'recipe';
      } else if (element.tagName === 'IMG' || (element.classList && element.classList.contains('product-image'))) {
        editableType = 'image';
      }
    }
    
    // Pour le type 'main', on peut directement utiliser 'main'
    if (!editableType && element && (element.id === 'pdfPreview' || (typeof element.closest === 'function' && element.closest('#pdfPreview')))) {
      editableType = 'main';
    }
    
    if (!editableType) return;

    // Pour les éléments virtuels, utiliser l'élément réel (pdfPreview)
    if (typeof element.closest === 'function' && element.closest('#pdfPreview')) {
      currentElement = element.closest('#pdfPreview');
    } else if (element && element.id === 'pdfPreview') {
    currentElement = element;
    } else {
      currentElement = element;
    }
    
    // Fermer le panel précédent complètement avant d'en créer un nouveau
    if (currentPanel) {
    closePanel();
      // Attendre que le panel soit complètement fermé
      setTimeout(() => {
        createAndShowPanel(element, editableType);
      }, 250);
    } else {
      createAndShowPanel(element, editableType);
    }
  }
  
  function createAndShowPanel(element, editableType) {
    // Créer le panel approprié selon le type
    let panelContent = '';
    
    switch (editableType) {
      case 'title':
        panelContent = createTitlePanel(element);
        break;
      case 'slogan':
        panelContent = createSloganPanel(element);
        break;
      case 'section':
        panelContent = createSectionPanel(element);
        break;
      case 'list-item':
        panelContent = createListItemPanel(element);
        break;
      case 'recipe':
        panelContent = createRecipePanel(element);
        break;
      case 'main':
        panelContent = createMainPanel(element);
        break;
      case 'image':
        panelContent = createImagePanel(element);
        break;
      default:
        panelContent = createDefaultPanel(element);
    }

    // Créer et afficher le panel
    createPanel(panelContent, editableType, element);
  }

  // Créer un panel générique
  function createPanel(content, type, element) {
    const panel = document.createElement('div');
    panel.className = 'figma-panel';
    panel.dataset.panelType = type;
    
    panel.innerHTML = `
      <div class="figma-panel-header">
        <div class="figma-panel-title">
          <span class="figma-panel-icon">${getIconForType(type)}</span>
          <span class="figma-panel-name">${getTitleForType(type)}</span>
        </div>
        <button class="figma-panel-close" aria-label="Fermer">
          <span>✕</span>
        </button>
      </div>
      <div class="figma-panel-body">
        ${content}
      </div>
    `;

    // Événements - utiliser capture pour s'assurer que l'événement est bien capturé
    const closeBtn = panel.querySelector('.figma-panel-close');
    if (closeBtn) {
      // Utiliser capture phase et stopImmediatePropagation pour éviter les conflits
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('🔴 Bouton fermeture cliqué');
        closePanel();
      }, true); // Capture phase
      
      // Ajouter aussi un listener normal au cas où
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closePanel();
      }, false);
    }

    // Fermer avec Échap
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && panel.classList.contains('active')) {
        closePanel();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    panelContainer.appendChild(panel);
    currentPanel = panel;
    currentElement = element;
    // Exposer globalement pour les modules externes
    window.currentPanel = panel;
    window.currentElement = element;
    
    // Attacher les événements après un court délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
      attachPanelEvents(panel, element, type);
      // Attacher les événements de spacing si disponible (sauf pour les badges qui ont leur propre système)
      if (window.attachSpacingEvents && type !== 'badge') {
        window.attachSpacingEvents(panel, element);
      }
      // Attacher les événements de typographie si disponible
      if (window.attachTypographyEvents) {
        window.attachTypographyEvents(panel, element);
      }
      // Attacher les événements de couleurs si disponible
      if (window.attachColorEvents) {
        // Chercher les panels de couleur dans le panel
        const colorPanels = panel.querySelectorAll('.figma-section');
        colorPanels.forEach(section => {
          if (section.querySelector('#panelColorPicker')) {
            window.attachColorEvents(panel, element, 'color');
          }
          if (section.querySelector('#panelMainBgColor')) {
            window.attachColorEvents(panel, element, 'backgroundColor');
          }
        });
      }
      // Attacher les événements de bordures si disponible
      if (window.attachBordersEvents) {
        window.attachBordersEvents(panel, element);
      }
      // Attacher les événements d'ombres si disponible
      if (window.attachShadowsEvents) {
        window.attachShadowsEvents(panel, element);
      }
      // Attacher les événements de badges si disponible
      if (window.attachBadgeEvents && type === 'badge') {
        window.attachBadgeEvents(panel, element);
      }
      // Attacher les événements de styles si disponible
      if (window.attachStylesEvents && type === 'main') {
        window.attachStylesEvents(panel);
      }
      // Attacher les événements de grille si disponible
      if (window.attachGridEvents && type === 'main') {
        window.attachGridEvents(panel);
      }
      // Attacher les événements d'export si disponible
      if (window.attachExportEvents && type === 'main') {
        window.attachExportEvents(panel);
      }
      // Attacher les événements responsive si disponible
      if (window.attachResponsiveEvents && type === 'main') {
        window.attachResponsiveEvents(panel);
      }
      // Attacher les événements de sélection de badges si disponible
      if (window.attachBadgeSelectionEvents && type === 'main') {
        window.attachBadgeSelectionEvents(panel);
      }
      // Attacher les événements de configuration de badges si disponible
      if (window.attachBadgeConfigEvents && type === 'main') {
        window.attachBadgeConfigEvents(panel);
      }
      // Attacher les événements d'image si disponible
      if (type === 'image') {
        attachImagePanelEvents(panel, element);
      }
    }, 50);
    
    // Animation d'ouverture
    setTimeout(() => {
      panel.classList.add('active');
    }, 10);

    // Positionner le panel
    positionPanel(panel);
  }

  // Positionner le panel à droite
  function positionPanel(panel) {
    // Le panel est déjà positionné via CSS (fixed right)
    // On peut ajuster la position verticale si nécessaire
  }

  // Fermer le panel
  function closePanel() {
    if (currentPanel) {
      currentPanel.remove();
      currentPanel = null;
      currentElement = null;
      // Nettoyer les références globales
      window.currentPanel = null;
      window.currentElement = null;
    }
  }

  // Créer le panel pour le titre (h1)
  function createTitlePanel(element) {
    const text = element.textContent || '';
    
    // Récupérer les valeurs actuelles du header depuis le DOM
    const pdfPreview = element.closest('#pdfPreview');
    const headerBand = pdfPreview?.querySelector('.header-orange-band');
    const headerContent = pdfPreview?.querySelector('.header-content');
    
    let currentHeaderColor = '#E65B0C'; // Valeur par défaut
    let currentHeaderHeight = 90; // Valeur par défaut en px
    let currentHeaderPaddingTop = 10; // Valeur par défaut en px
    let currentHeaderPaddingRight = 20; // Valeur par défaut en px
    let currentHeaderPaddingBottom = 10; // Valeur par défaut en px
    let currentHeaderPaddingLeft = 20; // Valeur par défaut en px
    
    if (headerBand) {
      // Lire depuis la div .header-orange-band (style inline > computed style > défaut)
      const computedStyle = window.getComputedStyle(headerBand);
      currentHeaderColor = headerBand.style.backgroundColor || 
                          computedStyle.backgroundColor || 
                          '#E65B0C';
      
      // Lire la hauteur
      if (headerBand.style.height) {
        currentHeaderHeight = parseFloat(headerBand.style.height);
      } else if (computedStyle.height && computedStyle.height !== 'auto') {
        currentHeaderHeight = parseFloat(computedStyle.height);
      }
      
      console.log('Header - couleur:', currentHeaderColor, 'height:', currentHeaderHeight);
    }
    
    if (headerContent) {
      // Lire les paddings du header-content
      const computedStyle = window.getComputedStyle(headerContent);
      
      // Padding top
      if (headerContent.style.paddingTop) {
        currentHeaderPaddingTop = parseFloat(headerContent.style.paddingTop);
      } else if (computedStyle.paddingTop) {
        currentHeaderPaddingTop = parseFloat(computedStyle.paddingTop);
      }
      
      // Padding right
      if (headerContent.style.paddingRight) {
        currentHeaderPaddingRight = parseFloat(headerContent.style.paddingRight);
      } else if (computedStyle.paddingRight) {
        currentHeaderPaddingRight = parseFloat(computedStyle.paddingRight);
      }
      
      // Padding bottom
      if (headerContent.style.paddingBottom) {
        currentHeaderPaddingBottom = parseFloat(headerContent.style.paddingBottom);
      } else if (computedStyle.paddingBottom) {
        currentHeaderPaddingBottom = parseFloat(computedStyle.paddingBottom);
      }
      
      // Padding left
      if (headerContent.style.paddingLeft) {
        currentHeaderPaddingLeft = parseFloat(headerContent.style.paddingLeft);
      } else if (computedStyle.paddingLeft) {
        currentHeaderPaddingLeft = parseFloat(computedStyle.paddingLeft);
      }
      
      console.log('Header - padding:', {
        top: currentHeaderPaddingTop,
        right: currentHeaderPaddingRight,
        bottom: currentHeaderPaddingBottom,
        left: currentHeaderPaddingLeft
      });
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
        
        <!-- Couleur de fond -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Background Color</label>
            <div class="figma-color-wrapper">
              <input type="color" id="panelHeaderBgColor" class="figma-color-input" value="${headerColorHex}">
              <input type="text" id="panelHeaderBgColorText" class="figma-text-input" value="${headerColorHex}">
            </div>
          </div>
        </div>
        
        <!-- Hauteur -->
        <div class="figma-control-row">
          <div class="figma-control-group">
            <label class="figma-label">Height</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelHeaderHeight" class="figma-number-input" value="${currentHeaderHeight}" step="0.1" min="0">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>
        
        <!-- Padding -->
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
    const isFirstSection = sectionIndex === '0';
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
      // Caractéristique
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
      // Consommation
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
    // Extraire le nom et le type depuis le strong
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
    // Toujours utiliser #pdfPreview comme source de vérité
    const pdfPreview = document.getElementById('pdfPreview');
    
    // Récupérer les valeurs actuelles depuis la div #pdfPreview
    let currentWidth = 595;
    let currentPadding = 20;
    let currentBgColor = '#F6E2BE';
    
    if (pdfPreview) {
      const computedStyle = window.getComputedStyle(pdfPreview);
      
      // Largeur : style inline > computed style > défaut
      if (pdfPreview.style.width) {
        currentWidth = parseFloat(pdfPreview.style.width);
      } else if (computedStyle.width && computedStyle.width !== 'auto') {
        currentWidth = parseFloat(computedStyle.width);
      }
      
      // Padding : style inline > computed style > défaut
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
      
      // Background color : lire depuis la div #pdfPreview (style inline > computed style > défaut)
      currentBgColor = pdfPreview.style.backgroundColor || 
                      computedStyle.backgroundColor || 
                      '#F6E2BE';
      console.log('Couleur de fond lue depuis #pdfPreview:', currentBgColor);
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

    // Récupérer les valeurs actuelles
    const computedStyle = window.getComputedStyle(element);
    const widthMatch = element.style.width ? element.style.width.match(/(\d+)%/) : null;
    const heightMatch = element.style.height ? element.style.height.match(/(\d+)%/) : null;
    const transformMatch = element.style.transform ? element.style.transform.match(/rotate\((-?\d+)deg\)/) : null;
    const brightnessMatch = element.style.filter ? element.style.filter.match(/brightness\((\d+)%\)/) : null;
    const contrastMatch = element.style.filter ? element.style.filter.match(/contrast\((\d+)%\)/) : null;
    const saturationMatch = element.style.filter ? element.style.filter.match(/saturate\((\d+)%\)/) : null;
    const objectFit = computedStyle.objectFit || 'cover';
    const objectPosition = computedStyle.objectPosition || 'center';
    // Ancienne logique : on lisait le crop via clip-path sur l'image elle-même.
    // Nouvelle logique : le "crop" agit sur le bloc (container) qui contient l'image.
    // On continue à utiliser les valeurs sauvegardées dans le dataset pour le PDF,
    // mais l'affichage en preview ne repose plus sur clip-path.
    const clipPath = element.style.clipPath || computedStyle.clipPath || '';
    const container = element.parentElement;
    const containerTransform = container ? container.style.transform || window.getComputedStyle(container).transform : '';

    // Extraire position X/Y depuis object-position (pour offset fin)
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

    // Extraire un éventuel clip-path: inset(T% R% B% L%)
    function parseClipPathInset(cp) {
      const defaults = { top: 0, right: 0, bottom: 0, left: 0 };
      if (!cp || !cp.startsWith('inset(')) return defaults;
      const inside = cp.slice(6, -1).trim(); // remove inset( and )
      const parts = inside.split(/\s+/);
      if (parts.length < 4) return defaults;
      const [t, r, b, l] = parts;
      const toNum = (v) => {
        if (!v) return 0;
        if (v.endsWith('%')) return parseFloat(v);
        if (v.endsWith('px')) return parseFloat(v); // laisser tel quel en pourcentage approximatif
        return parseFloat(v) || 0;
      };
      return {
        top: toNum(t),
        right: toNum(r),
        bottom: toNum(b),
        left: toNum(l)
      };
    }

    // 🔁 Récupérer le crop depuis le dataset (source de vérité pour la génération PDF)
    // et utiliser clip-path uniquement comme valeur de secours si rien n'est défini.
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

    // Lire un éventuel translateY sur le conteneur (déplacement bloc)
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

    // Générer un ID unique pour cette instance (sera ajouté au panel lors de la création)
    const panelId = `image-panel-${Date.now()}`;
    
    // Stocker le panelId dans l'élément pour y accéder plus tard
    element.dataset.imagePanelId = panelId;

    return `
      <!-- Fill / Fit / Crop -->
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

      <!-- Crop par côté -->
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

      <!-- Transform -->
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

      <!-- Effects -->
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

      <!-- Actions -->
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

  // Attacher les événements du panel d'image
  function attachImagePanelEvents(panel, element) {
    if (!element || element.tagName !== 'IMG') return;

    // Récupérer le panelId depuis l'élément ou depuis le panel
    const panelId = element.dataset.imagePanelId || panel.querySelector('[data-panel-id]')?.dataset.panelId || `image-panel-${Date.now()}`;

    // Variables pour suivre l'état
    let maintainRatio = true;
    let currentRotation = 0;
    let currentScaleX = 1;
    let currentScaleY = 1;
    let currentZoom = 100;
    let cropTop = 0;
    let cropRight = 0;
    let cropBottom = 0;
    let cropLeft = 0;
    let blockOffsetY = 0;

    // Récupérer les valeurs initiales
    const transformMatch = element.style.transform ? element.style.transform.match(/rotate\((-?\d+)deg\)/) : null;
    if (transformMatch) {
      currentRotation = parseInt(transformMatch[1]);
    }
    const scaleXMatch = element.style.transform ? element.style.transform.match(/scaleX\((-?\d+(?:\.\d+)?)\)/) : null;
    if (scaleXMatch) {
      currentScaleX = parseFloat(scaleXMatch[1]);
    }
    const scaleYMatch = element.style.transform ? element.style.transform.match(/scaleY\((-?\d+(?:\.\d+)?)\)/) : null;
    if (scaleYMatch) {
      currentScaleY = parseFloat(scaleYMatch[1]);
    }

    // Fonction pour appliquer les transformations
    function applyImageTransform() {
      const widthInput = panel.querySelector(`[data-image-width][data-panel-id="${panelId}"]`);
      const heightInput = panel.querySelector(`[data-image-height][data-panel-id="${panelId}"]`);
      const rotationInput = panel.querySelector(`[data-image-rotation][data-panel-id="${panelId}"]`);
      const brightnessInput = panel.querySelector(`[data-image-brightness][data-panel-id="${panelId}"]`);
      const contrastInput = panel.querySelector(`[data-image-contrast][data-panel-id="${panelId}"]`);
      const saturationInput = panel.querySelector(`[data-image-saturation][data-panel-id="${panelId}"]`);
      const zoomInput = panel.querySelector(`[data-image-zoom][data-panel-id="${panelId}"]`);
      const posXInput = panel.querySelector(`[data-image-pos-x][data-panel-id="${panelId}"]`);
      const posYInput = panel.querySelector(`[data-image-pos-y][data-panel-id="${panelId}"]`);
      const cropTopInput = panel.querySelector(`[data-image-crop-top][data-panel-id="${panelId}"]`);
      const blockOffsetInput = panel.querySelector(`[data-image-block-offset-y][data-panel-id="${panelId}"]`);
      const cropRightInput = panel.querySelector(`[data-image-crop-right][data-panel-id="${panelId}"]`);
      const cropBottomInput = panel.querySelector(`[data-image-crop-bottom][data-panel-id="${panelId}"]`);
      const cropLeftInput = panel.querySelector(`[data-image-crop-left][data-panel-id="${panelId}"]`);

      const width = widthInput ? parseInt(widthInput.value) || 100 : 100;
      const height = heightInput ? parseInt(heightInput.value) || 100 : 100;
      const rotation = rotationInput ? parseInt(rotationInput.value) || 0 : 0;
      const brightness = brightnessInput ? parseInt(brightnessInput.value) || 100 : 100;
      const contrast = contrastInput ? parseInt(contrastInput.value) || 100 : 100;
      const saturation = saturationInput ? parseInt(saturationInput.value) || 100 : 100;
      const zoom = zoomInput ? parseInt(zoomInput.value) || 100 : 100;
      const posX = posXInput ? parseInt(posXInput.value) || 50 : 50;
      const posY = posYInput ? parseInt(posYInput.value) || 50 : 50;
      currentZoom = zoom;

      cropTop = cropTopInput ? parseInt(cropTopInput.value) || 0 : 0;
      cropRight = cropRightInput ? parseInt(cropRightInput.value) || 0 : 0;
      cropBottom = cropBottomInput ? parseInt(cropBottomInput.value) || 0 : 0;
      cropLeft = cropLeftInput ? parseInt(cropLeftInput.value) || 0 : 0;
      blockOffsetY = blockOffsetInput ? parseInt(blockOffsetInput.value) || 0 : 0;

      // Sauvegarder les paramètres principaux sur l'élément (dataset)
      // pour que le générateur PDF puisse reconstruire un crop approximatif.
      try {
        element.dataset.cropTop = String(cropTop);
        element.dataset.cropRight = String(cropRight);
        element.dataset.cropBottom = String(cropBottom);
        element.dataset.cropLeft = String(cropLeft);
        element.dataset.zoom = String(zoom);
        element.dataset.widthPercent = String(width);
        element.dataset.heightPercent = String(height);
      } catch (e) {
        console.warn('⚠️ Impossible de sauvegarder les données de crop sur l\'image:', e);
      }

      element.style.width = `${width}%`;
      // On garde une hauteur en % pour que object-fit / object-position fonctionnent en Y
      element.style.height = `${height}%`;
      const zoomFactor = zoom / 100;
      element.style.transform = `rotate(${rotation}deg) scaleX(${currentScaleX * zoomFactor}) scaleY(${currentScaleY * zoomFactor})`;
      element.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      element.style.objectPosition = `${posX}% ${posY}%`;
      // ❌ Plus de clip-path : le recadrage visuel se fait uniquement par la taille du bloc
      //    (height du conteneur) + position/zoom, pour éviter les problèmes à la génération.
      element.style.clipPath = 'none';
      if (element.parentElement) {
        const container = element.parentElement;
        // On déplace le bloc dans le flux avec margin-top (et pas transform)
        // pour que le contenu texte en dessous suive toujours et garde la marge.
        container.style.marginTop = `${blockOffsetY}px`;
        // Nettoyer tout ancien transform éventuel appliqué sur le conteneur
        container.style.transform = '';
        // Ajuster la hauteur du conteneur au crop/zoom pour éviter l'espace vide
        const containerWidth = container.clientWidth || element.clientWidth || 1;
        const ratio = element.naturalHeight && element.naturalWidth
          ? element.naturalHeight / element.naturalWidth
          : 1;
        let visibleHeight = containerWidth * ratio;
        // Prendre en compte le scaling hauteur (%), zoom et crop vertical
        visibleHeight *= (height / 100);
        visibleHeight *= (zoom / 100);
        const visibleFactor = Math.max(0, 1 - ((cropTop + cropBottom) / 100));
        visibleHeight *= visibleFactor;
        // Garder une hauteur minimale pour garder l'interaction
        visibleHeight = Math.max(120, visibleHeight);
        container.style.height = `${visibleHeight}px`;
      }
    }

    // Fill / Fit / Crop buttons
    panel.querySelectorAll(`[data-image-fit][data-panel-id="${panelId}"]`).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const fit = e.currentTarget.dataset.imageFit;
        element.style.objectFit = fit;
        // Mettre à jour l'état actif
        panel.querySelectorAll(`[data-image-fit][data-panel-id="${panelId}"]`).forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });

    // Position select
    const positionSelect = panel.querySelector(`[data-image-position][data-panel-id="${panelId}"]`);
    if (positionSelect) {
      positionSelect.addEventListener('change', (e) => {
        element.style.objectPosition = e.target.value;
        const { x, y } = (function(pos) {
          const map = {
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
          if (map[pos]) return map[pos];
          return { x: 50, y: 50 };
        })(e.target.value);
        const posXInput = panel.querySelector(`[data-image-pos-x][data-panel-id="${panelId}"]`);
        const posYInput = panel.querySelector(`[data-image-pos-y][data-panel-id="${panelId}"]`);
        const posXValue = panel.querySelector(`[data-image-pos-x-value]`);
        const posYValue = panel.querySelector(`[data-image-pos-y-value]`);
        if (posXInput) posXInput.value = x;
        if (posYInput) posYInput.value = y;
        if (posXValue) posXValue.textContent = `${x}%`;
        if (posYValue) posYValue.textContent = `${y}%`;
      });
    }

    // Width / Height inputs
    const widthInput = panel.querySelector(`[data-image-width][data-panel-id="${panelId}"]`);
    const heightInput = panel.querySelector(`[data-image-height][data-panel-id="${panelId}"]`);
    const maintainRatioBtn = panel.querySelector(`[data-image-maintain-ratio][data-panel-id="${panelId}"]`);

    if (widthInput) {
      widthInput.addEventListener('input', () => {
        if (maintainRatio && heightInput && element.naturalWidth && element.naturalHeight) {
          const aspectRatio = element.naturalHeight / element.naturalWidth;
          const newWidth = parseInt(widthInput.value) || 100;
          const containerWidth = element.parentElement.offsetWidth || 1;
          const newHeightPx = (containerWidth * newWidth / 100) * aspectRatio;
          const containerHeight = element.parentElement.offsetHeight || 1;
          const newHeightPercent = (newHeightPx / containerHeight) * 100;
          heightInput.value = Math.round(newHeightPercent);
        }
        applyImageTransform();
      });
    }

    if (heightInput) {
      heightInput.addEventListener('input', () => {
        if (maintainRatio && widthInput && element.naturalWidth && element.naturalHeight) {
          const aspectRatio = element.naturalWidth / element.naturalHeight;
          const newHeight = parseInt(heightInput.value) || 100;
          const containerHeight = element.parentElement.offsetHeight || 1;
          const newHeightPx = containerHeight * newHeight / 100;
          const containerWidth = element.parentElement.offsetWidth || 1;
          const newWidthPercent = ((newHeightPx * aspectRatio) / containerWidth) * 100;
          widthInput.value = Math.round(newWidthPercent);
        }
        applyImageTransform();
      });
    }

    if (maintainRatioBtn) {
      maintainRatioBtn.addEventListener('click', () => {
        maintainRatio = !maintainRatio;
        maintainRatioBtn.classList.toggle('active', maintainRatio);
      });
      maintainRatioBtn.classList.add('active');
    }

    // Rotation
    const rotationInput = panel.querySelector(`[data-image-rotation][data-panel-id="${panelId}"]`);
    if (rotationInput) {
      rotationInput.addEventListener('input', () => {
        currentRotation = parseInt(rotationInput.value) || 0;
        applyImageTransform();
      });
    }

    // Rotate buttons
    const rotateLeftBtn = panel.querySelector(`[data-image-rotate-left][data-panel-id="${panelId}"]`);
    const rotateRightBtn = panel.querySelector(`[data-image-rotate-right][data-panel-id="${panelId}"]`);
    
    if (rotateLeftBtn) {
      rotateLeftBtn.addEventListener('click', () => {
        currentRotation -= 90;
        if (currentRotation < -180) currentRotation += 360;
        if (rotationInput) rotationInput.value = currentRotation;
        applyImageTransform();
      });
    }

    if (rotateRightBtn) {
      rotateRightBtn.addEventListener('click', () => {
        currentRotation += 90;
        if (currentRotation > 180) currentRotation -= 360;
        if (rotationInput) rotationInput.value = currentRotation;
        applyImageTransform();
      });
    }

    // Flip buttons
    const flipHBtn = panel.querySelector(`[data-image-flip-h][data-panel-id="${panelId}"]`);
    const flipVBtn = panel.querySelector(`[data-image-flip-v][data-panel-id="${panelId}"]`);

    if (flipHBtn) {
      flipHBtn.addEventListener('click', () => {
        currentScaleX *= -1;
        applyImageTransform();
      });
    }

    if (flipVBtn) {
      flipVBtn.addEventListener('click', () => {
        currentScaleY *= -1;
        applyImageTransform();
      });
    }

    // Effects sliders
    const brightnessInput = panel.querySelector(`[data-image-brightness][data-panel-id="${panelId}"]`);
    const contrastInput = panel.querySelector(`[data-image-contrast][data-panel-id="${panelId}"]`);
    const saturationInput = panel.querySelector(`[data-image-saturation][data-panel-id="${panelId}"]`);

    if (brightnessInput) {
      const brightnessValue = panel.querySelector(`[data-image-brightness-value]`);
      brightnessInput.addEventListener('input', () => {
        const value = parseInt(brightnessInput.value) || 100;
        if (brightnessValue) brightnessValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    if (contrastInput) {
      const contrastValue = panel.querySelector(`[data-image-contrast-value]`);
      contrastInput.addEventListener('input', () => {
        const value = parseInt(contrastInput.value) || 100;
        if (contrastValue) contrastValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    if (saturationInput) {
      const saturationValue = panel.querySelector(`[data-image-saturation-value]`);
      saturationInput.addEventListener('input', () => {
        const value = parseInt(saturationInput.value) || 100;
        if (saturationValue) saturationValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    // Zoom (crop)
    const zoomInput = panel.querySelector(`[data-image-zoom][data-panel-id="${panelId}"]`);
    if (zoomInput) {
      const zoomValue = panel.querySelector(`[data-image-zoom-value]`);
      zoomInput.addEventListener('input', () => {
        const value = parseInt(zoomInput.value) || 100;
        currentZoom = value;
        if (zoomValue) zoomValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    // Position fine X/Y
    const posXInput = panel.querySelector(`[data-image-pos-x][data-panel-id="${panelId}"]`);
    const posYInput = panel.querySelector(`[data-image-pos-y][data-panel-id="${panelId}"]`);
    const posXValue = panel.querySelector(`[data-image-pos-x-value]`);
    const posYValue = panel.querySelector(`[data-image-pos-y-value]`);

    if (posXInput) {
      posXInput.addEventListener('input', () => {
        const value = parseInt(posXInput.value) || 50;
        if (posXValue) posXValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    if (posYInput) {
      posYInput.addEventListener('input', () => {
        const value = parseInt(posYInput.value) || 50;
        if (posYValue) posYValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    // Crop sliders
    const cropTopInput = panel.querySelector(`[data-image-crop-top][data-panel-id="${panelId}"]`);
    const cropRightInput = panel.querySelector(`[data-image-crop-right][data-panel-id="${panelId}"]`);
    const cropBottomInput = panel.querySelector(`[data-image-crop-bottom][data-panel-id="${panelId}"]`);
    const cropLeftInput = panel.querySelector(`[data-image-crop-left][data-panel-id="${panelId}"]`);
    const cropTopValue = panel.querySelector(`[data-image-crop-top-value]`);
    const cropRightValue = panel.querySelector(`[data-image-crop-right-value]`);
    const cropBottomValue = panel.querySelector(`[data-image-crop-bottom-value]`);
    const cropLeftValue = panel.querySelector(`[data-image-crop-left-value]`);

    if (cropTopInput) {
      cropTopInput.addEventListener('input', () => {
        const value = parseInt(cropTopInput.value) || 0;
        if (cropTopValue) cropTopValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    if (cropBottomInput) {
      cropBottomInput.addEventListener('input', () => {
        const value = parseInt(cropBottomInput.value) || 0;
        if (cropBottomValue) cropBottomValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    if (cropLeftInput) {
      cropLeftInput.addEventListener('input', () => {
        const value = parseInt(cropLeftInput.value) || 0;
        if (cropLeftValue) cropLeftValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    // Déplacement du bloc (translateY sur le conteneur)
    const blockOffsetInput = panel.querySelector(`[data-image-block-offset-y][data-panel-id="${panelId}"]`);
    const blockOffsetValue = panel.querySelector(`[data-image-block-offset-y-value]`);
    if (blockOffsetInput) {
      blockOffsetInput.addEventListener('input', () => {
        const value = parseInt(blockOffsetInput.value) || 0;
        blockOffsetY = value;
        if (blockOffsetValue) blockOffsetValue.textContent = `${value}px`;
        applyImageTransform();
      });
    }

    if (cropRightInput) {
      cropRightInput.addEventListener('input', () => {
        const value = parseInt(cropRightInput.value) || 0;
        if (cropRightValue) cropRightValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    // Reset button
    const resetBtn = panel.querySelector(`[data-image-reset][data-panel-id="${panelId}"]`);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (widthInput) widthInput.value = 100;
        if (heightInput) heightInput.value = 100;
        if (rotationInput) {
          rotationInput.value = 0;
          currentRotation = 0;
        }
        if (brightnessInput) {
          brightnessInput.value = 100;
          const brightnessValue = panel.querySelector(`[data-image-brightness-value]`);
          if (brightnessValue) brightnessValue.textContent = '100%';
        }
        if (contrastInput) {
          contrastInput.value = 100;
          const contrastValue = panel.querySelector(`[data-image-contrast-value]`);
          if (contrastValue) contrastValue.textContent = '100%';
        }
        if (saturationInput) {
          saturationInput.value = 100;
          const saturationValue = panel.querySelector(`[data-image-saturation-value]`);
          if (saturationValue) saturationValue.textContent = '100%';
        }
        const zoomInput = panel.querySelector(`[data-image-zoom][data-panel-id="${panelId}"]`);
        const zoomValue = panel.querySelector(`[data-image-zoom-value]`);
        if (zoomInput) {
          zoomInput.value = 100;
          currentZoom = 100;
          if (zoomValue) zoomValue.textContent = '100%';
        }
        const posXInput = panel.querySelector(`[data-image-pos-x][data-panel-id="${panelId}"]`);
        const posYInput = panel.querySelector(`[data-image-pos-y][data-panel-id="${panelId}"]`);
        const posXValue = panel.querySelector(`[data-image-pos-x-value]`);
        const posYValue = panel.querySelector(`[data-image-pos-y-value]`);
        if (posXInput) posXInput.value = 50;
        if (posYInput) posYInput.value = 50;
        if (posXValue) posXValue.textContent = '50%';
        if (posYValue) posYValue.textContent = '50%';
        // Réinitialiser le crop
        const cropTopInput = panel.querySelector(`[data-image-crop-top][data-panel-id="${panelId}"]`);
        const cropRightInput = panel.querySelector(`[data-image-crop-right][data-panel-id="${panelId}"]`);
        const cropBottomInput = panel.querySelector(`[data-image-crop-bottom][data-panel-id="${panelId}"]`);
        const cropLeftInput = panel.querySelector(`[data-image-crop-left][data-panel-id="${panelId}"]`);
        const cropTopValue = panel.querySelector(`[data-image-crop-top-value]`);
        const cropRightValue = panel.querySelector(`[data-image-crop-right-value]`);
        const cropBottomValue = panel.querySelector(`[data-image-crop-bottom-value]`);
        const cropLeftValue = panel.querySelector(`[data-image-crop-left-value]`);
        if (cropTopInput) cropTopInput.value = 0;
        if (cropRightInput) cropRightInput.value = 0;
        if (cropBottomInput) cropBottomInput.value = 0;
        if (cropLeftInput) cropLeftInput.value = 0;
        if (cropTopValue) cropTopValue.textContent = '0%';
        if (cropRightValue) cropRightValue.textContent = '0%';
        if (cropBottomValue) cropBottomValue.textContent = '0%';
        if (cropLeftValue) cropLeftValue.textContent = '0%';
        currentScaleX = 1;
        currentScaleY = 1;
        element.style.objectFit = 'cover';
        element.style.objectPosition = 'center';
        element.style.clipPath = 'none';
        blockOffsetY = 0;
        const blockOffsetInput = panel.querySelector(`[data-image-block-offset-y][data-panel-id="${panelId}"]`);
        const blockOffsetValue = panel.querySelector(`[data-image-block-offset-y-value]`);
        if (blockOffsetInput) blockOffsetInput.value = 0;
        if (blockOffsetValue) blockOffsetValue.textContent = '0px';
        if (element.parentElement) {
          const container = element.parentElement;
          // Remettre le bloc dans sa position d'origine dans le flux
          container.style.marginTop = '0px';
          container.style.transform = '';
          // Revenir à une hauteur cohérente basée sur le ratio naturel
          const containerWidth = container.clientWidth || element.clientWidth || 1;
          const ratio = element.naturalHeight && element.naturalWidth
            ? element.naturalHeight / element.naturalWidth
            : 1;
          const baseHeight = Math.max(200, containerWidth * ratio); // base minimale
          container.style.height = `${baseHeight}px`;
        }
        panel.querySelectorAll(`[data-image-fit][data-panel-id="${panelId}"]`).forEach(b => {
          b.classList.toggle('active', b.dataset.imageFit === 'cover');
        });
        if (positionSelect) positionSelect.value = 'center';
        applyImageTransform();
      });
    }

    // Delete button
    const deleteBtn = panel.querySelector(`[data-image-delete][data-panel-id="${panelId}"]`);
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
          element.remove();
          closePanel();
        }
      });
    }
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
    
    // Lire le line-height et le convertir en valeur relative (sans unité)
    let lineHeightValue = 1.5; // valeur par défaut
    const lineHeightStr = computedStyle.lineHeight;
    if (lineHeightStr && lineHeightStr !== 'normal') {
      // Si c'est en px, convertir en relatif en divisant par fontSize
      if (lineHeightStr.includes('px')) {
        const lineHeightPx = parseFloat(lineHeightStr);
        lineHeightValue = lineHeightPx / fontSize;
      } else {
        // Sinon, c'est déjà une valeur relative (sans unité)
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

  // Attacher les événements du panel
  function attachPanelEvents(panel, element, type) {
    console.log('Attachement des événements pour:', type, element);
    
    // Actions spécifiques
    panel.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = e.currentTarget.dataset.action;
        console.log('Action:', action);
        handlePanelAction(action, element, e.currentTarget);
      });
    });

    // Bouton d'application pour la couleur du header
    const applyHeaderBgBtn = panel.querySelector('#applyHeaderBgColorBtn');
    if (applyHeaderBgBtn) {
      applyHeaderBgBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Bouton Appliquer cliqué pour header background');
        applyPanelChanges(element, type, panel);
      });
    }

    // Bouton d'application pour la couleur de fond du PDF
    const applyMainBgBtn = panel.querySelector('#applyMainBgColorBtn');
    if (applyMainBgBtn) {
      applyMainBgBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Bouton Appliquer cliqué pour main background');
        applyPanelChanges(element, type, panel);
      });
    }
    
    // Mise à jour en temps réel pour tous les champs
    const inputs = panel.querySelectorAll('input, textarea, select');
    console.log('Nombre d\'inputs trouvés:', inputs.length);
    
    inputs.forEach(input => {
      if (input.type === 'color') {
        // Pour les color pickers, synchroniser avec le champ texte
        const textInput = panel.querySelector(`#${input.id}Text`);
        console.log('🔵 [DEBUG] Color picker trouvé:', input.id, 'type panel:', type, 'avec textInput:', textInput ? textInput.id : 'none', 'element:', element?.tagName || element?.id || 'none');
        
        if (textInput) {
          input.addEventListener('input', (e) => {
            textInput.value = e.target.value;
            console.log('🟢 [DEBUG] Color picker changed - EVENT DÉCLENCHÉ:', {
              inputId: input.id,
              nouvelleValeur: e.target.value,
              type: type,
              element: element?.tagName || element?.id || 'none',
              panel: panel ? 'présent' : 'absent'
            });
            applyPanelChanges(element, type, panel);
          });
          
          textInput.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
              input.value = e.target.value;
              console.log('🟢 [DEBUG] Color text changed - EVENT DÉCLENCHÉ:', {
                textInputId: textInput.id,
                nouvelleValeur: e.target.value,
                type: type,
                element: element?.tagName || element?.id || 'none'
              });
              applyPanelChanges(element, type, panel);
            } else {
              console.log('⚠️ [DEBUG] Color text invalide:', e.target.value);
            }
          });
        } else {
          input.addEventListener('input', (e) => {
            console.log('🟢 [DEBUG] Color input changed (sans textInput) - EVENT DÉCLENCHÉ:', {
              inputId: input.id,
              nouvelleValeur: e.target.value,
              type: type
            });
            applyPanelChanges(element, type, panel);
          });
        }
      } else if (input.type === 'number') {
        input.addEventListener('input', (e) => {
          console.log('Number input changed:', input.id, e.target.value);
          applyPanelChanges(element, type, panel);
        });
        input.addEventListener('change', (e) => {
          console.log('Number input changed (change):', input.id, e.target.value);
          applyPanelChanges(element, type, panel);
        });
      } else if (input.tagName === 'SELECT') {
        input.addEventListener('change', (e) => {
          console.log('Select changed:', input.id, e.target.value);
          applyPanelChanges(element, type, panel);
        });
      } else {
        input.addEventListener('input', (e) => {
          console.log('Text input changed:', input.id, e.target.value);
          applyPanelChanges(element, type, panel);
        });
      }
    });
  }

  // Appliquer les changements en temps réel
  function applyPanelChanges(element, type, panel) {
    console.log('🔷 [DEBUG] applyPanelChanges DÉBUT - type:', type, 'panel:', panel ? 'présent' : 'absent', 'element:', element?.tagName || element?.id || 'none');
    
    if (!panel) {
      console.error('❌ [DEBUG] applyPanelChanges: panel manquant pour type:', type);
      return;
    }
    
    // Utiliser currentElement si element n'est pas fourni
    const targetElement = element || currentElement;
    console.log('✅ [DEBUG] applyPanelChanges - panel trouvé, type:', type, 'targetElement:', targetElement?.tagName || targetElement?.id || 'none');
    
    // Pour les types 'main', on n'a pas besoin de targetElement
    if (type === 'main') {
      // Ne pas vérifier targetElement pour le type 'main'
    } else if (!targetElement) {
      console.warn('⚠️ [DEBUG] targetElement non défini pour type:', type, 'mais continuons quand même');
    }
    
    try {
      switch (type) {
        case 'title':
          if (!targetElement) {
            console.error('❌ [DEBUG] targetElement manquant pour type title');
            break;
          }
          const titleText = panel.querySelector('#panelTitleText')?.value || '';
          const oldTitleText = targetElement.textContent || '';
          if (oldTitleText !== titleText) {
            // Sauvegarder dans l'historique
            if (typeof saveToHistory === 'function') {
            saveToHistory(targetElement, type, 'text', oldTitleText, titleText);
            }
            targetElement.textContent = titleText;
            // Mettre à jour currentPdfContent
            if (window.currentPdfContent) {
              window.currentPdfContent.titre = titleText;
              if (window.currentPdfContent.title !== undefined) {
                window.currentPdfContent.title = titleText;
              }
            }
          }
          
          // Gérer le header (couleur, hauteur, padding) - Auto Layout
          console.log('🔵 [DEBUG] case title - gestion header layout');
          const pdfPreviewForHeader = document.getElementById('pdfPreview');
          const headerBand = pdfPreviewForHeader?.querySelector('.header-orange-band');
          const headerContent = pdfPreviewForHeader?.querySelector('.header-content');
          
          if (headerBand && headerContent) {
            // Couleur de fond
            const headerBgColorInput = panel.querySelector('#panelHeaderBgColor');
            const headerBgColorText = panel.querySelector('#panelHeaderBgColorText');
            const headerBgColor = headerBgColorInput?.value || headerBgColorText?.value || '#E65B0C';
            
            // Hauteur
            const headerHeightInput = panel.querySelector('#panelHeaderHeight');
            const headerHeight = headerHeightInput ? parseFloat(headerHeightInput.value) || 90 : 90;
            
            // Padding
            const paddingTopInput = panel.querySelector('#panelHeaderPaddingTop');
            const paddingRightInput = panel.querySelector('#panelHeaderPaddingRight');
            const paddingBottomInput = panel.querySelector('#panelHeaderPaddingBottom');
            const paddingLeftInput = panel.querySelector('#panelHeaderPaddingLeft');
            
            const paddingTop = paddingTopInput ? parseFloat(paddingTopInput.value) || 10 : 10;
            const paddingRight = paddingRightInput ? parseFloat(paddingRightInput.value) || 20 : 20;
            const paddingBottom = paddingBottomInput ? parseFloat(paddingBottomInput.value) || 10 : 10;
            const paddingLeft = paddingLeftInput ? parseFloat(paddingLeftInput.value) || 20 : 20;
            
            console.log('🔵 [DEBUG] Header values:', {
              color: headerBgColor,
              height: headerHeight,
              padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`
            });
            
            // Appliquer la couleur
            const oldHeaderColor = headerBand.style.backgroundColor || window.getComputedStyle(headerBand).backgroundColor || '#E65B0C';
            const oldHeaderColorHex = rgbToHex(oldHeaderColor);
            const newHeaderColorHex = rgbToHex(headerBgColor);
            if (oldHeaderColorHex.toLowerCase() !== newHeaderColorHex.toLowerCase()) {
              if (typeof saveToHistory === 'function') {
                saveToHistory(headerBand, type, 'headerBackgroundColor', oldHeaderColorHex, newHeaderColorHex);
              }
            }
            headerBand.style.setProperty('background-color', headerBgColor, 'important');
            headerBand.style.backgroundColor = headerBgColor;
            
            // Appliquer la hauteur (avec auto layout - met à jour min-height du content aussi)
            headerBand.style.setProperty('height', `${headerHeight}px`, 'important');
            headerBand.style.height = `${headerHeight}px`;
            // Auto layout : synchroniser min-height du content avec la hauteur de la bande
            headerContent.style.setProperty('min-height', `${headerHeight}px`, 'important');
            headerContent.style.minHeight = `${headerHeight}px`;
            
            // Appliquer les paddings (auto layout - décalage automatique)
            const paddingValue = `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`;
            headerContent.style.setProperty('padding', paddingValue, 'important');
            headerContent.style.padding = paddingValue;
            
            console.log('✅ [DEBUG] Header layout appliqué:', {
              color: headerBgColor,
              height: `${headerHeight}px`,
              padding: paddingValue
            });
          } else {
            console.warn('⚠️ [DEBUG] Header elements non trouvés:', {
              headerBand: headerBand ? 'trouvé' : 'NON TROUVÉ',
              headerContent: headerContent ? 'trouvé' : 'NON TROUVÉ'
            });
          }
          
          applyTypographyChanges(targetElement, panel);
          // Les spacing sont gérés par attachSpacingEvents maintenant
          break;
        case 'slogan':
          if (!targetElement) {
            console.error('❌ [DEBUG] targetElement manquant pour type slogan');
            break;
          }
          const sloganText = panel.querySelector('#panelSloganText')?.value || '';
          const oldSloganText = targetElement.textContent || '';
          if (oldSloganText !== sloganText) {
            if (typeof saveToHistory === 'function') {
            saveToHistory(targetElement, type, 'text', oldSloganText, sloganText);
            }
            targetElement.textContent = sloganText;
            if (window.currentPdfContent) {
              window.currentPdfContent.slogan = sloganText;
            }
          }
          applyTypographyChanges(targetElement, panel);
          applySpacingChanges(targetElement, panel);
          break;
        case 'section':
          if (!targetElement) {
            console.error('❌ [DEBUG] targetElement manquant pour type section');
            break;
          }
          const sectionText = panel.querySelector('#panelSectionText')?.value || '';
          const currentText = targetElement.textContent || '';
          if (currentText.trim() !== sectionText.trim()) {
            // Préserver l'emoji si présent
            const emoji = targetElement.querySelector('.emoji');
            const oldText = currentText;
            if (emoji) {
              targetElement.innerHTML = `<span class="emoji">${emoji.textContent}</span> ${sectionText}`;
            } else {
              targetElement.textContent = sectionText;
            }
            if (typeof saveToHistory === 'function') {
            saveToHistory(targetElement, type, 'text', oldText, sectionText);
            }
          }
          applyTypographyChanges(targetElement, panel);
          applySpacingChanges(targetElement, panel);
          break;
        case 'list-item':
          if (!targetElement) {
            console.error('❌ [DEBUG] targetElement manquant pour type list-item');
            break;
          }
          const listType = targetElement.getAttribute('data-list-type');
          console.log('list-item type:', listType);
          if (listType === 'caracteristic') {
            const type = panel.querySelector('#panelListItemType')?.value || '';
            const desc = panel.querySelector('#panelListItemDesc')?.value || '';
            const index = parseInt(targetElement.getAttribute('data-list-index'));
            
            console.log('Mise à jour caractéristique:', { type, desc, index });
            
            // Sauvegarder l'ancien état
            const caracArray = window.currentPdfContent?.caracteristiques || window.currentPdfContent?.caracteristic;
            const oldValue = caracArray && caracArray[index] ? {...caracArray[index]} : { type: '', description: '' };
            const newValue = { type, description: desc };
            
            // Mettre à jour le HTML
            targetElement.innerHTML = `<strong>${type}</strong>: ${desc}`;
            
            // Mettre à jour currentPdfContent
            if (caracArray && caracArray[index] !== undefined) {
              caracArray[index] = newValue;
              console.log('currentPdfContent mis à jour:', caracArray[index]);
            }
            
            if (typeof saveToHistory === 'function') {
            saveToHistory(targetElement, type, 'listItem', oldValue, newValue);
            }
          } else {
            const text = panel.querySelector('#panelListItemText')?.value || '';
            const index = parseInt(targetElement.getAttribute('data-list-index'));
            const oldText = targetElement.textContent || '';
            console.log('Mise à jour consommation:', { text, index });
            
            if (typeof saveToHistory === 'function') {
            saveToHistory(targetElement, type, 'listItem', oldText, text);
            }
            targetElement.textContent = text;
            if (window.currentPdfContent && window.currentPdfContent.consommation) {
              window.currentPdfContent.consommation[index] = text;
            }
          }
          applyTypographyChanges(targetElement, panel);
          applySpacingChanges(targetElement, panel);
          break;
        case 'recipe':
          if (!targetElement) {
            console.error('❌ [DEBUG] targetElement manquant pour type recipe');
            break;
          }
          const name = panel.querySelector('#panelRecipeName')?.value || '';
          const recipeType = panel.querySelector('#panelRecipeType')?.value || '';
          const ingredients = panel.querySelector('#panelRecipeIngredients')?.value || '';
          const astuce = panel.querySelector('#panelRecipeAstuce')?.value || '';
          const recipeIndex = parseInt(targetElement.getAttribute('data-recipe-index'));
          
          // Sauvegarder l'ancien état
          const recetteArray = window.currentPdfContent?.recettes || window.currentPdfContent?.recette;
          const oldRecipe = recetteArray && recetteArray[recipeIndex] ? {...recetteArray[recipeIndex]} : { nom: '', type: 'Sucrée', ingredients: '', astuce: '' };
          const newRecipe = {
            nom: name,
            type: recipeType,
            ingredients: ingredients,
            astuce: astuce
          };
          
          // Mettre à jour le HTML
          const strong = targetElement.querySelector('strong');
          if (strong) {
            strong.textContent = `Recette ${recipeType} : ${name}`;
          }
          const ingredientsEl = targetElement.querySelector('.recipe-ingredients .ingredients-content');
          if (ingredientsEl) {
            ingredientsEl.textContent = ingredients;
          }
          const astuceEl = targetElement.querySelector('.recipe-astuce');
          if (astuceEl) {
            astuceEl.textContent = astuce ? `💡 Astuce : ${astuce}` : '';
          } else if (astuce) {
            // Créer l'élément astuce s'il n'existe pas
            const newAstuceEl = document.createElement('em');
            newAstuceEl.className = 'recipe-astuce';
            newAstuceEl.textContent = `💡 Astuce : ${astuce}`;
            targetElement.appendChild(newAstuceEl);
          }
          
          // Mettre à jour currentPdfContent
          if (recetteArray && recetteArray[recipeIndex] !== undefined) {
            recetteArray[recipeIndex] = newRecipe;
          }
          
          if (typeof saveToHistory === 'function') {
          saveToHistory(targetElement, type, 'recipe', oldRecipe, newRecipe);
          }
          applyTypographyChanges(targetElement, panel);
          // Les spacing sont gérés par attachSpacingEvents maintenant
          break;
        case 'main':
          console.log('🔵 [DEBUG] case main - début');
          const width = panel.querySelector('#panelMainWidth')?.value || '595';
          const padding = panel.querySelector('#panelMainPadding')?.value || '20';
          const bgColorInput = panel.querySelector('#panelMainBgColor');
          const bgColorText = panel.querySelector('#panelMainBgColorText');
          console.log('🔵 [DEBUG] case main - inputs trouvés:', {
            bgColorInput: bgColorInput ? bgColorInput.id : 'non trouvé',
            bgColorText: bgColorText ? bgColorText.id : 'non trouvé',
            bgColorInputValue: bgColorInput?.value,
            bgColorTextValue: bgColorText?.value
          });
          // Utiliser la valeur du color picker ou du champ texte
          const bgColor = bgColorInput?.value || bgColorText?.value || '#F6E2BE';
          console.log('🔵 [DEBUG] case main - couleur à appliquer:', bgColor);
          
          // Toujours utiliser #pdfPreview directement
          const pdfPreviewElement = document.getElementById('pdfPreview');
          console.log('🔵 [DEBUG] case main - pdfPreviewElement:', pdfPreviewElement ? 'trouvé' : 'NON TROUVÉ');
          if (pdfPreviewElement) {
            const computedStyle = window.getComputedStyle(pdfPreviewElement);
            const oldWidth = parseFloat(pdfPreviewElement.style.width || computedStyle.width) || 595;
            const oldPadding = parseFloat(pdfPreviewElement.style.padding || computedStyle.padding) || 20;
            const oldBgColor = pdfPreviewElement.style.backgroundColor || computedStyle.backgroundColor || '#F6E2BE';
            
            const newWidth = parseFloat(width);
            const newPadding = parseFloat(padding);
            const oldBgColorHex = rgbToHex(oldBgColor);
            const newBgColorHex = rgbToHex(bgColor);
            
            if (oldWidth !== newWidth) {
              if (typeof saveToHistory === 'function') {
                saveToHistory(pdfPreviewElement, type, 'width', oldWidth, newWidth);
              }
              pdfPreviewElement.style.width = `${width}px`;
            }
            if (oldPadding !== newPadding) {
              if (typeof saveToHistory === 'function') {
                saveToHistory(pdfPreviewElement, type, 'padding', oldPadding, newPadding);
              }
              pdfPreviewElement.style.padding = `${padding}px`;
            }
            // Toujours appliquer la couleur (comparaison pour l'historique seulement)
            if (oldBgColorHex.toLowerCase() !== newBgColorHex.toLowerCase()) {
              if (typeof saveToHistory === 'function') {
                saveToHistory(pdfPreviewElement, type, 'backgroundColor', oldBgColorHex, newBgColorHex);
              }
            }
            // Appliquer la couleur directement avec setProperty pour forcer l'application
            console.log('🔵 [DEBUG] Application de la couleur avec setProperty:', bgColor);
            pdfPreviewElement.style.setProperty('background-color', bgColor, 'important');
            // Aussi en style normal pour compatibilité
            pdfPreviewElement.style.backgroundColor = bgColor;
            console.log('✅ [DEBUG] Background color appliqué à #pdfPreview:', bgColor, 'element:', pdfPreviewElement, 'style actuel:', pdfPreviewElement.style.backgroundColor);
          } else {
            console.warn('#pdfPreview non trouvé');
          }
          break;
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erreur dans applyPanelChanges:', error);
      console.error('❌ [DEBUG] Stack trace:', error.stack);
      console.error('❌ [DEBUG] Contexte:', { element, type, panel: panel ? 'présent' : 'absent' });
    }
  }

  // Appliquer les changements de typographie
  function applyTypographyChanges(element, panel) {
    if (!element || !panel) return;
    
    const computedStyle = window.getComputedStyle(element);
    const fontSize = panel.querySelector('#panelFontSize')?.value;
    const fontWeight = panel.querySelector('#panelFontWeight')?.value;
    const lineHeight = panel.querySelector('#panelLineHeight')?.value;
    const colorInput = panel.querySelector('#panelTextColor');
    const color = colorInput?.value || panel.querySelector('#panelTextColorText')?.value;

    if (fontSize) {
      const oldSize = parseFloat(computedStyle.fontSize) || 16;
      const newSize = parseFloat(fontSize);
      if (oldSize !== newSize) {
        if (typeof saveToHistory === 'function') {
        saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'fontSize', oldSize, newSize);
        }
        element.style.fontSize = `${fontSize}px`;
        console.log('Font size appliqué:', fontSize);
      }
    }
    if (fontWeight) {
      const oldWeight = computedStyle.fontWeight || '400';
      if (oldWeight !== fontWeight) {
        if (typeof saveToHistory === 'function') {
        saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'fontWeight', oldWeight, fontWeight);
        }
        element.style.fontWeight = fontWeight;
        console.log('Font weight appliqué:', fontWeight);
      }
    }
    if (lineHeight) {
      // Lire l'ancien line-height et le convertir en valeur relative
      const oldLineHeightStr = computedStyle.lineHeight;
      let oldLineHeight = 1.5;
      if (oldLineHeightStr && oldLineHeightStr !== 'normal') {
        if (oldLineHeightStr.includes('px')) {
          const oldLineHeightPx = parseFloat(oldLineHeightStr);
          const currentFontSize = parseFloat(computedStyle.fontSize) || 16;
          oldLineHeight = oldLineHeightPx / currentFontSize;
        } else {
          oldLineHeight = parseFloat(oldLineHeightStr);
        }
      }
      
      const newLineHeight = parseFloat(lineHeight);
      
      // Comparer avec une petite tolérance pour éviter les problèmes de précision
      if (Math.abs(oldLineHeight - newLineHeight) > 0.01) {
        if (typeof saveToHistory === 'function') {
        saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'lineHeight', oldLineHeight, newLineHeight);
        }
        // Appliquer le line-height comme valeur relative (sans unité)
        element.style.lineHeight = newLineHeight.toString();
        console.log('Line height appliqué:', newLineHeight, '(ancien:', oldLineHeight.toFixed(2), ')');
      }
    }
    if (color) {
      const oldColor = rgbToHex(computedStyle.color);
      if (oldColor !== color) {
        if (typeof saveToHistory === 'function') {
        saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'color', oldColor, color);
        }
        element.style.color = color;
        // Synchroniser les deux inputs couleur
        if (colorInput) colorInput.value = color;
        const colorText = panel.querySelector('#panelTextColorText');
        if (colorText) colorText.value = color;
        console.log('Color appliquée:', color);
      }
    }
  }

  // Appliquer les changements d'espacement
  function applySpacingChanges(element, panel) {
    if (!element || !panel) return;
    
    const computedStyle = window.getComputedStyle(element);
    const marginTop = panel.querySelector('#panelMarginTop')?.value;
    const marginBottom = panel.querySelector('#panelMarginBottom')?.value;
    const padding = panel.querySelector('#panelPadding')?.value;

    if (marginTop !== undefined && marginTop !== '') {
      const oldMarginTop = parseFloat(computedStyle.marginTop) || 0;
      const newMarginTop = parseFloat(marginTop);
      if (oldMarginTop !== newMarginTop) {
        if (typeof saveToHistory === 'function') {
        saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'marginTop', oldMarginTop, newMarginTop);
        }
        element.style.marginTop = `${marginTop}px`;
        console.log('Margin top appliqué:', marginTop);
      }
    }
    if (marginBottom !== undefined && marginBottom !== '') {
      const oldMarginBottom = parseFloat(computedStyle.marginBottom) || 0;
      const newMarginBottom = parseFloat(marginBottom);
      if (oldMarginBottom !== newMarginBottom) {
        if (typeof saveToHistory === 'function') {
        saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'marginBottom', oldMarginBottom, newMarginBottom);
        }
        element.style.marginBottom = `${marginBottom}px`;
        console.log('Margin bottom appliqué:', marginBottom);
      }
    }
    if (padding !== undefined && padding !== '') {
      const oldPadding = parseFloat(computedStyle.padding) || 0;
      const newPadding = parseFloat(padding);
      if (oldPadding !== newPadding) {
        if (typeof saveToHistory === 'function') {
        saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'padding', oldPadding, newPadding);
        }
        element.style.padding = `${padding}px`;
        console.log('Padding appliqué:', padding);
      }
    }
  }

  // Sauvegarder les changements
  function savePanelChanges(element, type) {
    // Utiliser le système existant de sauvegarde
    if (window.saveElement && typeof window.saveElement === 'function') {
      window.saveElement(element, type);
    }
    closePanel();
  }

  // Gérer les actions du panel
  function handlePanelAction(action, element, button) {
    switch (action) {
      case 'add-item':
        const section = button.dataset.section;
        // Utiliser la fonction du direct editor
        if (window.addItemToSection && typeof window.addItemToSection === 'function') {
          window.addItemToSection(section);
        } else {
          // Fallback : ajouter directement
          const pdfPreview = document.getElementById('pdfPreview');
          if (pdfPreview && window.currentPdfContent) {
            if (section === 'caracteristic' && window.currentPdfContent.caracteristic) {
              window.currentPdfContent.caracteristic.push({ type: '', description: '' });
            } else if (section === 'consommation' && window.currentPdfContent.consommation) {
              window.currentPdfContent.consommation.push('');
            } else if (section === 'recette' && window.currentPdfContent.recette) {
              window.currentPdfContent.recette.push({
                nom: '',
                type: 'Sucrée',
                ingredients: '',
                astuce: ''
              });
            }
            
            // Régénérer le HTML
            if (window.generateHTML && window.updatePreview) {
              window.updatePreview();
            }
          }
        }
        break;
      case 'delete-item':
        // Utiliser la fonction du direct editor
        if (window.deleteElement && typeof window.deleteElement === 'function') {
          window.deleteElement(element, 'list-item');
        } else {
          // Fallback : supprimer directement
          if (element && element.tagName === 'LI') {
            const listType = element.getAttribute('data-list-type');
            const index = parseInt(element.getAttribute('data-list-index'));
            
            if (window.currentPdfContent) {
              if (listType === 'caracteristic' && window.currentPdfContent.caracteristic) {
                window.currentPdfContent.caracteristic.splice(index, 1);
              } else if (listType === 'consommation' && window.currentPdfContent.consommation) {
                window.currentPdfContent.consommation.splice(index, 1);
              }
              
              if (window.generateHTML && window.updatePreview) {
                window.updatePreview();
              }
            }
          }
        }
        closePanel();
        break;
      case 'delete-recipe':
        // Utiliser la fonction du direct editor
        if (window.deleteElement && typeof window.deleteElement === 'function') {
          window.deleteElement(element, 'recipe');
        } else {
          // Fallback : supprimer directement
          if (element && element.classList.contains('recipe')) {
            const index = parseInt(element.getAttribute('data-recipe-index'));
            
            if (window.currentPdfContent && window.currentPdfContent.recette) {
              window.currentPdfContent.recette.splice(index, 1);
              
              if (window.generateHTML && window.updatePreview) {
                window.updatePreview();
              }
            }
          }
        }
        closePanel();
        break;
      case 'hide-section':
        hideSection(element);
        closePanel();
        break;
      case 'show-section':
        showSection(element);
        closePanel();
        break;
    }
  }

  // Fermer le panel
  function closePanel() {
    console.log('🔴 closePanel appelé, currentPanel:', currentPanel);
    if (currentPanel) {
      currentPanel.classList.remove('active');
      // Retirer immédiatement du DOM pour éviter les conflits
      const panelToRemove = currentPanel;
        currentPanel = null;
        currentElement = null;
        window.currentPanel = null;
        window.currentElement = null;
      
      // Retirer du DOM après un court délai pour l'animation
      setTimeout(() => {
        if (panelToRemove && panelToRemove.parentNode) {
          panelToRemove.parentNode.removeChild(panelToRemove);
          console.log('✅ Panel retiré du DOM');
        }
      }, 200);
    } else {
      console.log('⚠️ Aucun panel à fermer');
    }
  }

  // Helpers
  function getIconForType(type) {
    const icons = {
      'title': '📝',
      'slogan': '💬',
      'section': '📑',
      'list-item': '📋',
      'recipe': '🍳',
      'main': '📐',
      'image': '🖼️'
    };
    return icons[type] || '📄';
  }

  function getTitleForType(type) {
    const titles = {
      'title': 'Title',
      'slogan': 'Slogan',
      'section': 'Section',
      'list-item': 'List Item',
      'recipe': 'Recipe',
      'main': 'Document',
      'image': 'Image'
    };
    return titles[type] || 'Element';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function rgbToHex(rgb) {
    if (!rgb) return '#F6E2BE';
    if (typeof rgb !== 'string') return '#F6E2BE';
    if (rgb.startsWith('#')) return rgb.toUpperCase();
    
    // Gérer rgb() et rgba()
    const rgbMatch = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const hex = '#' + [1, 2, 3].map(i => {
        const val = parseInt(rgbMatch[i]);
        return ('0' + val.toString(16)).slice(-2).toUpperCase();
      }).join('');
      return hex;
    }
    
    // Gérer les noms de couleurs CSS communs
    const colorMap = {
      'white': '#FFFFFF',
      'black': '#000000',
      'transparent': 'transparent'
    };
    if (colorMap[rgb.toLowerCase()]) {
      return colorMap[rgb.toLowerCase()];
    }
    
    // Valeur par défaut
    return '#F6E2BE';
  }

  // Masquer une section complète
  function hideSection(sectionElement) {
    if (!sectionElement) return;
    
    const sectionName = sectionElement.getAttribute('data-section');
    if (!sectionName) return;
    
    // Marquer la section comme cachée
    sectionElement.classList.add('section-hidden');
    sectionElement.style.display = 'none';
    
    // Cacher le contenu de la section
    const sectionContent = document.querySelector(`[data-section-content="${sectionName}"]`);
    if (sectionContent) {
      sectionContent.style.display = 'none';
      sectionContent.classList.add('section-hidden');
    }
    
    // Sauvegarder l'état dans sessionStorage
    const hiddenSections = JSON.parse(sessionStorage.getItem('hiddenSections') || '[]');
    if (!hiddenSections.includes(sectionName)) {
      hiddenSections.push(sectionName);
      sessionStorage.setItem('hiddenSections', JSON.stringify(hiddenSections));
    }
    
    console.log(`✅ Section "${sectionName}" masquée`);
  }
  
  // Afficher une section cachée
  function showSection(sectionElement) {
    if (!sectionElement) return;
    
    const sectionName = sectionElement.getAttribute('data-section');
    if (!sectionName) return;
    
    // Afficher la section
    sectionElement.classList.remove('section-hidden');
    sectionElement.style.display = '';
    
    // Afficher le contenu de la section
    const sectionContent = document.querySelector(`[data-section-content="${sectionName}"]`);
    if (sectionContent) {
      sectionContent.style.display = '';
      sectionContent.classList.remove('section-hidden');
    }
    
    // Retirer de la liste des sections cachées
    const hiddenSections = JSON.parse(sessionStorage.getItem('hiddenSections') || '[]');
    const index = hiddenSections.indexOf(sectionName);
    if (index > -1) {
      hiddenSections.splice(index, 1);
      sessionStorage.setItem('hiddenSections', JSON.stringify(hiddenSections));
    }
    
    console.log(`✅ Section "${sectionName}" affichée`);
  }
  
  // Restaurer l'état des sections au chargement
  function restoreHiddenSections() {
    const hiddenSections = JSON.parse(sessionStorage.getItem('hiddenSections') || '[]');
    if (hiddenSections.length === 0) return;
    
    hiddenSections.forEach(sectionName => {
      const sectionElement = document.querySelector(`[data-section="${sectionName}"]`);
      const sectionContent = document.querySelector(`[data-section-content="${sectionName}"]`);
      
      if (sectionElement) {
        sectionElement.classList.add('section-hidden');
        sectionElement.style.display = 'none';
      }
      
      if (sectionContent) {
        sectionContent.style.display = 'none';
        sectionContent.classList.add('section-hidden');
      }
    });
  }
  
  // Créer et gérer la modal des sections
  let sectionsModal = null;
  
  function createSectionsModal() {
    if (sectionsModal) return sectionsModal;
    
    sectionsModal = document.createElement('div');
    sectionsModal.id = 'sectionsModal';
    sectionsModal.className = 'sections-modal';
    document.body.appendChild(sectionsModal);
    
    return sectionsModal;
  }
  
  // Analyser récursivement la structure HTML pour créer la hiérarchie des layers
  function analyzeLayers(element, depth = 0) {
    if (!element || depth > 15) return null; // Limite de profondeur
    
    const children = Array.from(element.children);
    const layer = {
      element: element,
      type: getLayerType(element),
      name: getLayerName(element),
      icon: getLayerIcon(element),
      children: [],
      isHidden: element.classList.contains('section-hidden') || element.style.display === 'none',
      hasContent: children.length > 0 || element.textContent.trim().length > 0,
      id: element.id || null
    };
    
    // Filtrer les enfants non pertinents (comme les spans d'emoji, etc.)
    const relevantChildren = children.filter(child => {
      // Ignorer les spans d'emoji et autres éléments décoratifs
      if (child.tagName === 'SPAN' && child.classList.contains('emoji')) return false;
      if (child.tagName === 'SPAN' && !child.id && !child.className && child.textContent.trim().length === 0) return false;
      
      // Ignorer les h2 avec data-section car on affichera uniquement le ul/div avec data-section-content
      // Le nom sera basé sur le h2 mais l'élément principal sera le ul/div
      if (child.tagName === 'H2' && child.hasAttribute('data-section')) {
        // Vérifier si le prochain sibling est un ul ou div avec data-section-content correspondant
        const sectionName = child.getAttribute('data-section');
        let nextSibling = child.nextElementSibling;
        while (nextSibling) {
          if ((nextSibling.tagName === 'UL' || nextSibling.tagName === 'DIV') && 
              nextSibling.getAttribute('data-section-content') === sectionName) {
            // On gardera le ul/div, pas le h2
            return false;
          }
          // Si on trouve un autre h2 avant le ul/div, on garde ce h2
          if (nextSibling.tagName === 'H2') break;
          nextSibling = nextSibling.nextElementSibling;
        }
      }
      
      return true;
    });
    
    // Analyser les enfants pertinents
    relevantChildren.forEach(child => {
      // Pour les ul/div avec data-section-content, utiliser le h2 précédent pour le nom
      if ((child.tagName === 'UL' || child.tagName === 'DIV') && child.hasAttribute('data-section-content')) {
        const sectionName = child.getAttribute('data-section-content');
        // Chercher le h2 précédent pour récupérer son texte
        let previousSibling = child.previousElementSibling;
        while (previousSibling) {
          if (previousSibling.tagName === 'H2' && previousSibling.getAttribute('data-section') === sectionName) {
            // Créer un layer avec le nom du h2 mais l'élément ul/div
            const childLayer = analyzeLayers(child, depth + 1);
            if (childLayer) {
              // Remplacer le nom par celui du h2
              const h2Title = previousSibling.textContent.trim().replace(/[🌿🍴👨‍🍳]/g, '').trim();
              if (h2Title) {
                childLayer.name = h2Title;
              }
              layer.children.push(childLayer);
            }
            break;
          }
          previousSibling = previousSibling.previousElementSibling;
        }
        // Si pas de h2 trouvé, analyser normalement
        if (!previousSibling || previousSibling.tagName !== 'H2') {
          const childLayer = analyzeLayers(child, depth + 1);
          if (childLayer) {
            layer.children.push(childLayer);
          }
        }
      } else {
        const childLayer = analyzeLayers(child, depth + 1);
        if (childLayer) {
          layer.children.push(childLayer);
        }
      }
    });
    
    return layer;
  }
  
  // Déterminer le type de layer
  function getLayerType(element) {
    if (element.id === 'pdfPreview') return 'frame';
    if (element.classList.contains('header-orange-band')) return 'rectangle';
    if (element.classList.contains('badge-group')) return 'group';
    if (element.classList.contains('header-content')) return 'frame';
    if (element.classList.contains('otera-footer')) return 'frame';
    if (element.hasAttribute('data-section')) return 'frame';
    if (element.tagName === 'H1' || element.tagName === 'H2') return 'text';
    if (element.tagName === 'P') return 'text';
    if (element.tagName === 'UL') return 'group';
    if (element.tagName === 'LI') return 'text';
    if (element.classList.contains('recipe')) return 'frame';
    if (element.tagName === 'IMG') return 'image';
    if (element.tagName === 'DIV') return 'frame';
    return 'element';
  }
  
  // Obtenir le nom du layer
  function getLayerName(element) {
    if (element.id === 'pdfPreview') return 'Frame Principal';
    if (element.id === 'headerOrangeBand' || element.classList.contains('header-orange-band')) return 'Header Background';
    if (element.id === 'badgeGroup' || element.classList.contains('badge-group')) return 'Badge Group';
    if (element.id === 'headerContent' || element.classList.contains('header-content')) return 'Header Content';
    if (element.id === 'mainTitle') return 'Titre';
    if (element.id === 'mainSlogan') return 'Slogan';
    if (element.id === 'oteraFooter' || element.classList.contains('otera-footer')) return 'Footer';
    if (element.hasAttribute('data-section')) {
      const sectionName = element.getAttribute('data-section');
      const titles = {
        'caracteristiques': 'Caractéristiques',
        'consommation': '3 Façons de le Consommer',
        'recettes': 'Idées Recettes'
      };
      return titles[sectionName] || `Frame ${sectionName}`;
    }
    if (element.tagName === 'H1') return element.textContent.trim() || 'Titre';
    if (element.tagName === 'H2') {
      const text = element.textContent.trim();
      return text.replace(/[🌿🍴👨‍🍳]/g, '').trim() || 'Section';
    }
    if (element.tagName === 'P' && element.classList.contains('slogan')) return 'Slogan';
    if (element.tagName === 'LI') {
      const strong = element.querySelector('strong');
      if (strong) {
        return strong.textContent.trim() || 'Item';
      }
      return element.textContent.trim().substring(0, 30) || 'Item';
    }
    if (element.classList.contains('recipe')) {
      const strong = element.querySelector('strong');
      if (strong) {
        return strong.textContent.trim().substring(0, 40) || 'Recette';
      }
      return 'Recette';
    }
    if (element.tagName === 'IMG') {
      return element.alt || element.getAttribute('data-badge') || 'Image';
    }
    
    // Pour les ul et div avec data-section-content, chercher le titre de la section (h2 précédent)
    if ((element.tagName === 'UL' || element.tagName === 'DIV') && element.hasAttribute('data-section-content')) {
      const sectionName = element.getAttribute('data-section-content');
      // Chercher le h2 précédent avec le même data-section
      let previousSibling = element.previousElementSibling;
      while (previousSibling) {
        if (previousSibling.tagName === 'H2' && previousSibling.getAttribute('data-section') === sectionName) {
          const title = previousSibling.textContent.trim();
          // Nettoyer les emojis
          return title.replace(/[🌿🍴👨‍🍳]/g, '').trim() || `Section ${sectionName}`;
        }
        previousSibling = previousSibling.previousElementSibling;
      }
      // Si pas trouvé, utiliser les titres par défaut
      const titles = {
        'caracteristiques': 'Caractéristiques',
        'consommation': '3 Façons de le Consommer',
        'recettes': 'Idées Recettes'
      };
      return titles[sectionName] || `Section ${sectionName}`;
    }
    
    return element.className || element.tagName.toLowerCase();
  }
  
  // Obtenir l'icône du layer
  function getLayerIcon(element) {
    const type = getLayerType(element);
    const icons = {
      'frame': '#',
      'rectangle': '▭',
      'group': '⬦',
      'text': 'T',
      'image': '🖼',
      'element': '•'
    };
    return icons[type] || '•';
  }
  
  // Générer le HTML récursif pour les layers
  function generateLayersHTML(layer, depth = 0) {
    if (!layer) return '';
    
    const indent = depth * 20;
    const isExpanded = depth < 2; // Expand par défaut pour les 2 premiers niveaux
    const hasChildren = layer.children && layer.children.length > 0;
    const hiddenSections = JSON.parse(sessionStorage.getItem('hiddenSections') || '[]');
    const isSectionHidden = layer.element && layer.element.hasAttribute('data-section') && 
                           hiddenSections.includes(layer.element.getAttribute('data-section'));
    
    const elementId = layer.id || (layer.element ? layer.element.id || '' : '');
    // Un élément est cliquable s'il est éditable, a un ID, est un ul/div avec data-section-content,
    // ou est un élément texte (h1, h2, p, li, etc.) qui peut être édité
    const isEditable = layer.element && (
      layer.element.hasAttribute('data-editable') || 
      layer.element.id ||
      (layer.element.hasAttribute('data-section-content')) ||
      // Éléments texte qui peuvent être édités (h1, h2, p, li, etc.)
      (['H1', 'H2', 'H3', 'P', 'LI', 'SPAN'].includes(layer.element.tagName))
    );
    const clickable = isEditable ? 'layer-clickable' : '';
    
    // Déterminer si c'est une section draggable (h2 avec data-section ou ul/div avec data-section-content)
    const isDraggableSection = layer.element && (
      (layer.element.tagName === 'H2' && layer.element.hasAttribute('data-section')) ||
      (layer.element.hasAttribute('data-section-content'))
    );
    const draggableAttr = isDraggableSection ? 'draggable="true"' : '';
    const dragHandleClass = isDraggableSection ? 'section-drag-handle' : '';
    
    let html = `
      <div class="section-modal-item ${isSectionHidden ? 'section-hidden' : ''} ${isExpanded && hasChildren ? 'expanded' : ''} ${clickable}" 
           data-layer-id="${elementId}" 
           data-element="${layer.element ? 'true' : 'false'}"
           ${draggableAttr}
           ${isDraggableSection ? `data-section-name="${layer.element.getAttribute('data-section') || layer.element.getAttribute('data-section-content') || ''}"` : ''}>
        <div class="section-modal-item-header ${dragHandleClass}" data-toggle="expand" style="padding-left: ${indent}px;">
          ${hasChildren ? `<span class="section-modal-toggle">${isExpanded ? '▼' : '▶'}</span>` : '<span class="section-modal-toggle" style="visibility: hidden;">▶</span>'}
          <span class="section-modal-icon">${layer.icon}</span>
          <span class="section-modal-title">${escapeHtml(layer.name)}</span>
          ${isDraggableSection ? '<span class="section-drag-icon" title="Glisser pour réorganiser">⋮⋮</span>' : ''}
          ${isSectionHidden ? '<span class="section-modal-status status-hidden">●</span>' : '<span class="section-modal-status status-visible">○</span>'}
        </div>
        ${hasChildren ? `
          <div class="section-modal-content" style="display: ${isExpanded ? 'block' : 'none'};">
            ${layer.children.map(child => generateLayersHTML(child, depth + 1)).join('')}
            ${layer.element && layer.element.hasAttribute('data-section') ? `
              <div class="section-modal-actions" style="padding-left: ${indent + 20}px;">
                <button class="section-modal-btn ${isSectionHidden ? 'btn-show' : 'btn-hide'}" 
                        data-action="${isSectionHidden ? 'show' : 'hide'}" 
                        data-section="${layer.element.getAttribute('data-section')}">
                  ${isSectionHidden ? 'Show' : 'Hide'}
                </button>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
    
    return html;
  }
  
  function openSectionsModal() {
    // Modal Layers désactivée (suppression demandée)
    console.log('ℹ️ Modal Layers désactivée');
    return;

    const modal = createSectionsModal();
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) return;
    
    // Toggle la sidebar (ouvrir/fermer)
    if (modal.classList.contains('active')) {
      modal.classList.remove('active');
      const previewContainer = document.querySelector('.preview-container');
      if (previewContainer) {
        previewContainer.style.marginLeft = '';
      }
      return;
    }
    
    // Analyser la structure complète des layers
    const rootLayer = analyzeLayers(pdfPreview);
    
    // Générer le HTML de la sidebar avec toute la hiérarchie
    const layersHTML = rootLayer ? generateLayersHTML(rootLayer) : '<div class="section-modal-item"><div class="section-modal-item-header"><span class="section-modal-title">Aucun contenu</span></div></div>';
    
    // Compter le nombre total de layers
    const countLayers = (layer) => {
      let count = 1;
      if (layer && layer.children) {
        layer.children.forEach(child => {
          count += countLayers(child);
        });
      }
      return count;
    };
    const totalLayers = rootLayer ? countLayers(rootLayer) : 0;
    
    // Vérifier l'état rétracté depuis sessionStorage
    const isCollapsed = sessionStorage.getItem('layersPanelCollapsed') === 'true';
    
    modal.innerHTML = `
      <div class="sections-modal-overlay"></div>
      <div class="sections-modal-content ${isCollapsed ? 'collapsed' : ''}">
        <div class="sections-modal-header">
          <div class="sections-modal-header-left">
            <h2>Layers</h2>
            <span class="sections-modal-count">${totalLayers}</span>
          </div>
          <div class="sections-modal-header-actions">
            <button class="sections-modal-action-btn" id="expandAllBtn" title="Tout développer" aria-label="Tout développer">⤢</button>
            <button class="sections-modal-action-btn" id="collapseAllBtn" title="Tout rétracter" aria-label="Tout rétracter">⤡</button>
            <button class="sections-modal-toggle-btn" id="layersToggleBtn" title="${isCollapsed ? 'Développer' : 'Rétracter'}" aria-label="${isCollapsed ? 'Développer' : 'Rétracter'}">
              <span class="toggle-icon">${isCollapsed ? '▶' : '◀'}</span>
            </button>
          </div>
        </div>
        <div class="sections-modal-search">
          <input type="text" id="sectionsSearchInput" class="sections-modal-search-input" placeholder="Rechercher un layer... (Ctrl+F)" />
          <span class="sections-modal-search-icon">🔍</span>
        </div>
        <div class="sections-modal-body">
          <div class="sections-list" id="sectionsList">
            ${layersHTML}
          </div>
          <div class="sections-modal-empty" id="sectionsEmpty" style="display: none;">
            <p>Aucun layer trouvé</p>
          </div>
        </div>
      </div>
    `;
    
    // Afficher la sidebar
    modal.classList.add('active');
    
    // Ajuster le margin du preview-container
    updatePreviewMargin(modal);
    
    // Attacher les événements
    attachSectionsModalEvents(modal);
  }
  
  // Mettre à jour le margin du preview-container selon l'état du panel
  function updatePreviewMargin(modal) {
    const previewContainer = document.querySelector('.preview-container');
    if (!previewContainer) return;
    
    const content = modal.querySelector('.sections-modal-content');
    const isCollapsed = content?.classList.contains('collapsed');
    const isActive = modal.classList.contains('active');
    
    if (isActive && !isCollapsed) {
      previewContainer.style.marginLeft = '300px';
    } else if (isActive && isCollapsed) {
      previewContainer.style.marginLeft = '50px';
    } else {
      previewContainer.style.marginLeft = '';
    }
  }
  
  function attachSectionsModalEvents(modal) {
    // Bouton toggle pour rétracter/étendre
    const toggleBtn = modal.querySelector('#layersToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const content = modal.querySelector('.sections-modal-content');
        if (content) {
          const isCollapsed = content.classList.contains('collapsed');
          content.classList.toggle('collapsed');
          
          // Mettre à jour l'icône
          const icon = toggleBtn.querySelector('.toggle-icon');
          
          if (isCollapsed) {
            // Développer - icône pointe vers la droite
            icon.textContent = '▶';
            toggleBtn.setAttribute('title', 'Développer');
            toggleBtn.setAttribute('aria-label', 'Développer');
            sessionStorage.setItem('layersPanelCollapsed', 'false');
          } else {
            // Rétracter - icône pointe vers la gauche
            icon.textContent = '◀';
            toggleBtn.setAttribute('title', 'Rétracter');
            toggleBtn.setAttribute('aria-label', 'Rétracter');
            sessionStorage.setItem('layersPanelCollapsed', 'true');
          }
          
          // Mettre à jour le margin du preview
          updatePreviewMargin(modal);
        }
      });
    }
    
    // Fermeture via overlay (si présent)
    const overlay = modal.querySelector('.sections-modal-overlay');
    
    if (overlay) {
      overlay.addEventListener('click', () => {
        modal.classList.remove('active');
        const previewContainer = document.querySelector('.preview-container');
        if (previewContainer) {
          previewContainer.style.marginLeft = '';
        }
      });
    }
    
    // Gérer l'expand/collapse des frames - utiliser delegation d'événements pour tous les layers
    // Attacher l'événement sur le modal lui-même pour capturer tous les clics sur les toggles
    // Utiliser capture phase pour intercepter AVANT les autres handlers
    modal.addEventListener('click', (e) => {
      // Vérifier si on clique sur le toggle directement
      const toggle = e.target.closest('.section-modal-toggle');
      // Vérifier si on clique sur le header avec data-toggle (mais pas sur le titre ou l'icône)
      const header = e.target.closest('[data-toggle="expand"]');
      
      // Si on clique directement sur le toggle
      if (toggle) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const item = toggle.closest('.section-modal-item');
        if (item) {
          const isCurrentlyExpanded = item.classList.contains('expanded');
          item.classList.toggle('expanded');
          const toggleElement = item.querySelector('.section-modal-toggle');
          const content = item.querySelector('.section-modal-content');
          
          // Mettre à jour le toggle
          if (toggleElement && toggleElement.style.visibility !== 'hidden') {
            toggleElement.textContent = item.classList.contains('expanded') ? '▼' : '▶';
          }
          
          // Mettre à jour le style inline du contenu pour forcer l'affichage
          // Utiliser setProperty avec important pour surcharger le CSS !important
          if (content) {
            if (item.classList.contains('expanded')) {
              content.style.setProperty('display', 'block', 'important');
            } else {
              content.style.setProperty('display', 'none', 'important');
            }
          }
          
          const layerName = item.querySelector('.section-modal-title')?.textContent || 'Unknown';
          console.log('🔄 Layer toggle (via toggle):', layerName, item.classList.contains('expanded') ? 'expanded' : 'collapsed', 'hasContent:', !!content);
        }
        return false;
      }
      
      // Si on clique sur le header (mais pas sur le titre, l'icône ou le status)
      if (header && !e.target.closest('.section-modal-title') && 
          !e.target.closest('.section-modal-icon') && 
          !e.target.closest('.section-modal-status') &&
          !e.target.closest('.section-modal-toggle')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const item = header.closest('.section-modal-item');
        if (item) {
          const toggleElement = item.querySelector('.section-modal-toggle');
          // Ne faire le toggle que si l'élément a un toggle visible (donc des enfants)
          if (toggleElement && toggleElement.style.visibility !== 'hidden') {
            const isCurrentlyExpanded = item.classList.contains('expanded');
            item.classList.toggle('expanded');
            const content = item.querySelector('.section-modal-content');
            
            // Mettre à jour le toggle
            toggleElement.textContent = item.classList.contains('expanded') ? '▼' : '▶';
            
            // Mettre à jour le style inline du contenu pour forcer l'affichage
            // Utiliser setProperty avec important pour surcharger le CSS !important
            if (content) {
              if (item.classList.contains('expanded')) {
                content.style.setProperty('display', 'block', 'important');
              } else {
                content.style.setProperty('display', 'none', 'important');
              }
            }
            
            const layerName = item.querySelector('.section-modal-title')?.textContent || 'Unknown';
            console.log('🔄 Layer toggle (via header):', layerName, item.classList.contains('expanded') ? 'expanded' : 'collapsed', 'hasContent:', !!content);
          }
        }
        return false;
      }
    }, true); // Utiliser capture phase pour intercepter avant les autres handlers
    
    // Gérer le drag & drop pour réorganiser les sections
    setupSectionDragAndDrop(modal);
    
    // Gérer les actions sur les sections
    const actionButtons = modal.querySelectorAll('.section-modal-btn');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const action = btn.getAttribute('data-action');
        const sectionName = btn.getAttribute('data-section');
        
        if (action === 'hide') {
          const sectionElement = document.querySelector(`[data-section="${sectionName}"]`);
          if (sectionElement) {
            hideSection(sectionElement);
            // Rafraîchir la modal
            setTimeout(() => {
              openSectionsModal();
            }, 100);
          }
        } else if (action === 'show') {
          const sectionElement = document.querySelector(`[data-section="${sectionName}"]`);
          if (sectionElement) {
            showSection(sectionElement);
            // Rafraîchir la modal
            setTimeout(() => {
              openSectionsModal();
            }, 100);
          }
        } else if (action === 'add') {
          addSection(sectionName);
          // Rafraîchir la modal
          setTimeout(() => {
            openSectionsModal();
          }, 100);
        }
      });
    });
    
    // Gérer le clic sur les layers pour sélectionner l'élément
    // Utiliser delegation d'événements pour capturer tous les clics, même sur les layers enfants
    modal.addEventListener('click', (e) => {
      // Ignorer si on clique sur le toggle, un bouton, ou le status
      if (e.target.closest('.section-modal-toggle') ||
          e.target.closest('.section-modal-btn') || 
          e.target.closest('.section-modal-status')) {
        return;
      }
      
      // Ignorer si on clique directement sur le header avec data-toggle (sauf le toggle)
      const clickedHeader = e.target.closest('[data-toggle="expand"]');
      if (clickedHeader && !e.target.closest('.section-modal-toggle')) {
        // Si on clique sur le header mais pas sur le toggle, ne rien faire (le toggle gère déjà)
        return;
      }
      
      // Trouver l'item layer cliqué
      const item = e.target.closest('.section-modal-item.layer-clickable');
      if (!item) return;
      
      const layerId = item.getAttribute('data-layer-id');
      let element = null;
      
      // Si on a un ID, chercher l'élément par ID
      if (layerId) {
        element = document.getElementById(layerId);
      }
      
      // Si pas d'élément trouvé par ID, essayer de trouver par le nom du layer (pour les éléments texte sans ID)
      if (!element) {
        const layerTitle = item.querySelector('.section-modal-title')?.textContent.trim();
        const layerIcon = item.querySelector('.section-modal-icon')?.textContent;
        
        // Si c'est un élément texte (icône 'T'), chercher dans le DOM
        if (layerIcon === 'T' && layerTitle) {
          // Chercher tous les éléments texte correspondants dans le pdfPreview
          const pdfPreview = document.getElementById('pdfPreview');
          if (pdfPreview) {
            const textElements = pdfPreview.querySelectorAll('h1, h2, h3, p, li, span');
            for (const el of textElements) {
              const elText = el.textContent.trim().replace(/[🌿🍴👨‍🍳]/g, '').trim();
              // Comparer les textes (exact ou partiel)
              if (elText === layerTitle || 
                  (elText.length > 0 && layerTitle.length > 0 && 
                   (elText.includes(layerTitle) || layerTitle.includes(elText)))) {
                element = el;
                break;
              }
            }
          }
        }
      }
      
      if (element) {
        // Mettre en surbrillance l'élément sélectionné dans le panel
        const allItems = modal.querySelectorAll('.section-modal-item');
        allItems.forEach(i => i.classList.remove('layer-selected'));
        item.classList.add('layer-selected');
        
        // Mettre en surbrillance l'élément dans le preview
        const previousHighlight = document.querySelector('.layer-highlight');
        if (previousHighlight) {
          previousHighlight.classList.remove('layer-highlight');
        }
        element.classList.add('layer-highlight');
        setTimeout(() => {
          element.classList.remove('layer-highlight');
        }, 2000);
        
        // Fonction pour ouvrir le panel approprié
        const openPanel = () => {
            // Si l'élément a data-section-content, chercher le h2 avec data-section correspondant
            if (element.hasAttribute('data-section-content')) {
              const sectionName = element.getAttribute('data-section-content');
              const sectionElement = document.querySelector(`h2[data-section="${sectionName}"]`);
              if (sectionElement && sectionElement.hasAttribute('data-editable')) {
                openPanelForElement(sectionElement);
                return;
              }
            }
            
            // Si l'élément est directement éditable
            if (element.hasAttribute('data-editable')) {
              openPanelForElement(element);
            } else {
              // Pour les éléments texte, essayer de trouver ou créer l'élément éditable
              const tagName = element.tagName;
              
              // Si l'élément a un ID connu qui correspond à un élément éditable
              if (element.id === 'mainTitle' || element.id === 'mainSlogan') {
                // Ces éléments ont déjà data-editable dans le HTML
                openPanelForElement(element);
                return;
              }
              
              // Pour les éléments texte (h1, h2, p, li, etc.)
              if (['H1', 'H2', 'H3', 'P', 'LI', 'SPAN'].includes(tagName)) {
                // Si l'élément est un h2 avec data-section, il devrait être éditable
                if (tagName === 'H2' && element.hasAttribute('data-section')) {
                  // S'assurer qu'il a data-editable
                  if (!element.hasAttribute('data-editable')) {
                    element.setAttribute('data-editable', 'section');
                    element.setAttribute('data-editable-type', 'section');
                  }
                  openPanelForElement(element);
                  return;
                }
                
                // Pour les autres éléments texte, chercher un parent éditable
                const editableParent = element.closest('[data-editable]');
                if (editableParent) {
                  openPanelForElement(editableParent);
                  return;
                }
                
                // Pour les LI, chercher dans le parent ul qui pourrait avoir data-section-content
                if (tagName === 'LI') {
                  const parentUl = element.closest('ul');
                  if (parentUl && parentUl.hasAttribute('data-section-content')) {
                    const sectionName = parentUl.getAttribute('data-section-content');
                    const sectionElement = document.querySelector(`h2[data-section="${sectionName}"]`);
                    if (sectionElement && sectionElement.hasAttribute('data-editable')) {
                      openPanelForElement(sectionElement);
                      return;
                    }
                  }
                }
                
                // Dernier recours : essayer d'ouvrir avec l'élément directement
                // openPanelForElement devrait pouvoir détecter le type depuis l'ID ou le tagName
                openPanelForElement(element);
                return;
              }
              
              // Essayer de trouver un élément éditable parent ou enfant
              const editableParent = element.closest('[data-editable]');
              if (editableParent) {
                openPanelForElement(editableParent);
              } else {
                // Essayer de trouver un élément éditable enfant
                const editableChild = element.querySelector('[data-editable]');
                if (editableChild) {
                  openPanelForElement(editableChild);
                }
              }
            }
        };
        
        // S'assurer que le panel précédent est bien fermé
        if (currentPanel) {
          closePanel();
          // Attendre un peu pour que le panel soit complètement fermé
          setTimeout(() => {
            openPanel();
          }, 100);
        } else {
          // Pas de panel ouvert, ouvrir directement
          openPanel();
        }
      }
    }, false); // Utiliser bubble phase pour les clics sur les layers
    
    // Fermer avec Escape
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    });
  }
  
  // Configurer le drag & drop pour réorganiser les sections
  function setupSectionDragAndDrop(modal) {
    let draggedElement = null;
    let draggedSectionName = null;
    
    // Drag start
    modal.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.section-modal-item[draggable="true"]');
      if (!item) return;
      
      draggedElement = item;
      draggedSectionName = item.getAttribute('data-section-name');
      
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', item.innerHTML);
    });
    
    // Drag over - permettre le drop
    modal.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const item = e.target.closest('.section-modal-item[draggable="true"]');
      if (!item || item === draggedElement) return;
      
      // Ajouter une classe pour indiquer où on peut déposer
      const afterElement = getDragAfterElement(modal, e.clientY);
      const dragging = modal.querySelector('.dragging');
      
      if (dragging) {
        const sectionsList = modal.querySelector('.sections-list');
        if (sectionsList) {
          if (afterElement == null) {
            sectionsList.appendChild(dragging);
          } else {
            sectionsList.insertBefore(dragging, afterElement);
          }
        }
      }
    });
    
    // Drag end
    modal.addEventListener('dragend', (e) => {
      const item = e.target.closest('.section-modal-item');
      if (item) {
        item.classList.remove('dragging');
      }
      draggedElement = null;
      draggedSectionName = null;
    });
    
    // Drop - réorganiser les sections dans le DOM
    modal.addEventListener('drop', (e) => {
      e.preventDefault();
      
      if (!draggedElement || !draggedSectionName) return;
      
      const dropTarget = e.target.closest('.section-modal-item[draggable="true"]');
      if (!dropTarget || dropTarget === draggedElement) return;
      
      const targetSectionName = dropTarget.getAttribute('data-section-name');
      if (!targetSectionName || targetSectionName === draggedSectionName) return;
      
      // Réorganiser les sections dans le DOM réel
      reorderSections(draggedSectionName, targetSectionName);
      
      // Rafraîchir le panel Layers
      setTimeout(() => {
        openSectionsModal();
      }, 100);
    });
    
    // Fonction pour déterminer où insérer l'élément pendant le drag
    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.section-modal-item[draggable="true"]:not(.dragging)')];
      
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
  }
  
  // Réorganiser les sections dans le DOM
  function reorderSections(sourceSectionName, targetSectionName) {
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) return;
    
    // Trouver les éléments source (h2 et son contenu)
    let sourceH2 = pdfPreview.querySelector(`h2[data-section="${sourceSectionName}"]`);
    let sourceContent = pdfPreview.querySelector(`[data-section-content="${sourceSectionName}"]`);
    
    // Si sourceSectionName correspond à un data-section-content, trouver le h2 correspondant
    if (!sourceH2 && sourceContent) {
      const sectionName = sourceContent.getAttribute('data-section-content');
      sourceH2 = pdfPreview.querySelector(`h2[data-section="${sectionName}"]`);
      sourceSectionName = sectionName;
    }
    
    // Trouver les éléments target (h2 et son contenu)
    let targetH2 = pdfPreview.querySelector(`h2[data-section="${targetSectionName}"]`);
    let targetContent = pdfPreview.querySelector(`[data-section-content="${targetSectionName}"]`);
    
    // Si targetSectionName correspond à un data-section-content, trouver le h2 correspondant
    if (!targetH2 && targetContent) {
      const sectionName = targetContent.getAttribute('data-section-content');
      targetH2 = pdfPreview.querySelector(`h2[data-section="${sectionName}"]`);
      targetSectionName = sectionName;
    }
    
    if (!sourceH2 || !sourceContent || !targetH2 || !targetContent) {
      console.warn('Impossible de trouver les sections pour réorganisation:', sourceSectionName, targetSectionName);
      return;
    }
    
    // Déterminer la position relative
    const sourceIndex = Array.from(pdfPreview.children).indexOf(sourceH2);
    const targetIndex = Array.from(pdfPreview.children).indexOf(targetH2);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    // Si on déplace vers le bas, insérer après le targetContent
    // Si on déplace vers le haut, insérer avant le targetH2
    if (sourceIndex < targetIndex) {
      // Déplacer vers le bas - insérer après le targetContent
      if (targetContent.nextSibling) {
        pdfPreview.insertBefore(sourceH2, targetContent.nextSibling);
        pdfPreview.insertBefore(sourceContent, sourceH2.nextSibling);
      } else {
        pdfPreview.appendChild(sourceH2);
        pdfPreview.appendChild(sourceContent);
      }
    } else {
      // Déplacer vers le haut - insérer avant le targetH2
      pdfPreview.insertBefore(sourceH2, targetH2);
      pdfPreview.insertBefore(sourceContent, sourceH2.nextSibling);
    }
    
    // Sauvegarder l'ordre dans sessionStorage
    const sections = Array.from(pdfPreview.querySelectorAll('h2[data-section]'));
    const sectionOrder = sections.map(h2 => h2.getAttribute('data-section'));
    sessionStorage.setItem('sectionOrder', JSON.stringify(sectionOrder));
    
    console.log('✅ Sections réorganisées:', sourceSectionName, '→', targetSectionName);
  }
  
  // Configurer le drag & drop pour les sections dans la preview
  function setupPreviewSectionDragAndDrop() {
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) {
      setTimeout(setupPreviewSectionDragAndDrop, 100);
      return;
    }
    
    let draggedSection = null;
    let draggedSectionName = null;
    
    // Fonction pour rendre une section draggable
    const makeSectionDraggable = (h2Element) => {
      if (!h2Element || !h2Element.hasAttribute('data-section')) return;
      
      const sectionName = h2Element.getAttribute('data-section');
      h2Element.setAttribute('draggable', 'true');
      h2Element.classList.add('section-draggable');
      
      // Ajouter un indicateur visuel
      if (!h2Element.querySelector('.section-drag-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'section-drag-indicator';
        indicator.innerHTML = '⋮⋮';
        indicator.title = 'Glisser pour réorganiser';
        h2Element.appendChild(indicator);
      }
      
      // Drag start
      h2Element.addEventListener('dragstart', (e) => {
        draggedSection = h2Element;
        draggedSectionName = sectionName;
        h2Element.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', h2Element.innerHTML);
      });
      
      // Drag end
      h2Element.addEventListener('dragend', (e) => {
        h2Element.classList.remove('dragging');
        draggedSection = null;
        draggedSectionName = null;
      });
    };
    
    // Rendre toutes les sections draggables
    const makeAllSectionsDraggable = () => {
      const sections = pdfPreview.querySelectorAll('h2[data-section]');
      sections.forEach(h2 => {
        makeSectionDraggable(h2);
      });
    };
    
    // Observer les changements dans le DOM pour rendre les nouvelles sections draggables
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'H2' && node.hasAttribute('data-section')) {
              makeSectionDraggable(node);
            }
            // Vérifier aussi les enfants
            const newSections = node.querySelectorAll && node.querySelectorAll('h2[data-section]');
            if (newSections) {
              newSections.forEach(h2 => makeSectionDraggable(h2));
            }
          }
        });
      });
    });
    
    observer.observe(pdfPreview, { childList: true, subtree: true });
    
    // Initialiser les sections existantes
    makeAllSectionsDraggable();
    
    // Gérer le drop sur les sections
    pdfPreview.addEventListener('dragover', (e) => {
      const targetH2 = e.target.closest('h2[data-section]');
      if (!targetH2 || targetH2 === draggedSection) {
        e.preventDefault();
        return;
      }
      
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      // Ajouter un indicateur visuel de drop
      const allSections = pdfPreview.querySelectorAll('h2[data-section]');
      allSections.forEach(h2 => h2.classList.remove('drop-target'));
      targetH2.classList.add('drop-target');
    });
    
    pdfPreview.addEventListener('dragleave', (e) => {
      if (!pdfPreview.contains(e.relatedTarget)) {
        const allSections = pdfPreview.querySelectorAll('h2[data-section]');
        allSections.forEach(h2 => h2.classList.remove('drop-target'));
      }
    });
    
    pdfPreview.addEventListener('drop', (e) => {
      e.preventDefault();
      
      const targetH2 = e.target.closest('h2[data-section]');
      if (!targetH2 || !draggedSection || targetH2 === draggedSection) {
        const allSections = pdfPreview.querySelectorAll('h2[data-section]');
        allSections.forEach(h2 => h2.classList.remove('drop-target'));
        return;
      }
      
      const targetSectionName = targetH2.getAttribute('data-section');
      if (!targetSectionName || targetSectionName === draggedSectionName) {
        const allSections = pdfPreview.querySelectorAll('h2[data-section]');
        allSections.forEach(h2 => h2.classList.remove('drop-target'));
        return;
      }
      
      // Réorganiser les sections
      reorderSections(draggedSectionName, targetSectionName);
      
      // Retirer les classes de drop
      const allSections = pdfPreview.querySelectorAll('h2[data-section]');
      allSections.forEach(h2 => h2.classList.remove('drop-target'));
      
      // Rafraîchir le panel Layers
      setTimeout(() => {
        openSectionsModal();
      }, 100);
    });
  }
  
  function addSection(sectionName) {
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview || !window.currentPdfContent) return;
    
    const sectionConfig = {
      'caracteristiques': {
        title: '🌿 Caractéristiques',
        content: '<ul><li>Aucune caractéristique disponible</li></ul>',
        dataContent: 'caracteristiques'
      },
      'consommation': {
        title: '🍴 3 Façons de le Consommer',
        content: '<ul><li>Aucune suggestion disponible</li></ul>',
        dataContent: 'consommation'
      },
      'recettes': {
        title: '👨‍🍳 Idées Recettes',
        content: '<p>Aucune recette disponible</p>',
        dataContent: 'recettes'
      }
    };
    
    const config = sectionConfig[sectionName];
    if (!config) return;
    
    // Vérifier si la section existe déjà
    const existingSection = pdfPreview.querySelector(`[data-section="${sectionName}"]`);
    if (existingSection) {
      showSection(existingSection);
      return;
    }
    
    // Trouver où insérer la section (après la dernière section existante)
    const allSections = Array.from(pdfPreview.querySelectorAll('[data-section]'));
    let insertAfter = pdfPreview.querySelector('.header-content');
    
    if (allSections.length > 0) {
      const lastSection = allSections[allSections.length - 1];
      const lastSectionDataSection = lastSection.getAttribute('data-section');
      const lastSectionContent = pdfPreview.querySelector(`[data-section-content="${lastSectionDataSection}"]`);
      insertAfter = lastSectionContent || lastSection;
    }
    
    // Créer les éléments de la section
    const sectionTitle = document.createElement('h2');
    sectionTitle.setAttribute('data-section', sectionName);
    sectionTitle.setAttribute('data-editable', 'section');
    sectionTitle.setAttribute('data-editable-type', 'section');
    sectionTitle.innerHTML = `<span class="emoji">${config.title.split(' ')[0]}</span> ${config.title.substring(config.title.indexOf(' ') + 1)}`;
    
    const sectionContent = document.createElement(sectionName === 'recettes' ? 'div' : 'ul');
    sectionContent.setAttribute('data-section-content', config.dataContent);
    sectionContent.innerHTML = config.content;
    
    // Insérer après l'élément de référence
    if (insertAfter && insertAfter.nextSibling) {
      pdfPreview.insertBefore(sectionTitle, insertAfter.nextSibling);
      pdfPreview.insertBefore(sectionContent, sectionTitle.nextSibling);
    } else {
      pdfPreview.appendChild(sectionTitle);
      pdfPreview.appendChild(sectionContent);
    }
    
    console.log(`✅ Section "${sectionName}" ajoutée`);
  }

  // Exposer les fonctions globalement
  window.openFigmaPanel = openPanelForElement;
  window.closeFigmaPanel = closePanel;
  window.hideSection = hideSection;
  window.showSection = showSection;
  window.openSectionsModal = openSectionsModal;

  // Initialiser quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();

