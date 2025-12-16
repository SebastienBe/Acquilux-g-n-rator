// ========================================
// HELPERS - Fonctions utilitaires pour les panels Figma
// ========================================

(function() {
  'use strict';

  // Obtenir l'icône pour un type d'élément
  function getIconForType(type) {
    const icons = {
      'title': '📝',
      'slogan': '💬',
      'section': '📑',
      'list-item': '📋',
      'recipe': '🍳',
      'main': '📐',
      'image': '🖼️'
    };
    return icons[type] || '📄';
  }

  // Obtenir le titre pour un type d'élément
  function getTitleForType(type) {
    const titles = {
      'title': 'Title',
      'slogan': 'Slogan',
      'section': 'Section',
      'list-item': 'List Item',
      'recipe': 'Recipe',
      'main': 'Document',
      'image': 'Image'
    };
    return titles[type] || 'Element';
  }

  // Échapper le HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Convertir RGB en Hex
  function rgbToHex(rgb) {
    if (!rgb) return '#F6E2BE';
    if (typeof rgb !== 'string') return '#F6E2BE';
    if (rgb.startsWith('#')) return rgb.toUpperCase();
    
    // Gérer rgb() et rgba()
    const rgbMatch = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const hex = '#' + [1, 2, 3].map(i => {
        const val = parseInt(rgbMatch[i]);
        return ('0' + val.toString(16)).slice(-2).toUpperCase();
      }).join('');
      return hex;
    }
    
    // Gérer les noms de couleurs CSS communs
    const colorMap = {
      'white': '#FFFFFF',
      'black': '#000000',
      'transparent': 'transparent'
    };
    if (colorMap[rgb.toLowerCase()]) {
      return colorMap[rgb.toLowerCase()];
    }
    
    // Valeur par défaut
    return '#F6E2BE';
  }

  // Exposer les fonctions globalement
  window.FigmaPanelHelpers = {
    getIconForType,
    getTitleForType,
    escapeHtml,
    rgbToHex
  };
})();


