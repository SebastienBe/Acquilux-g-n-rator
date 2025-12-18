// ========================================
// SYSTÈME D'EXPORT PDF OPTIMISÉ - Style Figma
// ========================================

(function() {
  'use strict';

  // Options d'export par défaut
  let exportOptions = {
    quality: 'high', // 'low', 'medium', 'high'
    format: 'A5', // 'A5', 'A4', 'custom'
    customWidth: 595,
    customHeight: 842,
    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
    metadata: {
      title: '',
      author: '',
      subject: '',
      keywords: ''
    },
    includeGrid: false,
    includeGuides: false
  };

  // Charger les options depuis localStorage
  function loadExportOptions() {
    try {
      const saved = localStorage.getItem('figmaExportOptions');
      if (saved) {
        exportOptions = { ...exportOptions, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Erreur lors du chargement des options d\'export:', error);
    }
  }

  // Sauvegarder les options
  function saveExportOptions() {
    try {
      localStorage.setItem('figmaExportOptions', JSON.stringify(exportOptions));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des options d\'export:', error);
    }
  }

  // Créer le panel d'options d'export
  function createExportPanel() {
    loadExportOptions();

    const formatSizes = {
      'A5': { width: 559, height: 794 },
      'A4': { width: 794, height: 1123 },
      'custom': { width: exportOptions.customWidth, height: exportOptions.customHeight }
    };

    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📤</span>
          <h3>Export Options</h3>
        </div>
        
        <!-- Qualité -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Qualité</label>
            <select id="panelExportQuality" class="figma-select">
              <option value="low" ${exportOptions.quality === 'low' ? 'selected' : ''}>Basse (rapide)</option>
              <option value="medium" ${exportOptions.quality === 'medium' ? 'selected' : ''}>Moyenne</option>
              <option value="high" ${exportOptions.quality === 'high' ? 'selected' : ''}>Haute (lente)</option>
            </select>
          </div>
        </div>

        <!-- Format -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Format</label>
            <select id="panelExportFormat" class="figma-select">
              <option value="A5" ${exportOptions.format === 'A5' ? 'selected' : ''}>A5 (148 × 210 mm)</option>
              <option value="A4" ${exportOptions.format === 'A4' ? 'selected' : ''}>A4 (210 × 297 mm)</option>
              <option value="custom" ${exportOptions.format === 'custom' ? 'selected' : ''}>Personnalisé</option>
            </select>
          </div>
        </div>

        <!-- Dimensions personnalisées -->
        <div class="figma-control-row" id="panelExportCustomDimensions" style="display: ${exportOptions.format === 'custom' ? 'flex' : 'none'};">
          <div class="figma-control-group">
            <label class="figma-label">Largeur</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelExportWidth" class="figma-number-input" value="${exportOptions.customWidth}" min="200" max="2000" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
          <div class="figma-control-group">
            <label class="figma-label">Hauteur</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelExportHeight" class="figma-number-input" value="${exportOptions.customHeight}" min="200" max="3000" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>

        <!-- Marges -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Marges</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelExportMargins" class="figma-number-input" value="${exportOptions.margins.top}" min="0" max="50" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>

        <!-- Inclure grille et guides -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">
              <input type="checkbox" id="panelExportIncludeGrid" ${exportOptions.includeGrid ? 'checked' : ''}>
              <span>Inclure la grille</span>
            </label>
          </div>
        </div>

        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">
              <input type="checkbox" id="panelExportIncludeGuides" ${exportOptions.includeGuides ? 'checked' : ''}>
              <span>Inclure les guides</span>
            </label>
          </div>
        </div>
      </div>

      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📋</span>
          <h3>Métadonnées</h3>
        </div>
        
        <!-- Titre -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Titre</label>
            <input type="text" id="panelExportTitle" class="figma-text-input" value="${exportOptions.metadata.title}" placeholder="Titre du document">
          </div>
        </div>

        <!-- Auteur -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Auteur</label>
            <input type="text" id="panelExportAuthor" class="figma-text-input" value="${exportOptions.metadata.author}" placeholder="Nom de l'auteur">
          </div>
        </div>

        <!-- Sujet -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Sujet</label>
            <input type="text" id="panelExportSubject" class="figma-text-input" value="${exportOptions.metadata.subject}" placeholder="Sujet du document">
          </div>
        </div>

        <!-- Mots-clés -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Mots-clés</label>
            <input type="text" id="panelExportKeywords" class="figma-text-input" value="${exportOptions.metadata.keywords}" placeholder="Mots-clés (séparés par des virgules)">
          </div>
        </div>
      </div>
    `;
  }

  // Attacher les événements du panel d'export
  function attachExportEvents(panel) {
    // Qualité
    const qualitySelect = panel.querySelector('#panelExportQuality');
    if (qualitySelect) {
      qualitySelect.addEventListener('change', (e) => {
        exportOptions.quality = e.target.value;
        saveExportOptions();
      });
    }

    // Format
    const formatSelect = panel.querySelector('#panelExportFormat');
    const customDimensions = panel.querySelector('#panelExportCustomDimensions');
    if (formatSelect) {
      formatSelect.addEventListener('change', (e) => {
        exportOptions.format = e.target.value;
        if (customDimensions) {
          customDimensions.style.display = e.target.value === 'custom' ? 'flex' : 'none';
        }
        saveExportOptions();
        // Mettre à jour la preview avec les nouvelles dimensions immédiatement
        console.log('🔄 Format changé:', exportOptions.format);
        updatePreviewDimensions();
      });
    }

    // Dimensions personnalisées
    const widthInput = panel.querySelector('#panelExportWidth');
    const heightInput = panel.querySelector('#panelExportHeight');
    if (widthInput) {
      widthInput.addEventListener('input', (e) => {
        exportOptions.customWidth = parseInt(e.target.value) || 595;
        saveExportOptions();
        // Mettre à jour la preview si format personnalisé
        if (exportOptions.format === 'custom') {
          updatePreviewDimensions();
        }
      });
    }
    if (heightInput) {
      heightInput.addEventListener('input', (e) => {
        exportOptions.customHeight = parseInt(e.target.value) || 842;
        saveExportOptions();
        // Mettre à jour la preview si format personnalisé
        if (exportOptions.format === 'custom') {
          updatePreviewDimensions();
        }
      });
    }

    // Marges
    const marginsInput = panel.querySelector('#panelExportMargins');
    if (marginsInput) {
      marginsInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value) || 0;
        exportOptions.margins = { top: value, right: value, bottom: value, left: value };
        saveExportOptions();
      });
    }

    // Inclure grille
    const includeGrid = panel.querySelector('#panelExportIncludeGrid');
    if (includeGrid) {
      includeGrid.addEventListener('change', (e) => {
        exportOptions.includeGrid = e.target.checked;
        saveExportOptions();
      });
    }

    // Inclure guides
    const includeGuides = panel.querySelector('#panelExportIncludeGuides');
    if (includeGuides) {
      includeGuides.addEventListener('change', (e) => {
        exportOptions.includeGuides = e.target.checked;
        saveExportOptions();
      });
    }

    // Métadonnées
    const titleInput = panel.querySelector('#panelExportTitle');
    const authorInput = panel.querySelector('#panelExportAuthor');
    const subjectInput = panel.querySelector('#panelExportSubject');
    const keywordsInput = panel.querySelector('#panelExportKeywords');

    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        exportOptions.metadata.title = e.target.value;
        saveExportOptions();
      });
    }
    if (authorInput) {
      authorInput.addEventListener('input', (e) => {
        exportOptions.metadata.author = e.target.value;
        saveExportOptions();
      });
    }
    if (subjectInput) {
      subjectInput.addEventListener('input', (e) => {
        exportOptions.metadata.subject = e.target.value;
        saveExportOptions();
      });
    }
    if (keywordsInput) {
      keywordsInput.addEventListener('input', (e) => {
        exportOptions.metadata.keywords = e.target.value;
        saveExportOptions();
      });
    }
  }

  // Obtenir les options d'export
  function getExportOptions() {
    loadExportOptions();
    return { ...exportOptions };
  }

  // Obtenir le scale selon la qualité
  function getScaleForQuality(quality) {
    switch (quality) {
      case 'low': return 1.5;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 2;
    }
  }

  // Obtenir les dimensions selon le format
  function getDimensionsForFormat(format, customWidth, customHeight) {
    switch (format) {
      case 'A5':
        return { width: 559, height: 794 };
      case 'A4':
        return { width: 794, height: 1123 };
      case 'custom':
        return { width: customWidth, height: customHeight };
      default:
        return { width: 559, height: 794 };
    }
  }

  // Mettre à jour les dimensions de la preview selon le format sélectionné
  function updatePreviewDimensions() {
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) {
      console.warn('⚠️ pdfPreview non trouvé pour mise à jour des dimensions');
      return;
    }

    loadExportOptions();
    const dims = getDimensionsForFormat(exportOptions.format, exportOptions.customWidth, exportOptions.customHeight);
    
    // Ajouter une transition pour rendre le changement visible
    pdfPreview.style.transition = 'width 0.3s ease, max-width 0.3s ease, min-width 0.3s ease, max-height 0.3s ease, min-height 0.3s ease';
    
    // Mettre à jour la largeur de la preview avec !important pour surcharger le CSS
    pdfPreview.style.setProperty('width', dims.width + 'px', 'important');
    pdfPreview.style.setProperty('max-width', dims.width + 'px', 'important');
    pdfPreview.style.setProperty('min-width', dims.width + 'px', 'important');
    
    // Mettre à jour la hauteur max/min de la preview
    pdfPreview.style.setProperty('max-height', dims.height + 'px', 'important');
    pdfPreview.style.setProperty('min-height', dims.height + 'px', 'important');
    
    // Retirer la transition après l'animation pour éviter les transitions non désirées
    setTimeout(() => {
      pdfPreview.style.transition = '';
    }, 350);
  }

  // Exposer les fonctions globalement
  window.createExportPanel = createExportPanel;
  window.attachExportEvents = attachExportEvents;
  window.getExportOptions = getExportOptions;
  window.getScaleForQuality = getScaleForQuality;
  window.getDimensionsForFormat = getDimensionsForFormat;
  window.updatePreviewDimensions = updatePreviewDimensions;

  // Initialiser
  loadExportOptions();
  
  // Mettre à jour la preview au chargement avec le format sauvegardé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(updatePreviewDimensions, 100);
    });
  } else {
    setTimeout(updatePreviewDimensions, 100);
  }
})();

