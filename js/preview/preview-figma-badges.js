// ========================================
// GESTION AVANCÉE DES BADGES - Style Figma
// ========================================

(function() {
  'use strict';

  let currentBadgeElement = null;
  let badgePanel = null;

  // Créer le panel de gestion avancée des badges
  function createAdvancedBadgePanel(badgeElement) {
    currentBadgeElement = badgeElement;
    
    const computedStyle = window.getComputedStyle(badgeElement);
    const transform = computedStyle.transform || 'none';
    
    // Extraire les valeurs de transform
    let translateX = 0;
    let translateY = 0;
    let rotate = 0;
    let scaleX = 1;
    let scaleY = 1;
    let zIndex = parseInt(computedStyle.zIndex) || 0;

    if (transform !== 'none') {
      const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
      if (matrixMatch) {
        const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
        if (values.length === 6) {
          // matrix(a, b, c, d, e, f) où e = translateX, f = translateY
          translateX = values[4] || 0;
          translateY = values[5] || 0;
          // Calculer la rotation et le scale depuis la matrice
          const a = values[0];
          const b = values[1];
          scaleX = Math.sqrt(a * a + b * b);
          rotate = Math.atan2(b, a) * (180 / Math.PI);
        }
      } else {
        // Essayer d'extraire depuis translate, rotate, scale
        const translateMatch = transform.match(/translate\(([^)]+)\)/);
        if (translateMatch) {
          const coords = translateMatch[1].split(',').map(v => parseFloat(v.trim()));
          translateX = coords[0] || 0;
          translateY = coords[1] || 0;
        }
        const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
        if (rotateMatch) {
          rotate = parseFloat(rotateMatch[1]) || 0;
        }
        const scaleMatch = transform.match(/scale\(([^)]+)\)/);
        if (scaleMatch) {
          const scales = scaleMatch[1].split(',').map(v => parseFloat(v.trim()));
          scaleX = scales[0] || 1;
          scaleY = scales[1] || scales[0] || 1;
        }
      }
    }

    // Obtenir la position absolue si disponible
    const left = parseFloat(computedStyle.left) || 0;
    const top = parseFloat(computedStyle.top) || 0;

    return `
      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">🏷️</span>
          <h3>Badge Position</h3>
        </div>
        
        <!-- Position X -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">X</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelBadgeX" class="figma-number-input" value="${Math.round(left + translateX)}" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>

        <!-- Position Y -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Y</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelBadgeY" class="figma-number-input" value="${Math.round(top + translateY)}" step="1">
              <span class="figma-unit">px</span>
            </div>
          </div>
        </div>
      </div>

      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">🔄</span>
          <h3>Transform</h3>
        </div>
        
        <!-- Rotation -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Rotation</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelBadgeRotate" class="figma-number-input" value="${Math.round(rotate)}" step="1" min="-180" max="180">
              <span class="figma-unit">°</span>
            </div>
          </div>
        </div>

        <!-- Scale X -->
        <div class="figma-control-row">
          <div class="figma-control-group">
            <label class="figma-label">Scale X</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelBadgeScaleX" class="figma-number-input" value="${(scaleX * 100).toFixed(0)}" step="1" min="10" max="300">
              <span class="figma-unit">%</span>
            </div>
          </div>
          <button class="figma-link-btn active" id="panelBadgeScaleLink" title="Lier X et Y">
            <span class="link-icon">🔗</span>
          </button>
          <div class="figma-control-group">
            <label class="figma-label">Scale Y</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelBadgeScaleY" class="figma-number-input" value="${(scaleY * 100).toFixed(0)}" step="1" min="10" max="300">
              <span class="figma-unit">%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="figma-section">
        <div class="section-header">
          <span class="section-icon">📚</span>
          <h3>Layer</h3>
        </div>
        
        <!-- Z-Index -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <label class="figma-label">Z-Index</label>
            <div class="figma-input-wrapper">
              <input type="number" id="panelBadgeZIndex" class="figma-number-input" value="${zIndex}" step="1" min="0" max="1000">
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="figma-control-row">
          <div class="figma-control-group full-width">
            <button class="figma-action-btn figma-action-btn-danger" id="panelBadgeDelete">
              🗑️ Supprimer le badge
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Attacher les événements du panel de badges
  function attachBadgeEvents(panel, badgeElement) {
    let scaleLinked = true;
    const scaleLinkBtn = panel.querySelector('#panelBadgeScaleLink');
    
    if (scaleLinkBtn) {
      scaleLinkBtn.addEventListener('click', () => {
        scaleLinked = !scaleLinked;
        scaleLinkBtn.classList.toggle('active', scaleLinked);
      });
    }

    // Position X
    const badgeXInput = panel.querySelector('#panelBadgeX');
    if (badgeXInput) {
      badgeXInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value) || 0;
        applyBadgePosition(badgeElement, 'x', value);
      });
    }

    // Position Y
    const badgeYInput = panel.querySelector('#panelBadgeY');
    if (badgeYInput) {
      badgeYInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value) || 0;
        applyBadgePosition(badgeElement, 'y', value);
      });
    }

    // Rotation
    const badgeRotateInput = panel.querySelector('#panelBadgeRotate');
    if (badgeRotateInput) {
      badgeRotateInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value) || 0;
        applyBadgeRotation(badgeElement, value);
      });
    }

    // Scale X
    const badgeScaleXInput = panel.querySelector('#panelBadgeScaleX');
    if (badgeScaleXInput) {
      badgeScaleXInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value) / 100 || 1;
        applyBadgeScale(badgeElement, 'x', value, scaleLinked, badgeScaleXInput, panel.querySelector('#panelBadgeScaleY'));
      });
    }

    // Scale Y
    const badgeScaleYInput = panel.querySelector('#panelBadgeScaleY');
    if (badgeScaleYInput) {
      badgeScaleYInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value) / 100 || 1;
        applyBadgeScale(badgeElement, 'y', value, scaleLinked, badgeScaleYInput, panel.querySelector('#panelBadgeScaleX'));
      });
    }

    // Z-Index
    const badgeZIndexInput = panel.querySelector('#panelBadgeZIndex');
    if (badgeZIndexInput) {
      badgeZIndexInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value) || 0;
        badgeElement.style.zIndex = value;
        if (window.saveToHistory) {
          const computedStyle = window.getComputedStyle(badgeElement);
          const oldValue = parseInt(computedStyle.zIndex) || 0;
          window.saveToHistory(badgeElement, 'badge', 'zIndex', oldValue, value);
        }
      });
    }

    // Supprimer le badge
    const badgeDeleteBtn = panel.querySelector('#panelBadgeDelete');
    if (badgeDeleteBtn) {
      badgeDeleteBtn.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce badge ?')) {
          deleteBadge(badgeElement);
        }
      });
    }
  }

  // Appliquer la position du badge
  function applyBadgePosition(element, axis, value) {
    const computedStyle = window.getComputedStyle(element);
    const currentTransform = computedStyle.transform || 'none';
    
    // Extraire les valeurs actuelles
    let translateX = 0;
    let translateY = 0;
    let rotate = 0;
    let scaleX = 1;
    let scaleY = 1;

    if (currentTransform !== 'none') {
      const matrixMatch = currentTransform.match(/matrix\(([^)]+)\)/);
      if (matrixMatch) {
        const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
        if (values.length === 6) {
          translateX = values[4] || 0;
          translateY = values[5] || 0;
          scaleX = Math.sqrt(values[0] * values[0] + values[1] * values[1]);
          rotate = Math.atan2(values[1], values[0]) * (180 / Math.PI);
        }
      }
    }

    const left = parseFloat(computedStyle.left) || 0;
    const top = parseFloat(computedStyle.top) || 0;

    if (axis === 'x') {
      const newTranslateX = value - left;
      element.style.transform = `translate(${newTranslateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`;
    } else if (axis === 'y') {
      const newTranslateY = value - top;
      element.style.transform = `translate(${translateX}px, ${newTranslateY}px) rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`;
    }

    if (window.saveToHistory) {
      window.saveToHistory(element, 'badge', `position${axis.toUpperCase()}`, axis === 'x' ? left + translateX : top + translateY, value);
    }
  }

  // Appliquer la rotation du badge
  function applyBadgeRotation(element, degrees) {
    const computedStyle = window.getComputedStyle(element);
    const currentTransform = computedStyle.transform || 'none';
    
    let translateX = 0;
    let translateY = 0;
    let scaleX = 1;
    let scaleY = 1;

    if (currentTransform !== 'none') {
      const matrixMatch = currentTransform.match(/matrix\(([^)]+)\)/);
      if (matrixMatch) {
        const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
        if (values.length === 6) {
          translateX = values[4] || 0;
          translateY = values[5] || 0;
          scaleX = Math.sqrt(values[0] * values[0] + values[1] * values[1]);
          scaleY = Math.sqrt(values[2] * values[2] + values[3] * values[3]);
        }
      }
    }

    element.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${degrees}deg) scale(${scaleX}, ${scaleY})`;
    
    if (window.saveToHistory) {
      window.saveToHistory(element, 'badge', 'rotation', 0, degrees);
    }
  }

  // Appliquer le scale du badge
  function applyBadgeScale(element, axis, value, linked, currentInput, otherInput) {
    const computedStyle = window.getComputedStyle(element);
    const currentTransform = computedStyle.transform || 'none';
    
    let translateX = 0;
    let translateY = 0;
    let rotate = 0;
    let scaleX = 1;
    let scaleY = 1;

    if (currentTransform !== 'none') {
      const matrixMatch = currentTransform.match(/matrix\(([^)]+)\)/);
      if (matrixMatch) {
        const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
        if (values.length === 6) {
          translateX = values[4] || 0;
          translateY = values[5] || 0;
          scaleX = Math.sqrt(values[0] * values[0] + values[1] * values[1]);
          scaleY = Math.sqrt(values[2] * values[2] + values[3] * values[3]);
          rotate = Math.atan2(values[1], values[0]) * (180 / Math.PI);
        }
      }
    }

    if (axis === 'x') {
      scaleX = value;
      if (linked && otherInput) {
        scaleY = value;
        otherInput.value = (value * 100).toFixed(0);
      }
    } else if (axis === 'y') {
      scaleY = value;
      if (linked && otherInput) {
        scaleX = value;
        otherInput.value = (value * 100).toFixed(0);
      }
    }

    element.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`;
    
    if (window.saveToHistory) {
      window.saveToHistory(element, 'badge', `scale${axis.toUpperCase()}`, axis === 'x' ? scaleX : scaleY, value);
    }
  }

  // Supprimer un badge
  function deleteBadge(badgeElement) {
    const badgeName = badgeElement.getAttribute('data-badge');
    if (badgeName) {
      // Retirer le badge de la liste des badges sélectionnés
      if (window.getBadgeNamesArray) {
        const badges = window.getBadgeNamesArray();
        const index = badges.indexOf(badgeName);
        if (index > -1) {
          badges.splice(index, 1);
          // Sauvegarder dans sessionStorage
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('selectedBadges', JSON.stringify(badges));
          }
        }
      }
    }
    
    // Retirer l'élément du DOM
    badgeElement.remove();
    
    // Fermer le panel
    if (window.closeFigmaPanel) {
      window.closeFigmaPanel();
    }
    
    // Mettre à jour le preview si nécessaire
    if (window.updatePreview) {
      window.updatePreview();
    }
  }

  // Ouvrir le panel pour un badge
  function openBadgePanel(badgeElement) {
    if (window.openFigmaPanel) {
      const panelContent = createAdvancedBadgePanel(badgeElement);
      window.openFigmaPanel(badgeElement, 'badge', panelContent);
      
      // Attacher les événements après un court délai
      setTimeout(() => {
        const panel = document.querySelector('.figma-panel');
        if (panel) {
          attachBadgeEvents(panel, badgeElement);
        }
      }, 50);
    }
  }

  // Initialiser les badges cliquables
  function initBadgeClickHandlers() {
    // Attacher les événements de clic sur les badges
    document.addEventListener('click', (e) => {
      const badge = e.target.closest('.badge-instance');
      if (badge) {
        e.preventDefault();
        e.stopPropagation();
        openBadgePanel(badge);
      }
    }, true);
  }

  // Exposer les fonctions globalement
  window.createAdvancedBadgePanel = createAdvancedBadgePanel;
  window.attachBadgeEvents = attachBadgeEvents;
  window.openBadgePanel = openBadgePanel;
  window.initBadgeClickHandlers = initBadgeClickHandlers;

  // Initialiser quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBadgeClickHandlers);
  } else {
    setTimeout(initBadgeClickHandlers, 100);
  }
})();



