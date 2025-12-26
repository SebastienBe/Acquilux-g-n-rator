// ========================================
// SYSTÈME RESPONSIVE - Breakpoints et vue adaptative
// ========================================

(function() {
  'use strict';

  // Breakpoints disponibles
  const BREAKPOINTS = {
    'A5': { width: 559, height: 794, label: 'A5 (148 × 210 mm)' },
    'A4': { width: 794, height: 1123, label: 'A4 (210 × 297 mm)' },
    'Mobile': { width: 375, height: 667, label: 'Mobile (375 × 667)' },
    'Tablet': { width: 768, height: 1024, label: 'Tablet (768 × 1024)' },
    'Desktop': { width: 1200, height: 1600, label: 'Desktop (1200 × 1600)' },
    'Custom': { width: 595, height: 842, label: 'Personnalisé' }
  };

  let currentBreakpoint = 'A5';
  let customWidth = 595;
  let customHeight = 842;
  let isResponsiveMode = false;

  // Appliquer un breakpoint
  function applyBreakpoint(breakpointName) {
    if (!BREAKPOINTS[breakpointName]) {
      console.warn('Breakpoint inconnu:', breakpointName);
      return;
    }

    currentBreakpoint = breakpointName;
    const breakpoint = BREAKPOINTS[breakpointName];
    
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) return;

    if (breakpointName === 'Custom') {
      pdfPreview.style.width = `${customWidth}px`;
      pdfPreview.style.maxWidth = `${customWidth}px`;
    } else {
      pdfPreview.style.width = `${breakpoint.width}px`;
      pdfPreview.style.maxWidth = `${breakpoint.width}px`;
    }

    // Sauvegarder le breakpoint
    try {
      localStorage.setItem('figmaCurrentBreakpoint', breakpointName);
      if (breakpointName === 'Custom') {
        localStorage.setItem('figmaCustomDimensions', JSON.stringify({ width: customWidth, height: customHeight }));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du breakpoint:', error);
    }
  }

  // Définir les dimensions personnalisées
  function setCustomDimensions(width, height) {
    customWidth = Math.max(200, Math.min(2000, width));
    customHeight = Math.max(200, Math.min(3000, height));
    
    if (currentBreakpoint === 'Custom') {
      applyBreakpoint('Custom');
    }
  }

  // Activer/désactiver le mode responsive
  function setResponsiveMode(enabled) {
    isResponsiveMode = enabled;
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) return;

    if (enabled) {
      pdfPreview.classList.add('responsive-mode');
      // Ajuster automatiquement selon la taille de l'écran
      updateResponsiveLayout();
      window.addEventListener('resize', updateResponsiveLayout);
    } else {
      pdfPreview.classList.remove('responsive-mode');
      window.removeEventListener('resize', updateResponsiveLayout);
      applyBreakpoint(currentBreakpoint);
    }
  }

  // Mettre à jour le layout responsive
  function updateResponsiveLayout() {
    if (!isResponsiveMode) return;

    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Ajuster la largeur selon la taille de l'écran
    if (viewportWidth < 768) {
      // Mobile
      pdfPreview.style.width = '100%';
      pdfPreview.style.maxWidth = '100%';
    } else if (viewportWidth < 1024) {
      // Tablet
      pdfPreview.style.width = '90%';
      pdfPreview.style.maxWidth = '90%';
    } else {
      // Desktop
      pdfPreview.style.width = '80%';
      pdfPreview.style.maxWidth = '80%';
    }
  }

  // Créer le panel responsive
  function createResponsivePanel() {
    // Charger le breakpoint sauvegardé
    try {
      const saved = localStorage.getItem('figmaCurrentBreakpoint');
      if (saved && BREAKPOINTS[saved]) {
        currentBreakpoint = saved;
      }
      if (currentBreakpoint === 'Custom') {
        const savedDims = localStorage.getItem('figmaCustomDimensions');
        if (savedDims) {
          const dims = JSON.parse(savedDims);
          customWidth = dims.width || 595;
          customHeight = dims.height || 842;
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du breakpoint:', error);
    }

    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📱</span>
          <h3>Responsive</h3>
        </div>
        
        <!-- Mode Responsive -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">
              <input type="checkbox" id="panelResponsiveMode" ${isResponsiveMode ? 'checked' : ''}>
              <span>Mode Responsive</span>
            </label>
          </div>
        </div>

        <!-- Breakpoint -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Breakpoint</label>
            <select id="panelBreakpoint" class="figma-select">
              ${Object.keys(BREAKPOINTS).map(key => `
                <option value="${key}" ${currentBreakpoint === key ? 'selected' : ''}>
                  ${BREAKPOINTS[key].label}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Dimensions personnalisées -->
        <div class="figma-control-row" id="panelCustomDimensions" style="display: ${currentBreakpoint === 'Custom' ? 'flex' : 'none'};">
          <div class="figma-control-group">
            <label class="figma-label">Largeur</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelCustomWidth" class="figma-number-input" value="${customWidth}" min="200" max="2000" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
          <div class="figma-control-group">
            <label class="figma-label">Hauteur</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelCustomHeight" class="figma-number-input" value="${customHeight}" min="200" max="3000" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Attacher les événements du panel responsive
  function attachResponsiveEvents(panel) {
    // Mode Responsive
    const responsiveToggle = panel.querySelector('#panelResponsiveMode');
    if (responsiveToggle) {
      responsiveToggle.addEventListener('change', (e) => {
        setResponsiveMode(e.target.checked);
      });
    }

    // Breakpoint
    const breakpointSelect = panel.querySelector('#panelBreakpoint');
    const customDimensions = panel.querySelector('#panelCustomDimensions');
    if (breakpointSelect) {
      breakpointSelect.addEventListener('change', (e) => {
        const breakpoint = e.target.value;
        currentBreakpoint = breakpoint;
        if (customDimensions) {
          customDimensions.style.display = breakpoint === 'Custom' ? 'flex' : 'none';
        }
        if (!isResponsiveMode) {
          applyBreakpoint(breakpoint);
        }
      });
    }

    // Dimensions personnalisées
    const widthInput = panel.querySelector('#panelCustomWidth');
    const heightInput = panel.querySelector('#panelCustomHeight');
    if (widthInput) {
      widthInput.addEventListener('input', (e) => {
        const width = parseInt(e.target.value) || 595;
        setCustomDimensions(width, customHeight);
      });
    }
    if (heightInput) {
      heightInput.addEventListener('input', (e) => {
        const height = parseInt(e.target.value) || 842;
        setCustomDimensions(customWidth, height);
      });
    }
  }

  // Exposer les fonctions globalement
  window.applyBreakpoint = applyBreakpoint;
  window.setCustomDimensions = setCustomDimensions;
  window.setResponsiveMode = setResponsiveMode;
  window.createResponsivePanel = createResponsivePanel;
  window.attachResponsiveEvents = attachResponsiveEvents;
  window.getCurrentBreakpoint = () => currentBreakpoint;
  window.getCustomDimensions = () => ({ width: customWidth, height: customHeight });

  // Initialiser au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        try {
          const saved = localStorage.getItem('figmaCurrentBreakpoint');
          if (saved && BREAKPOINTS[saved]) {
            applyBreakpoint(saved);
          }
        } catch (error) {
          console.error('Erreur lors de l\'initialisation du breakpoint:', error);
        }
      }, 500);
    });
  } else {
    setTimeout(() => {
      try {
        const saved = localStorage.getItem('figmaCurrentBreakpoint');
        if (saved && BREAKPOINTS[saved]) {
          applyBreakpoint(saved);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du breakpoint:', error);
      }
    }, 500);
  }
})();










