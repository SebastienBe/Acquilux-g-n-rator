// ========================================
// CORE - Système de base du panel Figma
// ========================================

(function() {
  'use strict';

  // Variables globales partagées
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
        // Ne pas ouvrir le panel pour les badges (ils utilisent leur propre système de gestion)
        const editableType = editableElement.getAttribute('data-editable-type');
        if (editableType === 'badge' || editableElement.classList.contains('badge-instance')) {
          return; // Ignorer les badges, ils ont leur propre système de gestion
        }
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

  // Ouvrir un panel pour un élément
  function openPanelForElement(element) {
    if (!element) return;

    // Support pour les éléments virtuels (comme pour openMainPanelBtn)
    let editableType = null;
    if (typeof element.getAttribute === 'function') {
      editableType = element.getAttribute('data-editable-type');
    } else if (element.getAttribute) {
      editableType = element.getAttribute('data-editable-type');
    }
    
    // Si pas de type, essayer de déterminer depuis l'élément réel
    if (!editableType) {
      const realElement = typeof element.closest === 'function' ? element.closest('[data-editable]') : element;
      if (realElement && realElement.getAttribute) {
        editableType = realElement.getAttribute('data-editable-type');
      }
    }
    
    // Ne pas ouvrir le panel pour les badges (ils utilisent leur propre système)
    if (editableType === 'badge') {
      return;
    }
    
    // Si toujours pas de type, essayer de déterminer depuis l'ID ou le tagName
    if (!editableType && element) {
      // Ne pas ouvrir le panel pour les badges détectés par classe
      if (element.classList && element.classList.contains('badge-instance')) {
        return;
      }
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
        if (window.createAndShowPanel) {
          window.createAndShowPanel(element, editableType);
        }
      }, 250);
    } else {
      if (window.createAndShowPanel) {
        window.createAndShowPanel(element, editableType);
      }
    }
  }

  // Créer un panel générique
  function createPanel(content, type, element) {
    if (!window.FigmaPanelHelpers) {
      console.error('FigmaPanelHelpers non disponible');
      return;
    }

    const panel = document.createElement('div');
    panel.className = 'figma-panel';
    panel.dataset.panelType = type;
    
    panel.innerHTML = `
      <div class="figma-panel-header">
        <div class="figma-panel-title">
          <span class="figma-panel-icon">${window.FigmaPanelHelpers.getIconForType(type)}</span>
          <span class="figma-panel-name">${window.FigmaPanelHelpers.getTitleForType(type)}</span>
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
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('🔴 Bouton fermeture cliqué');
        closePanel();
      }, true);
      
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
    window.currentPanel = panel;
    window.currentElement = element;
    
    // Attacher les événements après un court délai
    setTimeout(() => {
      // Utiliser FigmaPanelEvents si disponible, sinon fallback vers window
      if (window.FigmaPanelEvents && window.FigmaPanelEvents.attachPanelEvents) {
        window.FigmaPanelEvents.attachPanelEvents(panel, element, type);
      } else if (window.attachPanelEvents) {
        window.attachPanelEvents(panel, element, type);
      }
      // Attacher les autres événements si disponibles
      if (window.attachSpacingEvents && type !== 'badge') {
        window.attachSpacingEvents(panel, element);
      }
      if (window.attachTypographyEvents) {
        window.attachTypographyEvents(panel, element);
      }
      if (window.attachColorEvents) {
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
      if (window.attachBordersEvents) {
        window.attachBordersEvents(panel, element);
      }
      if (window.attachShadowsEvents) {
        window.attachShadowsEvents(panel, element);
      }
      if (window.attachBadgeEvents && type === 'badge') {
        window.attachBadgeEvents(panel, element);
      }
      if (window.attachStylesEvents && type === 'main') {
        window.attachStylesEvents(panel);
      }
      if (window.attachGridEvents && type === 'main') {
        window.attachGridEvents(panel);
      }
      if (window.attachExportEvents && type === 'main') {
        window.attachExportEvents(panel);
      }
      if (window.attachResponsiveEvents && type === 'main') {
        window.attachResponsiveEvents(panel);
      }
      if (window.attachBadgeSelectionEvents && type === 'main') {
        window.attachBadgeSelectionEvents(panel);
      }
      if (window.attachBadgeConfigEvents && type === 'main') {
        window.attachBadgeConfigEvents(panel);
      }
      if (type === 'image') {
        if (window.FigmaPanelEvents && window.FigmaPanelEvents.attachImagePanelEvents) {
          window.FigmaPanelEvents.attachImagePanelEvents(panel, element);
        } else if (window.attachImagePanelEvents) {
          window.attachImagePanelEvents(panel, element);
        }
      }
    }, 50);
    
    // Animation d'ouverture
    setTimeout(() => {
      panel.classList.add('active');
    }, 10);
  }

  // Fermer le panel
  function closePanel() {
    console.log('🔴 closePanel appelé, currentPanel:', currentPanel);
    if (currentPanel) {
      currentPanel.classList.remove('active');
      const panelToRemove = currentPanel;
      currentPanel = null;
      currentElement = null;
      window.currentPanel = null;
      window.currentElement = null;
      
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

  // Fonction pour créer et afficher le panel
  function createAndShowPanel(element, editableType) {
    let panelContent = '';
    
    if (window.FigmaPanelCreators) {
      switch (editableType) {
        case 'title':
          panelContent = window.FigmaPanelCreators.createTitlePanel(element);
          break;
        case 'slogan':
          panelContent = window.FigmaPanelCreators.createSloganPanel(element);
          break;
        case 'section':
          panelContent = window.FigmaPanelCreators.createSectionPanel(element);
          break;
        case 'list-item':
          panelContent = window.FigmaPanelCreators.createListItemPanel(element);
          break;
        case 'recipe':
          panelContent = window.FigmaPanelCreators.createRecipePanel(element);
          break;
        case 'main':
          panelContent = window.FigmaPanelCreators.createMainPanel(element);
          break;
        case 'image':
          panelContent = window.FigmaPanelCreators.createImagePanel(element);
          break;
        default:
          panelContent = window.FigmaPanelCreators.createDefaultPanel(element);
      }
    } else {
      // Fallback vers les fonctions globales si disponible
      if (typeof createTitlePanel === 'function') {
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
      }
    }

    // Créer et afficher le panel
    createPanel(panelContent, editableType, element);
  }

  // Exposer les fonctions globalement
  window.FigmaPanelCore = {
    init,
    createPanel,
    closePanel,
    openPanelForElement,
    saveToHistory,
    createAndShowPanel,
    getCurrentPanel: () => currentPanel,
    getCurrentElement: () => currentElement,
    getPanelContainer: () => panelContainer
  };

  // Exposer saveToHistory globalement pour compatibilité
  window.saveToHistory = saveToHistory;

  // Exposer la fonction pour ouvrir le panel principal
  window.openMainPanel = function() {
    const pdfPreview = document.getElementById('pdfPreview');
    if (pdfPreview) {
      const virtualElement = {
        getAttribute: (attr) => attr === 'data-editable-type' ? 'main' : null,
        closest: () => pdfPreview
      };
      openPanelForElement(virtualElement);
    }
  };

  // Exposer openPanelForElement globalement
  window.openPanelForElement = openPanelForElement;
  window.closeFigmaPanel = closePanel;
  window.createAndShowPanel = createAndShowPanel;
})();
