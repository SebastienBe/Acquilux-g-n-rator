// ========================================
// SYSTÈME DE COULEURS AVANCÉ - Style Figma
// ========================================

(function() {
  'use strict';

  // Palette de couleurs favorites (sauvegardée dans localStorage)
  let colorPalette = [];
  const PALETTE_STORAGE_KEY = 'figmaColorPalette';

  // Charger la palette depuis localStorage
  function loadColorPalette() {
    try {
      const saved = localStorage.getItem(PALETTE_STORAGE_KEY);
      if (saved) {
        colorPalette = JSON.parse(saved);
      } else {
        // Palette par défaut avec les couleurs du projet
        colorPalette = [
          '#E65B0C', // Orange Otera
          '#F6E2BE', // Beige clair
          '#60191A', // Rouge foncé
          '#B5DBE8', // Bleu clair
          '#000000', // Noir
          '#FFFFFF', // Blanc
          '#2C2E2D', // Gris foncé
          '#8B6F5E'  // Beige-orange moyen
        ];
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la palette:', error);
      colorPalette = [];
    }
  }

  // Sauvegarder la palette dans localStorage
  function saveColorPalette() {
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(colorPalette));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la palette:', error);
    }
  }

  // Ajouter une couleur à la palette
  function addToPalette(color) {
    if (!colorPalette.includes(color)) {
      colorPalette.unshift(color);
      // Limiter à 20 couleurs
      if (colorPalette.length > 20) {
        colorPalette = colorPalette.slice(0, 20);
      }
      saveColorPalette();
    }
  }

  // Supprimer une couleur de la palette
  function removeFromPalette(color) {
    colorPalette = colorPalette.filter(c => c !== color);
    saveColorPalette();
  }

  // Créer le panel de couleurs avancé
  function createAdvancedColorPanel(element, property = 'color') {
    const computedStyle = window.getComputedStyle(element);
    let currentColor = '#000000';
    
    if (property === 'color') {
      currentColor = rgbToHex(computedStyle.color) || '#000000';
    } else if (property === 'backgroundColor') {
      currentColor = rgbToHex(computedStyle.backgroundColor) || '#FFFFFF';
    }

    // Charger la palette
    loadColorPalette();

    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">🎨</span>
          <h3>Color</h3>
        </div>
        
        <!-- Color Picker -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Value</label>
            <div class="figma-color-wrapper">
              <input type="color" id="panelColorPicker" class="figma-color-input" value="${currentColor}">
              <input type="text" id="panelColorText" class="figma-text-input" value="${currentColor}" placeholder="#000000">
            </div>
          </div>
        </div>

        <!-- Formats de couleur -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Format</label>
            <select id="panelColorFormat" class="figma-select">
              <option value="hex" selected>Hex</option>
              <option value="rgb">RGB</option>
              <option value="rgba">RGBA</option>
              <option value="hsl">HSL</option>
              <option value="hsla">HSLA</option>
            </select>
          </div>
        </div>

        <!-- Opacity (si rgba/hsla) -->
        <div class="figma-control-row" id="panelColorOpacityRow" style="display: none;">
          <div class="figma-control-group full-width">
            <label class="figma-label">Opacity</label>
            <div class="figma-slider-wrapper">
              <input type="range" id="panelColorOpacity" min="0" max="100" step="1" value="100" class="figma-slider">
              <span class="figma-slider-value" id="panelColorOpacityValue">100%</span>
            </div>
          </div>
        </div>

        <!-- Palette de couleurs favorites -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Favorites</label>
            <div class="figma-color-palette" id="panelColorPalette">
              ${colorPalette.map((color, index) => `
                <div class="figma-color-swatch" data-color="${color}" title="${color}">
                  <div class="figma-color-swatch-color" style="background-color: ${color}"></div>
                  <button class="figma-color-swatch-remove" data-color="${color}" title="Supprimer">×</button>
                </div>
              `).join('')}
              <button class="figma-color-swatch-add" id="panelColorAddToPalette" title="Ajouter la couleur actuelle">
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Attacher les événements de couleurs
  function attachColorEvents(panel, element, property = 'color') {
    const colorPicker = panel.querySelector('#panelColorPicker');
    const colorText = panel.querySelector('#panelColorText');
    const colorFormat = panel.querySelector('#panelColorFormat');
    const colorOpacity = panel.querySelector('#panelColorOpacity');
    const colorOpacityValue = panel.querySelector('#panelColorOpacityValue');
    const colorOpacityRow = panel.querySelector('#panelColorOpacityRow');
    const addToPaletteBtn = panel.querySelector('#panelColorAddToPalette');
    const paletteSwatches = panel.querySelectorAll('.figma-color-swatch[data-color]');

    let currentOpacity = 100;

    // Mettre à jour le format d'affichage
    function updateColorFormat() {
      const format = colorFormat.value;
      const color = colorPicker.value;
      
      if (format === 'hex') {
        colorText.value = color;
        colorOpacityRow.style.display = 'none';
      } else {
        const rgb = hexToRgb(color);
        if (format === 'rgb') {
          colorText.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
          colorOpacityRow.style.display = 'none';
        } else if (format === 'rgba') {
          colorText.value = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentOpacity / 100})`;
          colorOpacityRow.style.display = 'flex';
        } else if (format === 'hsl') {
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          colorText.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
          colorOpacityRow.style.display = 'none';
        } else if (format === 'hsla') {
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          colorText.value = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${currentOpacity / 100})`;
          colorOpacityRow.style.display = 'flex';
        }
      }
    }

    // Appliquer la couleur
    function applyColor(colorValue) {
      element.style[property] = colorValue;
      
      if (window.saveToHistory) {
        const computedStyle = window.getComputedStyle(element);
        const oldValue = computedStyle[property];
        window.saveToHistory(element, 'color', property, oldValue, colorValue);
      }
    }

    // Color Picker
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        updateColorFormat();
        const format = colorFormat.value;
        if (format === 'hex') {
          applyColor(e.target.value);
        } else {
          updateColorFormat();
          applyColor(colorText.value);
        }
      });
    }

    // Color Text Input
    if (colorText) {
      colorText.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        // Extraire la couleur hex depuis différents formats
        const hexMatch = value.match(/#([0-9A-F]{6})/i);
        if (hexMatch) {
          colorPicker.value = hexMatch[0];
          applyColor(value);
        } else if (value.startsWith('rgb') || value.startsWith('hsl')) {
          applyColor(value);
        }
      });
    }

    // Format Select
    if (colorFormat) {
      colorFormat.addEventListener('change', updateColorFormat);
    }

    // Opacity Slider
    if (colorOpacity && colorOpacityValue) {
      colorOpacity.addEventListener('input', (e) => {
        currentOpacity = parseInt(e.target.value);
        colorOpacityValue.textContent = `${currentOpacity}%`;
        updateColorFormat();
        applyColor(colorText.value);
      });
    }

    // Ajouter à la palette
    if (addToPaletteBtn) {
      addToPaletteBtn.addEventListener('click', () => {
        const color = colorPicker.value;
        addToPalette(color);
        // Rafraîchir la palette
        const paletteEl = panel.querySelector('#panelColorPalette');
        if (paletteEl) {
          loadColorPalette();
          const swatches = colorPalette.map((c, i) => `
            <div class="figma-color-swatch" data-color="${c}" title="${c}">
              <div class="figma-color-swatch-color" style="background-color: ${c}"></div>
              <button class="figma-color-swatch-remove" data-color="${c}" title="Supprimer">×</button>
            </div>
          `).join('');
          paletteEl.innerHTML = swatches + addToPaletteBtn.outerHTML;
          // Réattacher les événements
          attachColorPaletteEvents(panel, element, property);
        }
      });
    }

    // Palette swatches
    attachColorPaletteEvents(panel, element, property);
  }

  // Attacher les événements de la palette
  function attachColorPaletteEvents(panel, element, property) {
    panel.querySelectorAll('.figma-color-swatch[data-color]').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        if (!e.target.classList.contains('figma-color-swatch-remove')) {
          const color = swatch.dataset.color;
          const colorPicker = panel.querySelector('#panelColorPicker');
          const colorText = panel.querySelector('#panelColorText');
          if (colorPicker) colorPicker.value = color;
          if (colorText) colorText.value = color;
          element.style[property] = color;
          
          if (window.saveToHistory) {
            const computedStyle = window.getComputedStyle(element);
            const oldValue = computedStyle[property];
            window.saveToHistory(element, 'color', property, oldValue, color);
          }
        }
      });
    });

    panel.querySelectorAll('.figma-color-swatch-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const color = btn.dataset.color;
        removeFromPalette(color);
        btn.closest('.figma-color-swatch').remove();
      });
    });
  }

  // Helpers de conversion de couleurs
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

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
  window.createAdvancedColorPanel = createAdvancedColorPanel;
  window.attachColorEvents = attachColorEvents;
  window.loadColorPalette = loadColorPalette;
  window.addToPalette = addToPalette;
  window.removeFromPalette = removeFromPalette;

  // Initialiser la palette au chargement
  loadColorPalette();
})();






