// ========================================
// SYSTÈME DE BORDURES ET OMBRES - Style Figma
// ========================================

(function() {
  'use strict';

  // Créer le panel de bordures avancé
  function createAdvancedBordersPanel(element) {
    const computedStyle = window.getComputedStyle(element);
    
    // Extraire les valeurs de border
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
    const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderStyle = computedStyle.borderTopStyle || 'none';
    const borderColor = computedStyle.borderTopColor || '#000000';
    
    // Extraire les valeurs de border-radius
    const borderRadiusTopLeft = parseFloat(computedStyle.borderTopLeftRadius) || 0;
    const borderRadiusTopRight = parseFloat(computedStyle.borderTopRightRadius) || 0;
    const borderRadiusBottomRight = parseFloat(computedStyle.borderBottomRightRadius) || 0;
    const borderRadiusBottomLeft = parseFloat(computedStyle.borderBottomLeftRadius) || 0;
    
    // Vérifier si les valeurs sont liées
    const borderLinked = (borderTop === borderRight && borderRight === borderBottom && borderBottom === borderLeft);
    const borderRadiusLinked = (borderRadiusTopLeft === borderRadiusTopRight && 
                                borderRadiusTopRight === borderRadiusBottomRight && 
                                borderRadiusBottomRight === borderRadiusBottomLeft);

    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">▢</span>
          <h3>Border</h3>
        </div>
        
        <!-- Border Width -->
        <div class="figma-spacing-controls">
          <div class="figma-spacing-row">
            <div class="figma-spacing-input-group">
              <label class="figma-label">T</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelBorderTop" class="figma-number-input" value="${Math.round(borderTop)}" step="1" min="0">
                <span class="figma-unit">px</span>
              </div>
            </div>
          </div>
          
          <div class="figma-spacing-row">
            <div class="figma-spacing-input-group">
              <label class="figma-label">R</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelBorderRight" class="figma-number-input" value="${Math.round(borderRight)}" step="1" min="0">
                <span class="figma-unit">px</span>
              </div>
            </div>
            <button class="figma-link-btn ${borderLinked ? 'active' : ''}" id="panelBorderLink" title="Lier les valeurs">
              <span class="link-icon">🔗</span>
            </button>
            <div class="figma-spacing-input-group">
              <label class="figma-label">L</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelBorderLeft" class="figma-number-input" value="${Math.round(borderLeft)}" step="1" min="0">
                <span class="figma-unit">px</span>
              </div>
            </div>
          </div>
          
          <div class="figma-spacing-row">
            <div class="figma-spacing-input-group">
              <label class="figma-label">B</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelBorderBottom" class="figma-number-input" value="${Math.round(borderBottom)}" step="1" min="0">
                <span class="figma-unit">px</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Border Style -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Style</label>
            <select id="panelBorderStyle" class="figma-select">
              <option value="none" ${borderStyle === 'none' ? 'selected' : ''}>None</option>
              <option value="solid" ${borderStyle === 'solid' ? 'selected' : ''}>Solid</option>
              <option value="dashed" ${borderStyle === 'dashed' ? 'selected' : ''}>Dashed</option>
              <option value="dotted" ${borderStyle === 'dotted' ? 'selected' : ''}>Dotted</option>
            </select>
          </div>
        </div>

        <!-- Border Color -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Color</label>
            <div class="figma-color-wrapper">
              <input type="color" id="panelBorderColor" class="figma-color-input" value="${rgbToHex(borderColor)}">
              <input type="text" id="panelBorderColorText" class="figma-text-input" value="${rgbToHex(borderColor)}">
            </div>
          </div>
        </div>
      </div>

      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">○</span>
          <h3>Border Radius</h3>
        </div>
        
        <!-- Border Radius -->
        <div class="figma-spacing-controls">
          <div class="figma-spacing-row">
            <div class="figma-spacing-input-group">
              <label class="figma-label">TL</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelBorderRadiusTopLeft" class="figma-number-input" value="${Math.round(borderRadiusTopLeft)}" step="1" min="0">
                <span class="figma-unit">px</span>
              </div>
            </div>
            <div class="figma-spacing-input-group">
              <label class="figma-label">TR</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelBorderRadiusTopRight" class="figma-number-input" value="${Math.round(borderRadiusTopRight)}" step="1" min="0">
                <span class="figma-unit">px</span>
              </div>
            </div>
          </div>
          
          <div class="figma-spacing-row">
            <div class="figma-spacing-input-group">
              <label class="figma-label">BL</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelBorderRadiusBottomLeft" class="figma-number-input" value="${Math.round(borderRadiusBottomLeft)}" step="1" min="0">
                <span class="figma-unit">px</span>
              </div>
            </div>
            <button class="figma-link-btn ${borderRadiusLinked ? 'active' : ''}" id="panelBorderRadiusLink" title="Lier les valeurs">
              <span class="link-icon">🔗</span>
            </button>
            <div class="figma-spacing-input-group">
              <label class="figma-label">BR</label>
              <div class="figma-input-wrapper">
                <input type="number" id="panelBorderRadiusBottomRight" class="figma-number-input" value="${Math.round(borderRadiusBottomRight)}" step="1" min="0">
                <span class="figma-unit">px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Créer le panel d'ombres
  function createAdvancedShadowsPanel(element) {
    const computedStyle = window.getComputedStyle(element);
    const boxShadow = computedStyle.boxShadow || 'none';
    
    // Parser box-shadow (format: offsetX offsetY blur spread color)
    let shadowValues = {
      x: 0,
      y: 0,
      blur: 0,
      spread: 0,
      color: '#000000',
      opacity: 100
    };

    if (boxShadow !== 'none' && boxShadow) {
      const match = boxShadow.match(/([-\d.]+)px\s+([-\d.]+)px\s+([-\d.]+)px\s+([-\d.]+)px\s+(.+)/);
      if (match) {
        shadowValues.x = parseFloat(match[1]) || 0;
        shadowValues.y = parseFloat(match[2]) || 0;
        shadowValues.blur = parseFloat(match[3]) || 0;
        shadowValues.spread = parseFloat(match[4]) || 0;
        
        const colorMatch = match[5].match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (colorMatch) {
          shadowValues.color = `rgb(${colorMatch[1]}, ${colorMatch[2]}, ${colorMatch[3]})`;
          shadowValues.opacity = colorMatch[4] ? Math.round(parseFloat(colorMatch[4]) * 100) : 100;
        } else {
          shadowValues.color = match[5].trim();
        }
      }
    }

    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">💫</span>
          <h3>Box Shadow</h3>
        </div>
        
        <!-- Shadow X -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">X</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelShadowX" class="figma-number-input" value="${Math.round(shadowValues.x)}" step="1" min="-50" max="50">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>

        <!-- Shadow Y -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Y</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelShadowY" class="figma-number-input" value="${Math.round(shadowValues.y)}" step="1" min="-50" max="50">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>

        <!-- Shadow Blur -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Blur</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelShadowBlur" class="figma-number-input" value="${Math.round(shadowValues.blur)}" step="1" min="0" max="100">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>

        <!-- Shadow Spread -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Spread</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelShadowSpread" class="figma-number-input" value="${Math.round(shadowValues.spread)}" step="1" min="-50" max="50">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>

        <!-- Shadow Color -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Color</label>
            <div class="figma-color-wrapper">
              <input type="color" id="panelShadowColor" class="figma-color-input" value="${rgbToHex(shadowValues.color)}">
              <input type="text" id="panelShadowColorText" class="figma-text-input" value="${rgbToHex(shadowValues.color)}">
            </div>
          </div>
        </div>

        <!-- Shadow Opacity -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Opacity</label>
            <div class="figma-slider-wrapper">
              <input type="range" id="panelShadowOpacity" min="0" max="100" step="1" value="${shadowValues.opacity}" class="figma-slider">
              <span class="figma-slider-value" id="panelShadowOpacityValue">${shadowValues.opacity}%</span>
            </div>
          </div>
        </div>

        <!-- Toggle Shadow -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <button class="figma-action-btn" id="panelShadowToggle">
              ${boxShadow === 'none' ? 'Activer l\'ombre' : 'Désactiver l\'ombre'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Attacher les événements de bordures
  function attachBordersEvents(panel, element) {
    let borderLinked = panel.querySelector('#panelBorderLink')?.classList.contains('active') || false;
    let borderRadiusLinked = panel.querySelector('#panelBorderRadiusLink')?.classList.contains('active') || false;

    // Toggle lien border
    const borderLinkBtn = panel.querySelector('#panelBorderLink');
    if (borderLinkBtn) {
      borderLinkBtn.addEventListener('click', () => {
        borderLinked = !borderLinked;
        borderLinkBtn.classList.toggle('active', borderLinked);
      });
    }

    // Toggle lien border-radius
    const borderRadiusLinkBtn = panel.querySelector('#panelBorderRadiusLink');
    if (borderRadiusLinkBtn) {
      borderRadiusLinkBtn.addEventListener('click', () => {
        borderRadiusLinked = !borderRadiusLinked;
        borderRadiusLinkBtn.classList.toggle('active', borderRadiusLinked);
      });
    }

    // Inputs border
    const borderInputs = {
      top: panel.querySelector('#panelBorderTop'),
      right: panel.querySelector('#panelBorderRight'),
      bottom: panel.querySelector('#panelBorderBottom'),
      left: panel.querySelector('#panelBorderLeft')
    };

    Object.keys(borderInputs).forEach(side => {
      const input = borderInputs[side];
      if (input) {
        input.addEventListener('input', (e) => {
          const value = parseInt(e.target.value) || 0;
          applyBorder(element, side, value, borderLinked, borderInputs);
        });
      }
    });

    // Border Style
    const borderStyleInput = panel.querySelector('#panelBorderStyle');
    if (borderStyleInput) {
      borderStyleInput.addEventListener('change', (e) => {
        const style = e.target.value;
        if (style === 'none') {
          element.style.border = 'none';
        } else {
          const width = borderInputs.top?.value || 1;
          element.style.borderStyle = style;
          if (!borderLinked) {
            element.style.borderTopStyle = style;
            element.style.borderRightStyle = style;
            element.style.borderBottomStyle = style;
            element.style.borderLeftStyle = style;
          }
        }
        if (window.saveToHistory) {
          const computedStyle = window.getComputedStyle(element);
          const oldValue = computedStyle.borderStyle;
          window.saveToHistory(element, 'border', 'borderStyle', oldValue, style);
        }
      });
    }

    // Border Color
    const borderColorInput = panel.querySelector('#panelBorderColor');
    const borderColorTextInput = panel.querySelector('#panelBorderColorText');
    if (borderColorInput && borderColorTextInput) {
      const updateBorderColor = (value) => {
        element.style.borderColor = value;
        borderColorInput.value = value;
        borderColorTextInput.value = value;
        if (window.saveToHistory) {
          const computedStyle = window.getComputedStyle(element);
          const oldValue = computedStyle.borderColor;
          window.saveToHistory(element, 'border', 'borderColor', oldValue, value);
        }
      };
      borderColorInput.addEventListener('input', (e) => updateBorderColor(e.target.value));
      borderColorTextInput.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          updateBorderColor(e.target.value);
        }
      });
    }

    // Inputs border-radius
    const borderRadiusInputs = {
      topLeft: panel.querySelector('#panelBorderRadiusTopLeft'),
      topRight: panel.querySelector('#panelBorderRadiusTopRight'),
      bottomRight: panel.querySelector('#panelBorderRadiusBottomRight'),
      bottomLeft: panel.querySelector('#panelBorderRadiusBottomLeft')
    };

    Object.keys(borderRadiusInputs).forEach(corner => {
      const input = borderRadiusInputs[corner];
      if (input) {
        input.addEventListener('input', (e) => {
          const value = parseInt(e.target.value) || 0;
          applyBorderRadius(element, corner, value, borderRadiusLinked, borderRadiusInputs);
        });
      }
    });
  }

  // Attacher les événements d'ombres
  function attachShadowsEvents(panel, element) {
    const shadowX = panel.querySelector('#panelShadowX');
    const shadowY = panel.querySelector('#panelShadowY');
    const shadowBlur = panel.querySelector('#panelShadowBlur');
    const shadowSpread = panel.querySelector('#panelShadowSpread');
    const shadowColorInput = panel.querySelector('#panelShadowColor');
    const shadowColorText = panel.querySelector('#panelShadowColorText');
    const shadowOpacity = panel.querySelector('#panelShadowOpacity');
    const shadowOpacityValue = panel.querySelector('#panelShadowOpacityValue');
    const shadowToggle = panel.querySelector('#panelShadowToggle');

    const updateShadow = () => {
      const x = parseInt(shadowX?.value) || 0;
      const y = parseInt(shadowY?.value) || 0;
      const blur = parseInt(shadowBlur?.value) || 0;
      const spread = parseInt(shadowSpread?.value) || 0;
      const color = shadowColorInput?.value || '#000000';
      const opacity = parseInt(shadowOpacity?.value) || 100;
      
      const rgba = hexToRgba(color, opacity / 100);
      const shadow = `${x}px ${y}px ${blur}px ${spread}px ${rgba}`;
      element.style.boxShadow = shadow;
      
      if (window.saveToHistory) {
        const computedStyle = window.getComputedStyle(element);
        const oldValue = computedStyle.boxShadow;
        window.saveToHistory(element, 'shadow', 'boxShadow', oldValue, shadow);
      }
    };

    if (shadowX) shadowX.addEventListener('input', updateShadow);
    if (shadowY) shadowY.addEventListener('input', updateShadow);
    if (shadowBlur) shadowBlur.addEventListener('input', updateShadow);
    if (shadowSpread) shadowSpread.addEventListener('input', updateShadow);
    if (shadowColorInput) shadowColorInput.addEventListener('input', updateShadow);
    if (shadowColorText) {
      shadowColorText.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          shadowColorInput.value = e.target.value;
          updateShadow();
        }
      });
    }
    if (shadowOpacity) {
      shadowOpacity.addEventListener('input', (e) => {
        shadowOpacityValue.textContent = `${e.target.value}%`;
        updateShadow();
      });
    }
    if (shadowToggle) {
      shadowToggle.addEventListener('click', () => {
        const currentShadow = window.getComputedStyle(element).boxShadow;
        if (currentShadow === 'none' || !currentShadow) {
          updateShadow();
          shadowToggle.textContent = 'Désactiver l\'ombre';
        } else {
          element.style.boxShadow = 'none';
          shadowToggle.textContent = 'Activer l\'ombre';
          if (window.saveToHistory) {
            const computedStyle = window.getComputedStyle(element);
            const oldValue = computedStyle.boxShadow;
            window.saveToHistory(element, 'shadow', 'boxShadow', oldValue, 'none');
          }
        }
      });
    }
  }

  // Appliquer la bordure
  function applyBorder(element, side, value, linked, inputs) {
    if (linked) {
      element.style.border = `${value}px solid`;
      Object.values(inputs).forEach(input => {
        if (input) input.value = value;
      });
    } else {
      const property = `border${side.charAt(0).toUpperCase() + side.slice(1)}Width`;
      element.style[property] = `${value}px`;
    }
    
    if (window.saveToHistory) {
      const computedStyle = window.getComputedStyle(element);
      const oldValue = parseFloat(computedStyle[`border${side.charAt(0).toUpperCase() + side.slice(1)}Width`]) || 0;
      window.saveToHistory(element, 'border', `border${side}`, oldValue, value);
    }
  }

  // Appliquer le border-radius
  function applyBorderRadius(element, corner, value, linked, inputs) {
    if (linked) {
      element.style.borderRadius = `${value}px`;
      Object.values(inputs).forEach(input => {
        if (input) input.value = value;
      });
    } else {
      const propertyMap = {
        topLeft: 'borderTopLeftRadius',
        topRight: 'borderTopRightRadius',
        bottomRight: 'borderBottomRightRadius',
        bottomLeft: 'borderBottomLeftRadius'
      };
      element.style[propertyMap[corner]] = `${value}px`;
    }
    
    if (window.saveToHistory) {
      const computedStyle = window.getComputedStyle(element);
      const propertyMap = {
        topLeft: 'borderTopLeftRadius',
        topRight: 'borderTopRightRadius',
        bottomRight: 'borderBottomRightRadius',
        bottomLeft: 'borderBottomLeftRadius'
      };
      const oldValue = parseFloat(computedStyle[propertyMap[corner]]) || 0;
      window.saveToHistory(element, 'border', propertyMap[corner], oldValue, value);
    }
  }

  // Helpers
  function rgbToHex(rgb) {
    if (window.rgbToHex && typeof window.rgbToHex === 'function') {
      return window.rgbToHex(rgb);
    }
    
    if (!rgb || rgb === 'transparent') return '#000000';
    if (rgb.startsWith('#')) return rgb;
    
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    
    return '#000000';
  }

  function hexToRgba(hex, opacity) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return `rgba(0, 0, 0, ${opacity})`;
  }

  // Exposer les fonctions globalement
  window.createAdvancedBordersPanel = createAdvancedBordersPanel;
  window.createAdvancedShadowsPanel = createAdvancedShadowsPanel;
  window.attachBordersEvents = attachBordersEvents;
  window.attachShadowsEvents = attachShadowsEvents;
})();



