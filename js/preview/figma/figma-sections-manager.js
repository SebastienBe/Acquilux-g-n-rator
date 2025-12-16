// ========================================
// SECTIONS MANAGER - Gestion des sections Figma
// ========================================
// NOTE: Ce fichier contient les fonctions de gestion des sections
// Pour une version complète, voir preview-figma-panel.js lignes 2694-3824

(function() {
  'use strict';

  if (!window.FigmaPanelHelpers) {
    console.error('FigmaPanelHelpers non disponible');
    return;
  }

  const { escapeHtml } = window.FigmaPanelHelpers;

  // Masquer une section complète
  function hideSection(sectionElement) {
    if (!sectionElement) return;
    
    const sectionName = sectionElement.getAttribute('data-section');
    if (!sectionName) return;
    
    sectionElement.classList.add('section-hidden');
    sectionElement.style.display = 'none';
    
    const sectionContent = document.querySelector(`[data-section-content="${sectionName}"]`);
    if (sectionContent) {
      sectionContent.style.display = 'none';
      sectionContent.classList.add('section-hidden');
    }
    
    const hiddenSections = JSON.parse(sessionStorage.getItem('hiddenSections') || '[]');
    if (!hiddenSections.includes(sectionName)) {
      hiddenSections.push(sectionName);
      sessionStorage.setItem('hiddenSections', JSON.stringify(hiddenSections));
    }
    
    console.log(`✅ Section "${sectionName}" masquée`);
  }
  
  // Afficher une section cachée
  function showSection(sectionElement) {
    if (!sectionElement) return;
    
    const sectionName = sectionElement.getAttribute('data-section');
    if (!sectionName) return;
    
    sectionElement.classList.remove('section-hidden');
    sectionElement.style.display = '';
    
    const sectionContent = document.querySelector(`[data-section-content="${sectionName}"]`);
    if (sectionContent) {
      sectionContent.style.display = '';
      sectionContent.classList.remove('section-hidden');
    }
    
    const hiddenSections = JSON.parse(sessionStorage.getItem('hiddenSections') || '[]');
    const index = hiddenSections.indexOf(sectionName);
    if (index > -1) {
      hiddenSections.splice(index, 1);
      sessionStorage.setItem('hiddenSections', JSON.stringify(hiddenSections));
    }
    
    console.log(`✅ Section "${sectionName}" affichée`);
  }
  
  // Restaurer l'état des sections au chargement
  function restoreHiddenSections() {
    const hiddenSections = JSON.parse(sessionStorage.getItem('hiddenSections') || '[]');
    if (hiddenSections.length === 0) return;
    
    hiddenSections.forEach(sectionName => {
      const sectionElement = document.querySelector(`[data-section="${sectionName}"]`);
      const sectionContent = document.querySelector(`[data-section-content="${sectionName}"]`);
      
      if (sectionElement) {
        sectionElement.classList.add('section-hidden');
        sectionElement.style.display = 'none';
      }
      
      if (sectionContent) {
        sectionContent.style.display = 'none';
        sectionContent.classList.add('section-hidden');
      }
    });
  }
  
  // Créer et gérer la modal des sections
  let sectionsModal = null;
  
  function createSectionsModal() {
    if (sectionsModal) return sectionsModal;
    
    sectionsModal = document.createElement('div');
    sectionsModal.id = 'sectionsModal';
    sectionsModal.className = 'sections-modal';
    document.body.appendChild(sectionsModal);
    
    return sectionsModal;
  }

  // Déterminer le type de layer
  function getLayerType(element) {
    if (element.id === 'pdfPreview') return 'frame';
    if (element.classList.contains('header-orange-band')) return 'rectangle';
    if (element.classList.contains('badge-group')) return 'group';
    if (element.classList.contains('header-content')) return 'frame';
    if (element.classList.contains('otera-footer')) return 'frame';
    if (element.hasAttribute('data-section')) return 'frame';
    if (element.tagName === 'H1' || element.tagName === 'H2') return 'text';
    if (element.tagName === 'P') return 'text';
    if (element.tagName === 'UL') return 'group';
    if (element.tagName === 'LI') return 'text';
    if (element.classList.contains('recipe')) return 'frame';
    if (element.tagName === 'IMG') return 'image';
    if (element.tagName === 'DIV') return 'frame';
    return 'element';
  }
  
  // Obtenir le nom du layer
  function getLayerName(element) {
    if (element.id === 'pdfPreview') return 'Frame Principal';
    if (element.id === 'headerOrangeBand' || element.classList.contains('header-orange-band')) return 'Header Background';
    if (element.id === 'badgeGroup' || element.classList.contains('badge-group')) return 'Badge Group';
    if (element.id === 'headerContent' || element.classList.contains('header-content')) return 'Header Content';
    if (element.id === 'mainTitle') return 'Titre';
    if (element.id === 'mainSlogan') return 'Slogan';
    if (element.id === 'oteraFooter' || element.classList.contains('otera-footer')) return 'Footer';
    if (element.hasAttribute('data-section')) {
      const sectionName = element.getAttribute('data-section');
      const titles = {
        'caracteristiques': 'Caractéristiques',
        'consommation': '3 Façons de le Consommer',
        'recettes': 'Idées Recettes'
      };
      return titles[sectionName] || `Frame ${sectionName}`;
    }
    if (element.tagName === 'H1') return element.textContent.trim() || 'Titre';
    if (element.tagName === 'H2') {
      const text = element.textContent.trim();
      return text.replace(/[🌿🍴👨‍🍳]/g, '').trim() || 'Section';
    }
    if (element.tagName === 'P' && element.classList.contains('slogan')) return 'Slogan';
    if (element.tagName === 'LI') {
      const strong = element.querySelector('strong');
      if (strong) {
        return strong.textContent.trim() || 'Item';
      }
      return element.textContent.trim().substring(0, 30) || 'Item';
    }
    if (element.classList.contains('recipe')) {
      const strong = element.querySelector('strong');
      if (strong) {
        return strong.textContent.trim().substring(0, 40) || 'Recette';
      }
      return 'Recette';
    }
    if (element.tagName === 'IMG') {
      return element.alt || element.getAttribute('data-badge') || 'Image';
    }
    
    if ((element.tagName === 'UL' || element.tagName === 'DIV') && element.hasAttribute('data-section-content')) {
      const sectionName = element.getAttribute('data-section-content');
      let previousSibling = element.previousElementSibling;
      while (previousSibling) {
        if (previousSibling.tagName === 'H2' && previousSibling.getAttribute('data-section') === sectionName) {
          const title = previousSibling.textContent.trim();
          return title.replace(/[🌿🍴👨‍🍳]/g, '').trim() || `Section ${sectionName}`;
        }
        previousSibling = previousSibling.previousElementSibling;
      }
      const titles = {
        'caracteristiques': 'Caractéristiques',
        'consommation': '3 Façons de le Consommer',
        'recettes': 'Idées Recettes'
      };
      return titles[sectionName] || `Section ${sectionName}`;
    }
    
    return element.className || element.tagName.toLowerCase();
  }
  
  // Obtenir l'icône du layer
  function getLayerIcon(element) {
    const type = getLayerType(element);
    const icons = {
      'frame': '#',
      'rectangle': '▭',
      'group': '⬦',
      'text': 'T',
      'image': '🖼',
      'element': '•'
    };
    return icons[type] || '•';
  }

  // Analyser récursivement la structure HTML pour créer la hiérarchie des layers
  function analyzeLayers(element, depth = 0) {
    if (!element || depth > 15) return null;
    
    const children = Array.from(element.children);
    const layer = {
      element: element,
      type: getLayerType(element),
      name: getLayerName(element),
      icon: getLayerIcon(element),
      children: [],
      isHidden: element.classList.contains('section-hidden') || element.style.display === 'none',
      hasContent: children.length > 0 || element.textContent.trim().length > 0,
      id: element.id || null
    };
    
    const relevantChildren = children.filter(child => {
      if (child.tagName === 'SPAN' && child.classList.contains('emoji')) return false;
      if (child.tagName === 'SPAN' && !child.id && !child.className && child.textContent.trim().length === 0) return false;
      
      if (child.tagName === 'H2' && child.hasAttribute('data-section')) {
        const sectionName = child.getAttribute('data-section');
        let nextSibling = child.nextElementSibling;
        while (nextSibling) {
          if ((nextSibling.tagName === 'UL' || nextSibling.tagName === 'DIV') && 
              nextSibling.getAttribute('data-section-content') === sectionName) {
            return false;
          }
          if (nextSibling.tagName === 'H2') break;
          nextSibling = nextSibling.nextElementSibling;
        }
      }
      
      return true;
    });
    
    relevantChildren.forEach(child => {
      if ((child.tagName === 'UL' || child.tagName === 'DIV') && child.hasAttribute('data-section-content')) {
        const sectionName = child.getAttribute('data-section-content');
        let previousSibling = child.previousElementSibling;
        while (previousSibling) {
          if (previousSibling.tagName === 'H2' && previousSibling.getAttribute('data-section') === sectionName) {
            const childLayer = analyzeLayers(child, depth + 1);
            if (childLayer) {
              const h2Title = previousSibling.textContent.trim().replace(/[🌿🍴👨‍🍳]/g, '').trim();
              if (h2Title) {
                childLayer.name = h2Title;
              }
              layer.children.push(childLayer);
            }
            break;
          }
          previousSibling = previousSibling.previousElementSibling;
        }
        if (!previousSibling || previousSibling.tagName !== 'H2') {
          const childLayer = analyzeLayers(child, depth + 1);
          if (childLayer) {
            layer.children.push(childLayer);
          }
        }
      } else {
        const childLayer = analyzeLayers(child, depth + 1);
        if (childLayer) {
          layer.children.push(childLayer);
        }
      }
    });
    
    return layer;
  }

  // Fonction pour ouvrir la modal des sections (désactivée par défaut)
  function openSectionsModal() {
    console.log('ℹ️ Modal Layers désactivée');
    return;
  }

  // Exposer les fonctions globalement
  window.FigmaSectionsManager = {
    hideSection,
    showSection,
    restoreHiddenSections,
    createSectionsModal,
    analyzeLayers,
    getLayerType,
    getLayerName,
    getLayerIcon,
    openSectionsModal
  };

  // Exposer les fonctions globalement pour compatibilité
  window.hideSection = hideSection;
  window.showSection = showSection;
  window.restoreHiddenSections = restoreHiddenSections;
  window.createSectionsModal = createSectionsModal;
  window.analyzeLayers = analyzeLayers;
  window.getLayerType = getLayerType;
  window.getLayerName = getLayerName;
  window.getLayerIcon = getLayerIcon;
  window.openSectionsModal = openSectionsModal;

  // Restaurer les sections cachées au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreHiddenSections);
  } else {
    setTimeout(restoreHiddenSections, 100);
  }
})();


