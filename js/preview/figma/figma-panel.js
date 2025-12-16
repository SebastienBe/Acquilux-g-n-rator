// ========================================
// FIGMA PANEL - Point d'entrée principal
// ========================================
// Ce fichier charge tous les modules dans le bon ordre

// Les modules doivent être chargés dans cet ordre :
// 1. figma-panel-helpers.js (déjà chargé)
// 2. figma-panel-core.js
// 3. figma-panel-creators.js
// 4. figma-panel-events.js
// 5. figma-sections-manager.js

// Ce fichier sera chargé après tous les autres modules
// et initialisera le système complet

(function() {
  'use strict';

  // Vérifier que tous les modules sont chargés
  if (!window.FigmaPanelHelpers) {
    console.error('❌ FigmaPanelHelpers non chargé');
    return;
  }

  if (!window.FigmaPanelCore) {
    console.error('❌ FigmaPanelCore non chargé');
    return;
  }

  if (!window.FigmaPanelCreators) {
    console.error('❌ FigmaPanelCreators non chargé');
    return;
  }

  if (!window.FigmaPanelEvents) {
    console.error('❌ FigmaPanelEvents non chargé');
    return;
  }

  if (!window.FigmaSectionsManager) {
    console.warn('⚠️ FigmaSectionsManager non chargé (optionnel)');
  }

  if (!window.FigmaPanelEvents) {
    console.error('❌ FigmaPanelEvents non chargé');
    return;
  }

  // Initialiser le système
  if (window.FigmaPanelCore && window.FigmaPanelCore.init) {
    // Initialiser quand le DOM est prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.FigmaPanelCore.init();
      });
    } else {
      setTimeout(() => {
        window.FigmaPanelCore.init();
      }, 100);
    }
  }

  console.log('✅ Figma Panel System initialisé');
})();

