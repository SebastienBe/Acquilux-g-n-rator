// ========================================
// SYSTÈME DE STYLES RÉUTILISABLES - Style Figma
// ========================================

(function() {
  'use strict';

  // Stockage des styles (localStorage)
  const STYLES_STORAGE_KEY = 'figmaTextStyles';
  const COLOR_STYLES_STORAGE_KEY = 'figmaColorStyles';

  // Styles de texte réutilisables
  let textStyles = [];
  let colorStyles = [];

  // Charger les styles depuis localStorage
  function loadStyles() {
    try {
      const savedTextStyles = localStorage.getItem(STYLES_STORAGE_KEY);
      if (savedTextStyles) {
        textStyles = JSON.parse(savedTextStyles);
      } else {
        // Styles par défaut
        textStyles = [
          {
            id: 'title-style',
            name: 'Titre Principal',
            fontSize: '1.4rem',
            fontWeight: '900',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            textTransform: 'none'
          },
          {
            id: 'slogan-style',
            name: 'Slogan',
            fontSize: '0.75rem',
            fontWeight: '400',
            lineHeight: '1.4',
            letterSpacing: '-0.01em',
            color: '#FFFFFF',
            textTransform: 'none'
          },
          {
            id: 'section-style',
            name: 'Section',
            fontSize: '0.75rem',
            fontWeight: '700',
            lineHeight: '1.2',
            letterSpacing: '0.3px',
            color: '#2C2E2D',
            textTransform: 'uppercase'
          },
          {
            id: 'body-style',
            name: 'Corps de texte',
            fontSize: '0.72rem',
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '-0.01em',
            color: '#2C2E2D',
            textTransform: 'none'
          }
        ];
      }

      const savedColorStyles = localStorage.getItem(COLOR_STYLES_STORAGE_KEY);
      if (savedColorStyles) {
        colorStyles = JSON.parse(savedColorStyles);
      } else {
        // Couleurs par défaut du projet
        colorStyles = [
          { id: 'primary', name: 'Orange Otera', value: '#E65B0C' },
          { id: 'secondary', name: 'Beige clair', value: '#F6E2BE' },
          { id: 'text', name: 'Texte', value: '#2C2E2D' },
          { id: 'accent', name: 'Accent', value: '#60191A' }
        ];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des styles:', error);
      textStyles = [];
      colorStyles = [];
    }
  }

  // Sauvegarder les styles
  function saveTextStyles() {
    try {
      localStorage.setItem(STYLES_STORAGE_KEY, JSON.stringify(textStyles));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des styles de texte:', error);
    }
  }

  function saveColorStyles() {
    try {
      localStorage.setItem(COLOR_STYLES_STORAGE_KEY, JSON.stringify(colorStyles));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des styles de couleur:', error);
    }
  }

  // Créer un style de texte
  function createTextStyle(name, properties) {
    const id = `text-style-${Date.now()}`;
    const style = {
      id,
      name,
      ...properties
    };
    textStyles.push(style);
    saveTextStyles();
    return style;
  }

  // Mettre à jour un style de texte
  function updateTextStyle(styleId, properties) {
    const index = textStyles.findIndex(s => s.id === styleId);
    if (index > -1) {
      textStyles[index] = { ...textStyles[index], ...properties };
      saveTextStyles();
      
      // Appliquer le style à tous les éléments qui l'utilisent
      applyTextStyleToElements(styleId);
      return textStyles[index];
    }
    return null;
  }

  // Supprimer un style de texte
  function deleteTextStyle(styleId) {
    textStyles = textStyles.filter(s => s.id !== styleId);
    saveTextStyles();
  }

  // Appliquer un style de texte à un élément
  function applyTextStyleToElement(element, styleId) {
    const style = textStyles.find(s => s.id === styleId);
    if (!style || !element) return false;

    if (style.fontSize) element.style.fontSize = style.fontSize;
    if (style.fontWeight) element.style.fontWeight = style.fontWeight;
    if (style.lineHeight) element.style.lineHeight = style.lineHeight;
    if (style.letterSpacing) element.style.letterSpacing = style.letterSpacing;
    if (style.color) element.style.color = style.color;
    if (style.textTransform) element.style.textTransform = style.textTransform;
    if (style.textDecoration) element.style.textDecoration = style.textDecoration;
    if (style.textAlign) element.style.textAlign = style.textAlign;
    if (style.fontStyle) element.style.fontStyle = style.fontStyle;

    // Marquer l'élément avec le style utilisé
    element.setAttribute('data-text-style', styleId);

    return true;
  }

  // Appliquer un style à tous les éléments qui l'utilisent
  function applyTextStyleToElements(styleId) {
    const elements = document.querySelectorAll(`[data-text-style="${styleId}"]`);
    elements.forEach(el => {
      applyTextStyleToElement(el, styleId);
    });
  }

  // Créer un style de couleur
  function createColorStyle(name, value) {
    const id = `color-style-${Date.now()}`;
    const style = {
      id,
      name,
      value
    };
    colorStyles.push(style);
    saveColorStyles();
    return style;
  }

  // Mettre à jour un style de couleur
  function updateColorStyle(styleId, value) {
    const index = colorStyles.findIndex(s => s.id === styleId);
    if (index > -1) {
      colorStyles[index].value = value;
      saveColorStyles();
      
      // Appliquer la couleur à tous les éléments qui l'utilisent
      applyColorStyleToElements(styleId);
      return colorStyles[index];
    }
    return null;
  }

  // Appliquer un style de couleur à un élément
  function applyColorStyleToElement(element, styleId, property = 'color') {
    const style = colorStyles.find(s => s.id === styleId);
    if (!style || !element) return false;

    element.style[property] = style.value;
    element.setAttribute(`data-color-style-${property}`, styleId);

    return true;
  }

  // Appliquer une couleur à tous les éléments qui l'utilisent
  function applyColorStyleToElements(styleId) {
    const elements = document.querySelectorAll(`[data-color-style-color="${styleId}"], [data-color-style-backgroundColor="${styleId}"]`);
    elements.forEach(el => {
      const colorStyleId = el.getAttribute('data-color-style-color') || el.getAttribute('data-color-style-backgroundColor');
      if (colorStyleId === styleId) {
        const property = el.hasAttribute('data-color-style-color') ? 'color' : 'backgroundColor';
        applyColorStyleToElement(el, styleId, property);
      }
    });
  }

  // Créer le panel de gestion des styles
  function createStylesPanel() {
    loadStyles();

    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📝</span>
          <h3>Text Styles</h3>
          <button class="figma-icon-btn" id="addTextStyleBtn" title="Créer un style de texte">+</button>
        </div>
        
        <div class="figma-styles-list" id="textStylesList">
          ${textStyles.map(style => `
            <div class="figma-style-item" data-style-id="${style.id}">
              <div class="figma-style-preview" style="font-size: ${style.fontSize}; font-weight: ${style.fontWeight}; color: ${style.color};">
                ${style.name}
              </div>
              <button class="figma-style-apply" data-style-id="${style.id}" title="Appliquer">✓</button>
              <button class="figma-style-edit" data-style-id="${style.id}" title="Modifier">✎</button>
              <button class="figma-style-delete" data-style-id="${style.id}" title="Supprimer">×</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">🎨</span>
          <h3>Color Styles</h3>
          <button class="figma-icon-btn" id="addColorStyleBtn" title="Créer un style de couleur">+</button>
        </div>
        
        <div class="figma-styles-list" id="colorStylesList">
          ${colorStyles.map(style => `
            <div class="figma-style-item" data-color-style-id="${style.id}">
              <div class="figma-style-preview">
                <span class="figma-color-swatch" style="background-color: ${style.value};"></span>
                <span>${style.name}</span>
              </div>
              <button class="figma-style-apply" data-color-style-id="${style.id}" title="Appliquer">✓</button>
              <button class="figma-style-edit" data-color-style-id="${style.id}" title="Modifier">✎</button>
              <button class="figma-style-delete" data-color-style-id="${style.id}" title="Supprimer">×</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Attacher les événements du panel de styles
  function attachStylesEvents(panel) {
    // Créer un style de texte
    const addTextStyleBtn = panel.querySelector('#addTextStyleBtn');
    if (addTextStyleBtn) {
      addTextStyleBtn.addEventListener('click', () => {
        const name = prompt('Nom du style de texte:');
        if (name) {
          const element = window.currentElement || document.querySelector('[data-editable]');
          if (element) {
            const computedStyle = window.getComputedStyle(element);
            const style = createTextStyle(name, {
              fontSize: computedStyle.fontSize,
              fontWeight: computedStyle.fontWeight,
              lineHeight: computedStyle.lineHeight,
              letterSpacing: computedStyle.letterSpacing,
              color: computedStyle.color,
              textTransform: computedStyle.textTransform,
              textDecoration: computedStyle.textDecoration,
              textAlign: computedStyle.textAlign,
              fontStyle: computedStyle.fontStyle
            });
            // Rafraîchir le panel
            if (window.refreshStylesPanel) {
              window.refreshStylesPanel();
            }
          }
        }
      });
    }

    // Appliquer un style de texte
    panel.querySelectorAll('.figma-style-apply[data-style-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const styleId = e.currentTarget.dataset.styleId;
        const element = window.currentElement;
        if (element && styleId) {
          applyTextStyleToElement(element, styleId);
        }
      });
    });

    // Modifier un style de texte
    panel.querySelectorAll('.figma-style-edit[data-style-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const styleId = e.currentTarget.dataset.styleId;
        // Ouvrir un panel d'édition (simplifié ici)
        const style = textStyles.find(s => s.id === styleId);
        if (style) {
          const newName = prompt('Nouveau nom:', style.name);
          if (newName) {
            updateTextStyle(styleId, { name: newName });
            if (window.refreshStylesPanel) {
              window.refreshStylesPanel();
            }
          }
        }
      });
    });

    // Supprimer un style de texte
    panel.querySelectorAll('.figma-style-delete[data-style-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const styleId = e.currentTarget.dataset.styleId;
        if (confirm('Supprimer ce style ?')) {
          deleteTextStyle(styleId);
          if (window.refreshStylesPanel) {
            window.refreshStylesPanel();
          }
        }
      });
    });

    // Créer un style de couleur
    const addColorStyleBtn = panel.querySelector('#addColorStyleBtn');
    if (addColorStyleBtn) {
      addColorStyleBtn.addEventListener('click', () => {
        const name = prompt('Nom du style de couleur:');
        if (name) {
          const element = window.currentElement || document.querySelector('[data-editable]');
          if (element) {
            const computedStyle = window.getComputedStyle(element);
            const color = computedStyle.color || '#000000';
            createColorStyle(name, color);
            if (window.refreshStylesPanel) {
              window.refreshStylesPanel();
            }
          }
        }
      });
    }

    // Appliquer un style de couleur
    panel.querySelectorAll('.figma-style-apply[data-color-style-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const styleId = e.currentTarget.dataset.colorStyleId;
        const element = window.currentElement;
        if (element && styleId) {
          applyColorStyleToElement(element, styleId, 'color');
        }
      });
    });
  }

  // Exposer les fonctions globalement
  window.createTextStyle = createTextStyle;
  window.updateTextStyle = updateTextStyle;
  window.deleteTextStyle = deleteTextStyle;
  window.applyTextStyleToElement = applyTextStyleToElement;
  window.createColorStyle = createColorStyle;
  window.updateColorStyle = updateColorStyle;
  window.applyColorStyleToElement = applyColorStyleToElement;
  window.createStylesPanel = createStylesPanel;
  window.attachStylesEvents = attachStylesEvents;
  window.loadStyles = loadStyles;
  window.getTextStyles = () => textStyles;
  window.getColorStyles = () => colorStyles;

  // Initialiser au chargement
  loadStyles();
})();







