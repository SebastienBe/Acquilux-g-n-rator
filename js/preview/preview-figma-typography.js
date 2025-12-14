// ========================================
// SYSTÈME DE TYPOGRAPHIE COMPLET - Style Figma
// ========================================

(function() {
  'use strict';

  // Créer le panel de typographie avancé
  function createAdvancedTypographyPanel(element, type) {
    const computedStyle = window.getComputedStyle(element);
    const fontSize = parseFloat(computedStyle.fontSize) || 16;
    const fontWeight = computedStyle.fontWeight || '400';
    const lineHeight = computedStyle.lineHeight || 'normal';
    const letterSpacing = computedStyle.letterSpacing || 'normal';
    const color = computedStyle.color || '#000000';
    const textTransform = computedStyle.textTransform || 'none';
    const textDecoration = computedStyle.textDecoration || 'none';
    const textAlign = computedStyle.textAlign || 'left';
    const fontStyle = computedStyle.fontStyle || 'normal';

    // Convertir lineHeight en valeur numérique si possible
    let lineHeightValue = lineHeight;
    if (lineHeight !== 'normal' && typeof lineHeight === 'string') {
      const parsed = parseFloat(lineHeight);
      if (!isNaN(parsed)) {
        lineHeightValue = parsed;
      }
    }

    // Convertir letterSpacing en valeur numérique
    let letterSpacingValue = 0;
    if (letterSpacing !== 'normal') {
      const parsed = parseFloat(letterSpacing);
      if (!isNaN(parsed)) {
        letterSpacingValue = parsed;
      }
    }

    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">✍️</span>
          <h3>Typography</h3>
        </div>
        
        <!-- Font Size -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Font Size</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelFontSize" class="figma-number-input" value="${Math.round(fontSize)}" min="8" max="72" step="1">
              <select class="figma-unit-select" id="panelFontSizeUnit">
                <option value="px" selected>px</option>
                <option value="em">em</option>
                <option value="rem">rem</option>
                <option value="%">%</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Font Weight -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Font Weight</label>
            <select id="panelFontWeight" class="figma-select">
              <option value="100" ${fontWeight === '100' ? 'selected' : ''}>Thin (100)</option>
              <option value="200" ${fontWeight === '200' ? 'selected' : ''}>Extra Light (200)</option>
              <option value="300" ${fontWeight === '300' ? 'selected' : ''}>Light (300)</option>
              <option value="400" ${fontWeight === '400' || fontWeight === 'normal' ? 'selected' : ''}>Regular (400)</option>
              <option value="500" ${fontWeight === '500' ? 'selected' : ''}>Medium (500)</option>
              <option value="600" ${fontWeight === '600' ? 'selected' : ''}>Semi Bold (600)</option>
              <option value="700" ${fontWeight === '700' || fontWeight === 'bold' ? 'selected' : ''}>Bold (700)</option>
              <option value="800" ${fontWeight === '800' ? 'selected' : ''}>Extra Bold (800)</option>
              <option value="900" ${fontWeight === '900' ? 'selected' : ''}>Black (900)</option>
            </select>
          </div>
        </div>

        <!-- Line Height -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Line Height</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelLineHeight" class="figma-number-input" value="${lineHeightValue}" min="0.5" max="3" step="0.1">
              <span class="figma-unit">×</span>
            </div>
          </div>
        </div>

        <!-- Letter Spacing -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Letter Spacing</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelLetterSpacing" class="figma-number-input" value="${letterSpacingValue}" min="-5" max="20" step="0.1">
              <select class="figma-unit-select" id="panelLetterSpacingUnit">
                <option value="px" selected>px</option>
                <option value="em">em</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Color -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Color</label>
            <div class="figma-color-wrapper">
              <input type="color" id="panelTextColor" class="figma-color-input" value="${rgbToHex(color)}">
              <input type="text" id="panelTextColorText" class="figma-text-input" value="${rgbToHex(color)}" placeholder="#000000">
            </div>
          </div>
        </div>

        <!-- Text Transform -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Text Transform</label>
            <select id="panelTextTransform" class="figma-select">
              <option value="none" ${textTransform === 'none' ? 'selected' : ''}>None</option>
              <option value="uppercase" ${textTransform === 'uppercase' ? 'selected' : ''}>Uppercase</option>
              <option value="lowercase" ${textTransform === 'lowercase' ? 'selected' : ''}>Lowercase</option>
              <option value="capitalize" ${textTransform === 'capitalize' ? 'selected' : ''}>Capitalize</option>
            </select>
          </div>
        </div>

        <!-- Text Decoration -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Text Decoration</label>
            <select id="panelTextDecoration" class="figma-select">
              <option value="none" ${textDecoration === 'none' || textDecoration === '' ? 'selected' : ''}>None</option>
              <option value="underline" ${textDecoration.includes('underline') ? 'selected' : ''}>Underline</option>
              <option value="overline" ${textDecoration.includes('overline') ? 'selected' : ''}>Overline</option>
              <option value="line-through" ${textDecoration.includes('line-through') ? 'selected' : ''}>Line Through</option>
            </select>
          </div>
        </div>

        <!-- Text Align -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Text Align</label>
            <div class="figma-button-group">
              <button class="figma-icon-btn ${textAlign === 'left' ? 'active' : ''}" data-align="left" title="Left">⬅</button>
              <button class="figma-icon-btn ${textAlign === 'center' ? 'active' : ''}" data-align="center" title="Center">⬌</button>
              <button class="figma-icon-btn ${textAlign === 'right' ? 'active' : ''}" data-align="right" title="Right">➡</button>
              <button class="figma-icon-btn ${textAlign === 'justify' ? 'active' : ''}" data-align="justify" title="Justify">⬌⬌</button>
            </div>
          </div>
        </div>

        <!-- Font Style -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Font Style</label>
            <select id="panelFontStyle" class="figma-select">
              <option value="normal" ${fontStyle === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="italic" ${fontStyle === 'italic' ? 'selected' : ''}>Italic</option>
              <option value="oblique" ${fontStyle === 'oblique' ? 'selected' : ''}>Oblique</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  // Attacher les événements de typographie
  function attachTypographyEvents(panel, element) {
    // Font Size
    const fontSizeInput = panel.querySelector('#panelFontSize');
    const fontSizeUnit = panel.querySelector('#panelFontSizeUnit');
    if (fontSizeInput && fontSizeUnit) {
      const updateFontSize = () => {
        const value = fontSizeInput.value;
        const unit = fontSizeUnit.value;
        element.style.fontSize = `${value}${unit}`;
        if (window.saveToHistory) {
          const computedStyle = window.getComputedStyle(element);
          const oldValue = computedStyle.fontSize;
          window.saveToHistory(element, 'typography', 'fontSize', oldValue, `${value}${unit}`);
        }
      };
      fontSizeInput.addEventListener('input', updateFontSize);
      fontSizeUnit.addEventListener('change', updateFontSize);
    }

    // Font Weight
    const fontWeightInput = panel.querySelector('#panelFontWeight');
    if (fontWeightInput) {
      fontWeightInput.addEventListener('change', (e) => {
        element.style.fontWeight = e.target.value;
        if (window.saveToHistory) {
          const computedStyle = window.getComputedStyle(element);
          const oldValue = computedStyle.fontWeight;
          window.saveToHistory(element, 'typography', 'fontWeight', oldValue, e.target.value);
        }
      });
    }

    // Line Height
    const lineHeightInput = panel.querySelector('#panelLineHeight');
    if (lineHeightInput) {
      lineHeightInput.addEventListener('input', (e) => {
        element.style.lineHeight = e.target.value;
        if (window.saveToHistory) {
          const computedStyle = window.getComputedStyle(element);
          const oldValue = computedStyle.lineHeight;
          window.saveToHistory(element, 'typography', 'lineHeight', oldValue, e.target.value);
        }
      });
    }

    // Letter Spacing
    const letterSpacingInput = panel.querySelector('#panelLetterSpacing');
    const letterSpacingUnit = panel.querySelector('#panelLetterSpacingUnit');
    if (letterSpacingInput && letterSpacingUnit) {
      const updateLetterSpacing = () => {
        const value = letterSpacingInput.value;
        const unit = letterSpacingUnit.value;
        if (value == 0) {
          element.style.letterSpacing = 'normal';
        } else {
          element.style.letterSpacing = `${value}${unit}`;
        }
        if (window.saveToHistory) {
          const computedStyle = window.getComputedStyle(element);
          const oldValue = computedStyle.letterSpacing;
          window.saveToHistory(element, 'typography', 'letterSpacing', oldValue, `${value}${unit}`);
        }
      };
      letterSpacingInput.addEventListener('input', updateLetterSpacing);
      letterSpacingUnit.addEventListener('change', updateLetterSpacing);
    }

    // Color
    const colorInput = panel.querySelector('#panelTextColor');
    const colorTextInput = panel.querySelector('#panelTextColorText');
    if (colorInput && colorTextInput) {
      const updateColor = (value) => {
        element.style.color = value;
        colorInput.value = value;
        colorTextInput.value = value;
        if (window.saveToHistory) {
          const computedStyle = window.getComputedStyle(element);
          const oldValue = rgbToHex(computedStyle.color);
          window.saveToHistory(element, 'typography', 'color', oldValue, value);
        }
      };
      colorInput.addEventListener('input', (e) => updateColor(e.target.value));
      colorTextInput.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          updateColor(e.target.value);
        }
      });
    }

    // Text Transform
    const textTransformInput = panel.querySelector('#panelTextTransform');
    if (textTransformInput) {
      textTransformInput.addEventListener('change', (e) => {
        element.style.textTransform = e.target.value;
        if (window.saveToHistory) {
          const computedStyle = window.getComputedStyle(element);
          const oldValue = computedStyle.textTransform;
          window.saveToHistory(element, 'typography', 'textTransform', oldValue, e.target.value);
        }
      });
    }

    // Text Decoration
    const textDecorationInput = panel.querySelector('#panelTextDecoration');
    if (textDecorationInput) {
      textDecorationInput.addEventListener('change', (e) => {
        element.style.textDecoration = e.target.value;
        if (window.saveToHistory) {
          const computedStyle = window.getComputedStyle(element);
          const oldValue = computedStyle.textDecoration;
          window.saveToHistory(element, 'typography', 'textDecoration', oldValue, e.target.value);
        }
      });
    }

    // Text Align
    panel.querySelectorAll('[data-align]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const align = e.currentTarget.dataset.align;
        element.style.textAlign = align;
        panel.querySelectorAll('[data-align]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        if (window.saveToHistory) {
          const computedStyle = window.getComputedStyle(element);
          const oldValue = computedStyle.textAlign;
          window.saveToHistory(element, 'typography', 'textAlign', oldValue, align);
        }
      });
    });

    // Font Style
    const fontStyleInput = panel.querySelector('#panelFontStyle');
    if (fontStyleInput) {
      fontStyleInput.addEventListener('change', (e) => {
        element.style.fontStyle = e.target.value;
        if (window.saveToHistory) {
          const computedStyle = window.getComputedStyle(element);
          const oldValue = computedStyle.fontStyle;
          window.saveToHistory(element, 'typography', 'fontStyle', oldValue, e.target.value);
        }
      });
    }
  }

  // Helper pour convertir RGB en Hex (utiliser la fonction globale si disponible)
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

  // Exposer les fonctions globalement
  window.createAdvancedTypographyPanel = createAdvancedTypographyPanel;
  window.attachTypographyEvents = attachTypographyEvents;
})();

