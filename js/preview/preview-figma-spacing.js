// ========================================
// SYSTÈME DE PADDING/MARGIN AVANCÉ - Style Figma
// ========================================

(function() {
  'use strict';

  // Créer le panel de spacing avancé (padding/margin)
  function createAdvancedSpacingPanel(element) {
    // Ne pas créer le panel de spacing pour les badges (ils utilisent leur propre système)
    if (element && (element.classList.contains('badge-instance') || element.getAttribute('data-editable-type') === 'badge')) {
      return ''; // Retourner une chaîne vide pour ne pas afficher le panel de spacing
    }
    
    if (!element) {
      console.warn('createAdvancedSpacingPanel: element manquant');
      return '';
    }
    
    const computedStyle = window.getComputedStyle(element);
    
    // Extraire les valeurs actuelles
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    
    const marginTop = parseFloat(computedStyle.marginTop) || 0;
    const marginRight = parseFloat(computedStyle.marginRight) || 0;
    const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
    const marginLeft = parseFloat(computedStyle.marginLeft) || 0;
    
    // Vérifier si les valeurs sont liées
    const paddingLinked = (paddingTop === paddingRight && paddingRight === paddingBottom && paddingBottom === paddingLeft);
    const marginLinked = (marginTop === marginRight && marginRight === marginBottom && marginBottom === marginLeft);

    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📐</span>
          <h3>Padding</h3>
        </div>
        
        <!-- Padding avec contrôles individuels -->
        <div class="figma-spacing-controls">
          <div class="figma-spacing-row">
            <div class="figma-spacing-input-group">
              <label class="figma-label">T</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelPaddingTop" class="figma-number-input" value="${Math.round(paddingTop)}" step="1">
                <span class="figma-unit">px</span>
              </div>
              <button class="figma-spacing-arrow" data-direction="up" data-property="paddingTop">▲</button>
              <button class="figma-spacing-arrow" data-direction="down" data-property="paddingTop">▼</button>
            </div>
          </div>
          
          <div class="figma-spacing-row">
            <div class="figma-spacing-input-group">
              <label class="figma-label">R</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelPaddingRight" class="figma-number-input" value="${Math.round(paddingRight)}" step="1">
                <span class="figma-unit">px</span>
              </div>
              <button class="figma-spacing-arrow" data-direction="up" data-property="paddingRight">▲</button>
              <button class="figma-spacing-arrow" data-direction="down" data-property="paddingRight">▼</button>
            </div>
            <button class="figma-link-btn ${paddingLinked ? 'active' : ''}" id="panelPaddingLink" title="Lier les valeurs">
              <span class="link-icon">🔗</span>
            </button>
            <div class="figma-spacing-input-group">
              <label class="figma-label">L</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelPaddingLeft" class="figma-number-input" value="${Math.round(paddingLeft)}" step="1">
                <span class="figma-unit">px</span>
              </div>
              <button class="figma-spacing-arrow" data-direction="up" data-property="paddingLeft">▲</button>
              <button class="figma-spacing-arrow" data-direction="down" data-property="paddingLeft">▼</button>
            </div>
          </div>
          
          <div class="figma-spacing-row">
            <div class="figma-spacing-input-group">
              <label class="figma-label">B</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelPaddingBottom" class="figma-number-input" value="${Math.round(paddingBottom)}" step="1">
                <span class="figma-unit">px</span>
              </div>
              <button class="figma-spacing-arrow" data-direction="up" data-property="paddingBottom">▲</button>
              <button class="figma-spacing-arrow" data-direction="down" data-property="paddingBottom">▼</button>
            </div>
          </div>
        </div>
      </div>

      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">↔</span>
          <h3>Margin</h3>
        </div>
        
        <!-- Margin avec contrôles individuels -->
        <div class="figma-spacing-controls">
          <div class="figma-spacing-row">
            <div class="figma-spacing-input-group">
              <label class="figma-label">T</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelMarginTop" class="figma-number-input" value="${Math.round(marginTop)}" step="1">
                <span class="figma-unit">px</span>
              </div>
              <button class="figma-spacing-arrow" data-direction="up" data-property="marginTop">▲</button>
              <button class="figma-spacing-arrow" data-direction="down" data-property="marginTop">▼</button>
            </div>
          </div>
          
          <div class="figma-spacing-row">
            <div class="figma-spacing-input-group">
              <label class="figma-label">R</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelMarginRight" class="figma-number-input" value="${Math.round(marginRight)}" step="1">
                <span class="figma-unit">px</span>
              </div>
              <button class="figma-spacing-arrow" data-direction="up" data-property="marginRight">▲</button>
              <button class="figma-spacing-arrow" data-direction="down" data-property="marginRight">▼</button>
            </div>
            <button class="figma-link-btn ${marginLinked ? 'active' : ''}" id="panelMarginLink" title="Lier les valeurs">
              <span class="link-icon">🔗</span>
            </button>
            <div class="figma-spacing-input-group">
              <label class="figma-label">L</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelMarginLeft" class="figma-number-input" value="${Math.round(marginLeft)}" step="1">
                <span class="figma-unit">px</span>
              </div>
              <button class="figma-spacing-arrow" data-direction="up" data-property="marginLeft">▲</button>
              <button class="figma-spacing-arrow" data-direction="down" data-property="marginLeft">▼</button>
            </div>
          </div>
          
          <div class="figma-spacing-row">
            <div class="figma-spacing-input-group">
              <label class="figma-label">B</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelMarginBottom" class="figma-number-input" value="${Math.round(marginBottom)}" step="1">
                <span class="figma-unit">px</span>
              </div>
              <button class="figma-spacing-arrow" data-direction="up" data-property="marginBottom">▲</button>
              <button class="figma-spacing-arrow" data-direction="down" data-property="marginBottom">▼</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Attacher les événements de spacing
  function attachSpacingEvents(panel, element) {
    if (!panel || !element) {
      console.warn('attachSpacingEvents: panel ou element manquant', { panel, element });
      return;
    }
    
    // Ne pas appliquer le spacing aux badges (ils utilisent leur propre système de positionnement)
    if (element.classList.contains('badge-instance') || element.getAttribute('data-editable-type') === 'badge') {
      console.log('Spacing ignoré pour badge (utilise son propre système de positionnement)');
      return;
    }
    
    let paddingLinked = panel.querySelector('#panelPaddingLink')?.classList.contains('active') || false;
    let marginLinked = panel.querySelector('#panelMarginLink')?.classList.contains('active') || false;

    // Toggle lien padding
    const paddingLinkBtn = panel.querySelector('#panelPaddingLink');
    if (paddingLinkBtn) {
      paddingLinkBtn.addEventListener('click', () => {
        paddingLinked = !paddingLinked;
        paddingLinkBtn.classList.toggle('active', paddingLinked);
      });
    }

    // Toggle lien margin
    const marginLinkBtn = panel.querySelector('#panelMarginLink');
    if (marginLinkBtn) {
      marginLinkBtn.addEventListener('click', () => {
        marginLinked = !marginLinked;
        marginLinkBtn.classList.toggle('active', marginLinked);
      });
    }

    // Inputs padding
    const paddingInputs = {
      top: panel.querySelector('#panelPaddingTop'),
      right: panel.querySelector('#panelPaddingRight'),
      bottom: panel.querySelector('#panelPaddingBottom'),
      left: panel.querySelector('#panelPaddingLeft')
    };

    Object.keys(paddingInputs).forEach(side => {
      const input = paddingInputs[side];
      if (input) {
        input.addEventListener('input', (e) => {
          const value = parseInt(e.target.value) || 0;
          applyPadding(element, side, value, paddingLinked, paddingInputs);
        });
      }
    });

    // Inputs margin
    const marginInputs = {
      top: panel.querySelector('#panelMarginTop'),
      right: panel.querySelector('#panelMarginRight'),
      bottom: panel.querySelector('#panelMarginBottom'),
      left: panel.querySelector('#panelMarginLeft')
    };

    Object.keys(marginInputs).forEach(side => {
      const input = marginInputs[side];
      if (input) {
        input.addEventListener('input', (e) => {
          const value = parseInt(e.target.value) || 0;
          applyMargin(element, side, value, marginLinked, marginInputs);
        });
      }
    });

    // Flèches de navigation
    panel.querySelectorAll('.figma-spacing-arrow').forEach(arrow => {
      arrow.addEventListener('click', (e) => {
        const direction = e.currentTarget.dataset.direction;
        const property = e.currentTarget.dataset.property;
        const isPadding = property.startsWith('padding');
        const side = property.replace(/^(padding|margin)/, '').toLowerCase();
        const inputs = isPadding ? paddingInputs : marginInputs;
        const input = inputs[side];
        
        if (input) {
          const currentValue = parseInt(input.value) || 0;
          const step = e.shiftKey ? 10 : 1;
          const newValue = direction === 'up' ? currentValue + step : currentValue - step;
          input.value = newValue;
          
          if (isPadding) {
            applyPadding(element, side, newValue, paddingLinked, paddingInputs);
          } else {
            applyMargin(element, side, newValue, marginLinked, marginInputs);
          }
        }
      });
    });
  }

  // Appliquer le padding
  function applyPadding(element, side, value, linked, inputs) {
    if (!element) {
      console.warn('applyPadding: element manquant');
      return;
    }
    
    // Convertir side en format CSS (top -> Top, etc.)
    const sideCapitalized = side.charAt(0).toUpperCase() + side.slice(1);
    const property = `padding${sideCapitalized}`;
    
    if (linked) {
      // Appliquer la même valeur à tous les côtés
      element.style.padding = `${value}px`;
      // Mettre à jour tous les inputs
      if (inputs) {
        Object.values(inputs).forEach(input => {
          if (input) input.value = value;
        });
      }
    } else {
      // Appliquer uniquement au côté spécifique
      element.style[property] = `${value}px`;
    }
    
    console.log(`Padding appliqué: ${property} = ${value}px`, element);
    
    // Sauvegarder dans l'historique si disponible
    if (window.saveToHistory) {
      try {
        const panelType = (window.currentPanel && window.currentPanel.dataset.panelType) || 'unknown';
        const computedStyle = window.getComputedStyle(element);
        const oldValue = parseFloat(computedStyle[property]) || 0;
        window.saveToHistory(element, panelType, property, oldValue, value);
      } catch (error) {
        console.warn('Erreur lors de la sauvegarde dans l\'historique:', error);
      }
    }
  }

  // Appliquer le margin
  function applyMargin(element, side, value, linked, inputs) {
    if (!element) {
      console.warn('applyMargin: element manquant');
      return;
    }
    
    // Convertir side en format CSS (top -> Top, etc.)
    const sideCapitalized = side.charAt(0).toUpperCase() + side.slice(1);
    const property = `margin${sideCapitalized}`;
    
    if (linked) {
      // Appliquer la même valeur à tous les côtés
      element.style.margin = `${value}px`;
      // Mettre à jour tous les inputs
      if (inputs) {
        Object.values(inputs).forEach(input => {
          if (input) input.value = value;
        });
      }
    } else {
      // Appliquer uniquement au côté spécifique
      element.style[property] = `${value}px`;
    }
    
    console.log(`Margin appliqué: ${property} = ${value}px`, element);
    
    // Sauvegarder dans l'historique si disponible
    if (window.saveToHistory) {
      try {
        const panelType = (window.currentPanel && window.currentPanel.dataset.panelType) || 'unknown';
        const computedStyle = window.getComputedStyle(element);
        const oldValue = parseFloat(computedStyle[property]) || 0;
        window.saveToHistory(element, panelType, property, oldValue, value);
      } catch (error) {
        console.warn('Erreur lors de la sauvegarde dans l\'historique:', error);
      }
    }
  }

  // Exposer les fonctions globalement
  window.createAdvancedSpacingPanel = createAdvancedSpacingPanel;
  window.attachSpacingEvents = attachSpacingEvents;
})();

