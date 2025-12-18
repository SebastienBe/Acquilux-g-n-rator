// ========================================
// SYSTÈME DE GRID ET GUIDES - Style Figma
// ========================================

(function() {
  'use strict';

  let gridOverlay = null;
  let isGridVisible = false;
  let gridSize = 20;
  let gridColor = 'rgba(0, 0, 0, 0.1)';
  let guides = [];
  let isSnapToGrid = false;
  let isSnapToGuides = false;

  // Créer l'overlay de grille
  function createGridOverlay() {
    if (gridOverlay) return gridOverlay;

    gridOverlay = document.createElement('div');
    gridOverlay.id = 'figmaGridOverlay';
    gridOverlay.className = 'figma-grid-overlay';
    gridOverlay.style.display = 'none';
    gridOverlay.style.pointerEvents = 'none';
    gridOverlay.style.position = 'absolute';
    gridOverlay.style.top = '0';
    gridOverlay.style.left = '0';
    gridOverlay.style.width = '100%';
    gridOverlay.style.height = '100%';
    gridOverlay.style.zIndex = '999';
    gridOverlay.style.backgroundImage = `
      linear-gradient(${gridColor} 1px, transparent 1px),
      linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
    `;
    gridOverlay.style.backgroundSize = `${gridSize}px ${gridSize}px`;

    const pdfPreview = document.getElementById('pdfPreview');
    if (pdfPreview) {
      pdfPreview.style.position = 'relative';
      pdfPreview.appendChild(gridOverlay);
    }

    return gridOverlay;
  }

  // Afficher/masquer la grille
  function toggleGrid() {
    isGridVisible = !isGridVisible;
    if (!gridOverlay) {
      createGridOverlay();
    }
    if (gridOverlay) {
      gridOverlay.style.display = isGridVisible ? 'block' : 'none';
    }
    return isGridVisible;
  }

  // Définir la taille de la grille
  function setGridSize(size) {
    gridSize = Math.max(5, Math.min(100, size));
    if (gridOverlay) {
      gridOverlay.style.backgroundSize = `${gridSize}px ${gridSize}px`;
    }
  }

  // Définir la couleur de la grille
  function setGridColor(color) {
    gridColor = color;
    if (gridOverlay) {
      gridOverlay.style.backgroundImage = `
        linear-gradient(${gridColor} 1px, transparent 1px),
        linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
      `;
    }
  }

  // Créer un guide
  function createGuide(orientation, position) {
    const guide = {
      id: `guide-${Date.now()}`,
      orientation, // 'horizontal' ou 'vertical'
      position,
      element: null
    };

    const guideEl = document.createElement('div');
    guideEl.className = `figma-guide figma-guide-${orientation}`;
    guideEl.style.position = 'absolute';
    guideEl.style.backgroundColor = '#18A0FB';
    guideEl.style.zIndex = '998';
    guideEl.style.pointerEvents = 'none';

    if (orientation === 'horizontal') {
      guideEl.style.left = '0';
      guideEl.style.right = '0';
      guideEl.style.height = '1px';
      guideEl.style.top = `${position}px`;
    } else {
      guideEl.style.top = '0';
      guideEl.style.bottom = '0';
      guideEl.style.width = '1px';
      guideEl.style.left = `${position}px`;
    }

    guide.element = guideEl;

    const pdfPreview = document.getElementById('pdfPreview');
    if (pdfPreview) {
      pdfPreview.appendChild(guideEl);
    }

    guides.push(guide);
    return guide;
  }

  // Supprimer un guide
  function deleteGuide(guideId) {
    const index = guides.findIndex(g => g.id === guideId);
    if (index > -1) {
      const guide = guides[index];
      if (guide.element) {
        guide.element.remove();
      }
      guides.splice(index, 1);
    }
  }

  // Supprimer tous les guides
  function clearGuides() {
    guides.forEach(guide => {
      if (guide.element) {
        guide.element.remove();
      }
    });
    guides = [];
  }

  // Activer/désactiver le snap to grid
  function setSnapToGrid(enabled) {
    isSnapToGrid = enabled;
  }

  // Activer/désactiver le snap to guides
  function setSnapToGuides(enabled) {
    isSnapToGuides = enabled;
  }

  // Aligner une valeur à la grille
  function snapToGrid(value) {
    if (!isGridVisible || !isSnapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }

  // Aligner une valeur aux guides
  function snapToGuides(value, orientation) {
    if (!isSnapToGuides || guides.length === 0) return value;

    const relevantGuides = guides.filter(g => g.orientation === orientation);
    if (relevantGuides.length === 0) return value;

    let closestGuide = null;
    let minDistance = 10; // Distance de snap en pixels

    relevantGuides.forEach(guide => {
      const distance = Math.abs(value - guide.position);
      if (distance < minDistance) {
        minDistance = distance;
        closestGuide = guide;
      }
    });

    return closestGuide ? closestGuide.position : value;
  }

  // Créer le panel de contrôle de la grille
  function createGridPanel() {
    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">⊞</span>
          <h3>Grid</h3>
        </div>
        
        <!-- Toggle Grid -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">
              <input type="checkbox" id="panelGridToggle" ${isGridVisible ? 'checked' : ''}>
              <span>Afficher la grille</span>
            </label>
          </div>
        </div>

        <!-- Grid Size -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Taille</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelGridSize" class="figma-number-input" value="${gridSize}" min="5" max="100" step="5">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>

        <!-- Grid Color -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Couleur</label>
            <div class="figma-color-wrapper">
              <input type="color" id="panelGridColor" class="figma-color-input" value="${rgbToHex(gridColor)}">
              <input type="text" id="panelGridColorText" class="figma-text-input" value="${rgbToHex(gridColor)}">
            </div>
          </div>
        </div>

        <!-- Snap to Grid -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">
              <input type="checkbox" id="panelSnapToGrid" ${isSnapToGrid ? 'checked' : ''}>
              <span>Snap to Grid</span>
            </label>
          </div>
        </div>
      </div>

      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📏</span>
          <h3>Guides</h3>
        </div>
        
        <!-- Snap to Guides -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">
              <input type="checkbox" id="panelSnapToGuides" ${isSnapToGuides ? 'checked' : ''}>
              <span>Snap to Guides</span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <button class="figma-action-btn" id="panelClearGuides">
              Effacer tous les guides
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Attacher les événements du panel de grille
  function attachGridEvents(panel) {
    // Toggle Grid
    const gridToggle = panel.querySelector('#panelGridToggle');
    if (gridToggle) {
      gridToggle.addEventListener('change', (e) => {
        toggleGrid();
      });
    }

    // Grid Size
    const gridSizeInput = panel.querySelector('#panelGridSize');
    if (gridSizeInput) {
      gridSizeInput.addEventListener('input', (e) => {
        setGridSize(parseInt(e.target.value) || 20);
      });
    }

    // Grid Color
    const gridColorInput = panel.querySelector('#panelGridColor');
    const gridColorText = panel.querySelector('#panelGridColorText');
    if (gridColorInput && gridColorText) {
      const updateColor = (value) => {
        setGridColor(value);
        gridColorInput.value = value;
        gridColorText.value = value;
      };
      gridColorInput.addEventListener('input', (e) => updateColor(e.target.value));
      gridColorText.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          updateColor(e.target.value);
        }
      });
    }

    // Snap to Grid
    const snapToGridToggle = panel.querySelector('#panelSnapToGrid');
    if (snapToGridToggle) {
      snapToGridToggle.addEventListener('change', (e) => {
        setSnapToGrid(e.target.checked);
      });
    }

    // Snap to Guides
    const snapToGuidesToggle = panel.querySelector('#panelSnapToGuides');
    if (snapToGuidesToggle) {
      snapToGuidesToggle.addEventListener('change', (e) => {
        setSnapToGuides(e.target.checked);
      });
    }

    // Clear Guides
    const clearGuidesBtn = panel.querySelector('#panelClearGuides');
    if (clearGuidesBtn) {
      clearGuidesBtn.addEventListener('click', () => {
        if (confirm('Effacer tous les guides ?')) {
          clearGuides();
        }
      });
    }
  }

  // Helper pour convertir RGB en Hex
  function rgbToHex(rgb) {
    if (window.rgbToHex && typeof window.rgbToHex === 'function') {
      return window.rgbToHex(rgb);
    }
    
    if (!rgb || rgb === 'transparent') return '#000000';
    if (rgb.startsWith('#')) return rgb;
    
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    
    return '#000000';
  }

  // Exposer les fonctions globalement
  window.toggleGrid = toggleGrid;
  window.setGridSize = setGridSize;
  window.setGridColor = setGridColor;
  window.createGuide = createGuide;
  window.deleteGuide = deleteGuide;
  window.clearGuides = clearGuides;
  window.setSnapToGrid = setSnapToGrid;
  window.setSnapToGuides = setSnapToGuides;
  window.snapToGrid = snapToGrid;
  window.snapToGuides = snapToGuides;
  window.createGridPanel = createGridPanel;
  window.attachGridEvents = attachGridEvents;

  // Initialiser la grille au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(createGridOverlay, 500);
    });
  } else {
    setTimeout(createGridOverlay, 500);
  }
})();







