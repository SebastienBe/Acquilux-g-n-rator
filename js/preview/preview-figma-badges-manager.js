// ========================================
// GESTION DES BADGES INTÉGRÉE FIGMA - Sélection et configuration
// ========================================

(function() {
  'use strict';

  let badgeList = [];
  let selectedBadges = [];

  // Charger la liste des badges
  async function loadBadgeList() {
    if (typeof fetchBadgeList !== 'function') {
      console.warn('fetchBadgeList n\'est pas disponible');
      return [];
    }
    
    try {
      const badges = await fetchBadgeList();
      if (!Array.isArray(badges) || badges.length === 0) {
        return [];
      }

      const options = badges.map((b) => {
        if (typeof b === 'string') {
          return { value: b, label: b };
        }
        const value = b.slug || b.name || b.nom || b.label || b.titre || '';
        const label = b.nom || b.name || b.label || b.titre || b.slug || value || 'Badge';
        return { value, label };
      }).filter(o => o.value);

      const seen = new Set();
      badgeList = options.filter(o => {
        if (seen.has(o.value)) return false;
        seen.add(o.value);
        return true;
      });

      return badgeList;
    } catch (error) {
      console.error('Erreur lors du chargement des badges:', error);
      return [];
    }
  }

  // Obtenir les badges sélectionnés
  function getSelectedBadges() {
    const stored = sessionStorage.getItem('badgeNames');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    const single = sessionStorage.getItem('badgeName');
    return single ? [single] : [];
  }

  // Sauvegarder les badges sélectionnés
  function saveSelectedBadges(badges) {
    sessionStorage.setItem('badgeNames', JSON.stringify(badges));
    if (window.updatePreview) {
      window.updatePreview();
    }
    if (window.updateBadgeCount) {
      window.updateBadgeCount();
    }
  }

  // Créer le panel de sélection de badges
  function createBadgeSelectionPanel() {
    selectedBadges = getSelectedBadges();
    const badgeImageBaseUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_BADGE_IMAGE_URL) 
      ? CONFIG.N8N_BADGE_IMAGE_URL 
      : 'https://n8n-seb.sandbox-jerem.com/webhook/fiche_produit/badge';

    // Séparer les badges
    const badgesWithAtout = badgeList.filter(o => o.value.includes('_atout') && !o.value.includes('logo_'));
    const badgesWithLogo = badgeList.filter(o => o.value.includes('logo_'));
    const badgesWithoutSpecial = badgeList.filter(o => !o.value.includes('_atout') && !o.value.includes('logo_'));

    const generateBadgeHTML = (o) => {
      const checked = selectedBadges.includes(o.value) ? 'checked' : '';
      const badgeImageUrl = `${badgeImageBaseUrl}?name=${encodeURIComponent(o.value)}&cb=${Date.now()}`;
      return `
        <label class="figma-badge-choice">
          <input type="checkbox" value="${o.value}" ${checked}>
          <div class="figma-badge-choice-content">
            <img src="${badgeImageUrl}" alt="${Utils.escapeHtml(o.label)}" class="figma-badge-choice-image" loading="lazy">
            <span class="figma-badge-choice-label">${Utils.escapeHtml(o.label)}</span>
          </div>
        </label>
      `;
    };

    const generateFolderHTML = (badges, folderTitle, folderIcon = '📁') => {
      if (badges.length === 0) return '';
      const allBadgesHTML = badges.map(generateBadgeHTML).join('');
      return `
        <div class="figma-badge-folder">
          <button class="figma-badge-folder-toggle" type="button" aria-expanded="false">
            <span class="figma-badge-folder-icon">${folderIcon}</span>
            <span class="figma-badge-folder-title">${folderTitle}</span>
            <span class="figma-badge-folder-arrow">▼</span>
          </button>
          <div class="figma-badge-folder-content" style="display: none;">
            <div class="figma-badge-folder-items">
              ${allBadgesHTML}
            </div>
          </div>
        </div>
      `;
    };

    const logoFolderHTML = generateFolderHTML(badgesWithLogo, 'Logo', '🖼️');
    const atoutFolderHTML = generateFolderHTML(badgesWithAtout, 'Atouts', '🏷️');
    const otherBadgesHTML = badgesWithoutSpecial.map(generateBadgeHTML).join('');

    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">🏷️</span>
          <h3>Sélection des badges</h3>
        </div>
        
        <div class="figma-badge-choices" id="figmaBadgeChoices">
          ${logoFolderHTML}
          ${atoutFolderHTML}
          ${otherBadgesHTML || '<p style="padding: 12px; color: rgba(0,0,0,0.5);">Aucun badge disponible</p>'}
        </div>
      </div>
    `;
  }

  // Attacher les événements de sélection de badges
  function attachBadgeSelectionEvents(panel) {
    const badgeChoices = panel.querySelector('#figmaBadgeChoices');
    if (!badgeChoices) return;

    // Toggle des dossiers
    badgeChoices.querySelectorAll('.figma-badge-folder-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const folder = toggle.closest('.figma-badge-folder');
        const content = folder.querySelector('.figma-badge-folder-content');
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        toggle.setAttribute('aria-expanded', !isExpanded);
        content.style.display = isExpanded ? 'none' : 'block';
        const arrow = toggle.querySelector('.figma-badge-folder-arrow');
        if (arrow) arrow.textContent = isExpanded ? '▼' : '▲';
      });
    });

    // Chargement des images
    badgeChoices.querySelectorAll('.figma-badge-choice-image').forEach(img => {
      img.onerror = function() {
        this.style.display = 'none';
      };
    });

    // Changement de sélection
    badgeChoices.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        const selected = Array.from(badgeChoices.querySelectorAll('input[type="checkbox"]:checked'))
          .map(input => input.value);
        saveSelectedBadges(selected);
        
        // Mettre à jour le compteur
        if (window.updateBadgeCount) {
          window.updateBadgeCount();
        }
      }
    });
  }

  // Créer le panel de configuration des badges
  function createBadgeConfigPanel() {
    selectedBadges = getSelectedBadges();
    if (selectedBadges.length === 0) {
      return `
        <div class="figma-section">
          <div class="section-header">
            <span class="section-icon">⚙️</span>
            <h3>Configuration des badges</h3>
          </div>
          <p style="padding: 12px; color: rgba(0,0,0,0.5);">Sélectionnez des badges pour les configurer</p>
        </div>
      `;
    }

    // Récupérer les layouts sauvegardés
    const layouts = JSON.parse(sessionStorage.getItem('badgeLayouts') || '{}');
    
    let html = `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">⚙️</span>
          <h3>Configuration des badges</h3>
        </div>
    `;

    selectedBadges.forEach((badgeName, idx) => {
      const layout = layouts[idx] || { heightPx: 80, xPercent: 0, yPercent: 0 };
      const badgeImageBaseUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N_BADGE_IMAGE_URL) 
        ? CONFIG.N8N_BADGE_IMAGE_URL 
        : 'https://n8n-seb.sandbox-jerem.com/webhook/fiche_produit/badge';
      const badgeImageUrl = `${badgeImageBaseUrl}?name=${encodeURIComponent(badgeName)}&cb=${Date.now()}`;

      html += `
        <div class="figma-badge-config-item" data-badge-idx="${idx}">
          <div class="figma-badge-config-header">
            <img src="${badgeImageUrl}" alt="${Utils.escapeHtml(badgeName)}" class="figma-badge-config-preview">
            <span class="figma-badge-config-name">${Utils.escapeHtml(badgeName)}</span>
          </div>
          
          <div class="figma-control-row">
            <div class="figma-control-group">
              <label class="figma-label">Taille</label>
              <div class="figma-input-wrapper">
                <input type="number" class="figma-number-input" data-property="heightPx" data-idx="${idx}" value="${layout.heightPx || 80}" min="20" max="200" step="5">
                <span class="figma-unit">px</span>
              </div>
            </div>
          </div>
          
          <div class="figma-control-row">
            <div class="figma-control-group">
              <label class="figma-label">Position X</label>
              <div class="figma-input-wrapper">
                <input type="number" class="figma-number-input" data-property="xPercent" data-idx="${idx}" value="${layout.xPercent || 0}" min="0" max="100" step="1">
                <span class="figma-unit">%</span>
              </div>
            </div>
            <div class="figma-control-group">
              <label class="figma-label">Position Y</label>
              <div class="figma-input-wrapper">
                <input type="number" class="figma-number-input" data-property="yPercent" data-idx="${idx}" value="${layout.yPercent || 0}" min="0" max="100" step="1">
                <span class="figma-unit">%</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  }

  // Attacher les événements de configuration
  function attachBadgeConfigEvents(panel) {
    panel.querySelectorAll('input[data-idx]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const property = e.target.dataset.property;
        const value = parseFloat(e.target.value) || 0;

        // Récupérer les layouts
        const layouts = JSON.parse(sessionStorage.getItem('badgeLayouts') || '{}');
        if (!layouts[idx]) {
          layouts[idx] = {};
        }
        layouts[idx][property] = value;

        // Sauvegarder
        sessionStorage.setItem('badgeLayouts', JSON.stringify(layouts));

        // Appliquer au preview
        if (window.applyBadgeLayoutsToPreview) {
          window.applyBadgeLayoutsToPreview();
        }
      });
    });
  }

  // Initialiser et charger les badges
  async function initBadgeManager() {
    await loadBadgeList();
  }

  // Exposer les fonctions globalement
  window.createBadgeSelectionPanel = createBadgeSelectionPanel;
  window.attachBadgeSelectionEvents = attachBadgeSelectionEvents;
  window.createBadgeConfigPanel = createBadgeConfigPanel;
  window.attachBadgeConfigEvents = attachBadgeConfigEvents;
  window.initBadgeManager = initBadgeManager;
  window.getSelectedBadges = getSelectedBadges;
  window.saveSelectedBadges = saveSelectedBadges;

  // Initialiser au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBadgeManager);
  } else {
    setTimeout(initBadgeManager, 100);
  }
})();







