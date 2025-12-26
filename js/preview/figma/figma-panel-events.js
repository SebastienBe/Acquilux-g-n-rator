// ========================================
// EVENTS - Gestion des événements des panels Figma
// ========================================
// NOTE: Ce fichier est volumineux car il contient toute la logique d'événements
// Pour une version complète, voir preview-figma-panel.js lignes 1327-2606

(function() {
  'use strict';

  if (!window.FigmaPanelHelpers) {
    console.error('FigmaPanelHelpers non disponible');
    return;
  }

  if (!window.FigmaPanelCore) {
    console.error('FigmaPanelCore non disponible');
    return;
  }

  const { rgbToHex } = window.FigmaPanelHelpers;
  const { closePanel, saveToHistory } = window.FigmaPanelCore;

  // Obtenir currentPanel et currentElement depuis FigmaPanelCore
  function getCurrentPanel() {
    return window.FigmaPanelCore.getCurrentPanel();
  }

  function getCurrentElement() {
    return window.FigmaPanelCore.getCurrentElement();
  }

  // Attacher les événements du panel d'image
  function attachImagePanelEvents(panel, element) {
    if (!element || element.tagName !== 'IMG') return;

    const panelId = element.dataset.imagePanelId || panel.querySelector('[data-panel-id]')?.dataset.panelId || `image-panel-${Date.now()}`;
    let maintainRatio = true;
    let currentRotation = 0;
    let currentScaleX = 1;
    let currentScaleY = 1;
    let currentZoom = 100;
    let cropTop = 0;
    let cropRight = 0;
    let cropBottom = 0;
    let cropLeft = 0;
    let blockOffsetY = 0;

    const transformMatch = element.style.transform ? element.style.transform.match(/rotate\((-?\d+)deg\)/) : null;
    if (transformMatch) {
      currentRotation = parseInt(transformMatch[1]);
    }
    const scaleXMatch = element.style.transform ? element.style.transform.match(/scaleX\((-?\d+(?:\.\d+)?)\)/) : null;
    if (scaleXMatch) {
      currentScaleX = parseFloat(scaleXMatch[1]);
    }
    const scaleYMatch = element.style.transform ? element.style.transform.match(/scaleY\((-?\d+(?:\.\d+)?)\)/) : null;
    if (scaleYMatch) {
      currentScaleY = parseFloat(scaleYMatch[1]);
    }

    function applyImageTransform() {
      const widthInput = panel.querySelector(`[data-image-width][data-panel-id="${panelId}"]`);
      const heightInput = panel.querySelector(`[data-image-height][data-panel-id="${panelId}"]`);
      const rotationInput = panel.querySelector(`[data-image-rotation][data-panel-id="${panelId}"]`);
      const brightnessInput = panel.querySelector(`[data-image-brightness][data-panel-id="${panelId}"]`);
      const contrastInput = panel.querySelector(`[data-image-contrast][data-panel-id="${panelId}"]`);
      const saturationInput = panel.querySelector(`[data-image-saturation][data-panel-id="${panelId}"]`);
      const zoomInput = panel.querySelector(`[data-image-zoom][data-panel-id="${panelId}"]`);
      const posXInput = panel.querySelector(`[data-image-pos-x][data-panel-id="${panelId}"]`);
      const posYInput = panel.querySelector(`[data-image-pos-y][data-panel-id="${panelId}"]`);
      const cropTopInput = panel.querySelector(`[data-image-crop-top][data-panel-id="${panelId}"]`);
      const blockOffsetInput = panel.querySelector(`[data-image-block-offset-y][data-panel-id="${panelId}"]`);
      const cropRightInput = panel.querySelector(`[data-image-crop-right][data-panel-id="${panelId}"]`);
      const cropBottomInput = panel.querySelector(`[data-image-crop-bottom][data-panel-id="${panelId}"]`);
      const cropLeftInput = panel.querySelector(`[data-image-crop-left][data-panel-id="${panelId}"]`);

      const width = widthInput ? parseInt(widthInput.value) || 100 : 100;
      const height = heightInput ? parseInt(heightInput.value) || 100 : 100;
      const rotation = rotationInput ? parseInt(rotationInput.value) || 0 : 0;
      const brightness = brightnessInput ? parseInt(brightnessInput.value) || 100 : 100;
      const contrast = contrastInput ? parseInt(contrastInput.value) || 100 : 100;
      const saturation = saturationInput ? parseInt(saturationInput.value) || 100 : 100;
      // Zoom et crop supprimés - valeurs fixes
      const zoom = 100;
      const posX = posXInput ? parseInt(posXInput.value) || 50 : 50;
      const posY = posYInput ? parseInt(posYInput.value) || 50 : 50;
      currentZoom = 100;

      cropTop = 0;
      cropRight = 0;
      cropBottom = 0;
      cropLeft = 0;
      blockOffsetY = blockOffsetInput ? parseInt(blockOffsetInput.value) || 0 : 0;

      try {
        // Zoom et crop supprimés - ne plus sauvegarder
        element.dataset.widthPercent = String(width);
        element.dataset.heightPercent = String(height);
      } catch (e) {
        console.warn('⚠️ Impossible de sauvegarder les données sur l\'image:', e);
      }

      element.style.width = `${width}%`;
      element.style.height = `${height}%`;
      // Zoom supprimé - pas de zoomFactor
      element.style.transform = `rotate(${rotation}deg) scaleX(${currentScaleX}) scaleY(${currentScaleY})`;
      element.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      element.style.clipPath = 'none';
      
      if (element.parentElement) {
        const container = element.parentElement;
        // Calculer la hauteur de base SANS tenir compte du crop
        // Le crop est géré uniquement via object-position, pas via la réduction de hauteur
        const containerWidth = container.clientWidth || element.clientWidth || 1;
        const ratio = element.naturalHeight && element.naturalWidth
          ? element.naturalHeight / element.naturalWidth
          : 1;
        let containerHeight = containerWidth * ratio;
        containerHeight *= (height / 100);
        // Zoom supprimé - ne plus multiplier par zoom
        // Réduire la hauteur de base de 40px pour un meilleur rendu
        containerHeight = Math.max(80, containerHeight - 40);
        
        // Crop supprimé - utiliser simplement la position Y sans ajustements de crop
        element.style.objectPosition = `${posX}% ${posY}%`;
        
        // Appliquer la hauteur du conteneur (sans réduction par le crop)
        container.style.height = `${containerHeight}px`;
        // Rendre le conteneur flottant pour éviter l'impact des marges du contenu
        container.style.position = 'absolute';
        container.style.left = '0';
        container.style.right = '0';
        container.style.margin = '0';
        // Utiliser top au lieu de marginTop pour le positionnement vertical
        const topValue = 50 + blockOffsetY;
        container.style.top = `${topValue}px`;
        container.style.transform = '';
        container.style.display = 'block';
        
        // Créer ou mettre à jour un élément spacer pour réserver l'espace dans le flux
        // (nécessaire car position: absolute sort l'élément du flux)
        let spacer = container.previousElementSibling;
        if (!spacer || !spacer.classList.contains('product-image-spacer')) {
          spacer = document.createElement('div');
          spacer.className = 'product-image-spacer';
          spacer.style.display = 'block';
          spacer.style.width = '100%';
          spacer.style.height = '0';
          spacer.style.margin = '0';
          spacer.style.padding = '0';
          container.parentElement.insertBefore(spacer, container);
        }
        // Ajuster la hauteur du spacer pour réserver l'espace (hauteur + top)
        spacer.style.height = `${containerHeight + topValue}px`;
      } else {
        // Si pas de conteneur parent, appliquer object-position normalement
        element.style.objectPosition = `${posX}% ${posY}%`;
      }
    }

    // Fill / Fit / Crop buttons
    panel.querySelectorAll(`[data-image-fit][data-panel-id="${panelId}"]`).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const fit = e.currentTarget.dataset.imageFit;
        element.style.objectFit = fit;
        panel.querySelectorAll(`[data-image-fit][data-panel-id="${panelId}"]`).forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });

    // Position select
    const positionSelect = panel.querySelector(`[data-image-position][data-panel-id="${panelId}"]`);
    if (positionSelect) {
      positionSelect.addEventListener('change', (e) => {
        element.style.objectPosition = e.target.value;
        const { x, y } = (function(pos) {
          const map = {
            'center': { x: 50, y: 50 },
            'top': { x: 50, y: 0 },
            'bottom': { x: 50, y: 100 },
            'left': { x: 0, y: 50 },
            'right': { x: 100, y: 50 },
            'top left': { x: 0, y: 0 },
            'top right': { x: 100, y: 0 },
            'bottom left': { x: 0, y: 100 },
            'bottom right': { x: 100, y: 100 }
          };
          return map[pos] || { x: 50, y: 50 };
        })(e.target.value);
        const posXInput = panel.querySelector(`[data-image-pos-x][data-panel-id="${panelId}"]`);
        const posYInput = panel.querySelector(`[data-image-pos-y][data-panel-id="${panelId}"]`);
        const posXValue = panel.querySelector(`[data-image-pos-x-value]`);
        const posYValue = panel.querySelector(`[data-image-pos-y-value]`);
        if (posXInput) posXInput.value = x;
        if (posYInput) posYInput.value = y;
        if (posXValue) posXValue.textContent = `${x}%`;
        if (posYValue) posYValue.textContent = `${y}%`;
      });
    }

    // Width / Height inputs
    const widthInput = panel.querySelector(`[data-image-width][data-panel-id="${panelId}"]`);
    const heightInput = panel.querySelector(`[data-image-height][data-panel-id="${panelId}"]`);
    const maintainRatioBtn = panel.querySelector(`[data-image-maintain-ratio][data-panel-id="${panelId}"]`);

    if (widthInput) {
      widthInput.addEventListener('input', () => {
        if (maintainRatio && heightInput && element.naturalWidth && element.naturalHeight) {
          const aspectRatio = element.naturalHeight / element.naturalWidth;
          const newWidth = parseInt(widthInput.value) || 100;
          const containerWidth = element.parentElement.offsetWidth || 1;
          const newHeightPx = (containerWidth * newWidth / 100) * aspectRatio;
          const containerHeight = element.parentElement.offsetHeight || 1;
          const newHeightPercent = (newHeightPx / containerHeight) * 100;
          heightInput.value = Math.round(newHeightPercent);
        }
        applyImageTransform();
      });
    }

    if (heightInput) {
      heightInput.addEventListener('input', () => {
        if (maintainRatio && widthInput && element.naturalWidth && element.naturalHeight) {
          const aspectRatio = element.naturalWidth / element.naturalHeight;
          const newHeight = parseInt(heightInput.value) || 100;
          const containerHeight = element.parentElement.offsetHeight || 1;
          const newHeightPx = containerHeight * newHeight / 100;
          const containerWidth = element.parentElement.offsetWidth || 1;
          const newWidthPercent = ((newHeightPx * aspectRatio) / containerWidth) * 100;
          widthInput.value = Math.round(newWidthPercent);
        }
        applyImageTransform();
      });
    }

    if (maintainRatioBtn) {
      maintainRatioBtn.addEventListener('click', () => {
        maintainRatio = !maintainRatio;
        maintainRatioBtn.classList.toggle('active', maintainRatio);
      });
      maintainRatioBtn.classList.add('active');
    }

    // Rotation
    const rotationInput = panel.querySelector(`[data-image-rotation][data-panel-id="${panelId}"]`);
    if (rotationInput) {
      rotationInput.addEventListener('input', () => {
        currentRotation = parseInt(rotationInput.value) || 0;
        applyImageTransform();
      });
    }

    // Rotate buttons
    const rotateLeftBtn = panel.querySelector(`[data-image-rotate-left][data-panel-id="${panelId}"]`);
    const rotateRightBtn = panel.querySelector(`[data-image-rotate-right][data-panel-id="${panelId}"]`);
    
    if (rotateLeftBtn) {
      rotateLeftBtn.addEventListener('click', () => {
        currentRotation -= 90;
        if (currentRotation < -180) currentRotation += 360;
        if (rotationInput) rotationInput.value = currentRotation;
        applyImageTransform();
      });
    }

    if (rotateRightBtn) {
      rotateRightBtn.addEventListener('click', () => {
        currentRotation += 90;
        if (currentRotation > 180) currentRotation -= 360;
        if (rotationInput) rotationInput.value = currentRotation;
        applyImageTransform();
      });
    }

    // Flip buttons
    const flipHBtn = panel.querySelector(`[data-image-flip-h][data-panel-id="${panelId}"]`);
    const flipVBtn = panel.querySelector(`[data-image-flip-v][data-panel-id="${panelId}"]`);

    if (flipHBtn) {
      flipHBtn.addEventListener('click', () => {
        currentScaleX *= -1;
        applyImageTransform();
      });
    }

    if (flipVBtn) {
      flipVBtn.addEventListener('click', () => {
        currentScaleY *= -1;
        applyImageTransform();
      });
    }

    // Effects sliders
    const brightnessInput = panel.querySelector(`[data-image-brightness][data-panel-id="${panelId}"]`);
    const contrastInput = panel.querySelector(`[data-image-contrast][data-panel-id="${panelId}"]`);
    const saturationInput = panel.querySelector(`[data-image-saturation][data-panel-id="${panelId}"]`);

    if (brightnessInput) {
      const brightnessValue = panel.querySelector(`[data-image-brightness-value]`);
      brightnessInput.addEventListener('input', () => {
        const value = parseInt(brightnessInput.value) || 100;
        if (brightnessValue) brightnessValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    if (contrastInput) {
      const contrastValue = panel.querySelector(`[data-image-contrast-value]`);
      contrastInput.addEventListener('input', () => {
        const value = parseInt(contrastInput.value) || 100;
        if (contrastValue) contrastValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    if (saturationInput) {
      const saturationValue = panel.querySelector(`[data-image-saturation-value]`);
      saturationInput.addEventListener('input', () => {
        const value = parseInt(saturationInput.value) || 100;
        if (saturationValue) saturationValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    // Zoom supprimé - code désactivé

    // Position fine X/Y
    const posXInput = panel.querySelector(`[data-image-pos-x][data-panel-id="${panelId}"]`);
    const posYInput = panel.querySelector(`[data-image-pos-y][data-panel-id="${panelId}"]`);
    const posXValue = panel.querySelector(`[data-image-pos-x-value]`);
    const posYValue = panel.querySelector(`[data-image-pos-y-value]`);

    if (posXInput) {
      posXInput.addEventListener('input', () => {
        const value = parseInt(posXInput.value) || 50;
        if (posXValue) posXValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    if (posYInput) {
      posYInput.addEventListener('input', () => {
        const value = parseInt(posYInput.value) || 50;
        if (posYValue) posYValue.textContent = `${value}%`;
        applyImageTransform();
      });
    }

    // Crop sliders supprimés - code désactivé

    // Déplacement du bloc (translateY sur le conteneur)
    const blockOffsetInput = panel.querySelector(`[data-image-block-offset-y][data-panel-id="${panelId}"]`);
    const blockOffsetValue = panel.querySelector(`[data-image-block-offset-y-value]`);
    if (blockOffsetInput) {
      blockOffsetInput.addEventListener('input', () => {
        const value = parseInt(blockOffsetInput.value) || 0;
        blockOffsetY = value;
        if (blockOffsetValue) blockOffsetValue.textContent = `${value}px`;
        applyImageTransform();
      });
    }

    // Reset button
    const resetBtn = panel.querySelector(`[data-image-reset][data-panel-id="${panelId}"]`);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (widthInput) widthInput.value = 100;
        if (heightInput) heightInput.value = 100;
        if (rotationInput) {
          rotationInput.value = 0;
          currentRotation = 0;
        }
        if (brightnessInput) {
          brightnessInput.value = 100;
          const brightnessValue = panel.querySelector(`[data-image-brightness-value]`);
          if (brightnessValue) brightnessValue.textContent = '100%';
        }
        if (contrastInput) {
          contrastInput.value = 100;
          const contrastValue = panel.querySelector(`[data-image-contrast-value]`);
          if (contrastValue) contrastValue.textContent = '100%';
        }
        if (saturationInput) {
          saturationInput.value = 100;
          const saturationValue = panel.querySelector(`[data-image-saturation-value]`);
          if (saturationValue) saturationValue.textContent = '100%';
        }
        // Zoom et crop supprimés - réinitialisation désactivée
        currentZoom = 100;
        const posXInput = panel.querySelector(`[data-image-pos-x][data-panel-id="${panelId}"]`);
        const posYInput = panel.querySelector(`[data-image-pos-y][data-panel-id="${panelId}"]`);
        const posXValue = panel.querySelector(`[data-image-pos-x-value]`);
        const posYValue = panel.querySelector(`[data-image-pos-y-value]`);
        if (posXInput) posXInput.value = 50;
        if (posYInput) posYInput.value = 50;
        if (posXValue) posXValue.textContent = '50%';
        if (posYValue) posYValue.textContent = '50%';
        currentScaleX = 1;
        currentScaleY = 1;
        element.style.objectFit = 'cover';
        element.style.objectPosition = 'center';
        element.style.clipPath = 'none';
        blockOffsetY = 0;
        const blockOffsetInput = panel.querySelector(`[data-image-block-offset-y][data-panel-id="${panelId}"]`);
        const blockOffsetValue = panel.querySelector(`[data-image-block-offset-y-value]`);
        if (blockOffsetInput) blockOffsetInput.value = 0;
        if (blockOffsetValue) blockOffsetValue.textContent = '0px';
        if (element.parentElement) {
          const container = element.parentElement;
          // Calculer et appliquer la hauteur d'abord
          const containerWidth = container.clientWidth || element.clientWidth || 1;
          const ratio = element.naturalHeight && element.naturalWidth
            ? element.naturalHeight / element.naturalWidth
            : 1;
          // Appliquer la même réduction de 40px que dans applyImageTransform
          const baseHeight = Math.max(160, containerWidth * ratio - 40);
          container.style.height = `${baseHeight}px`;
          // Rendre le conteneur flottant et réinitialiser le top à la valeur de base de 50px
          container.style.position = 'absolute';
          container.style.left = '0';
          container.style.right = '0';
          container.style.margin = '0';
          container.style.top = '50px';
          container.style.transform = '';
        }
        panel.querySelectorAll(`[data-image-fit][data-panel-id="${panelId}"]`).forEach(b => {
          b.classList.toggle('active', b.dataset.imageFit === 'cover');
        });
        if (positionSelect) positionSelect.value = 'center';
        applyImageTransform();
      });
    }

    // Delete button
    const deleteBtn = panel.querySelector(`[data-image-delete][data-panel-id="${panelId}"]`);
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
          element.remove();
          closePanel();
        }
      });
    }
  }

  // Attacher les événements du panel
  function attachPanelEvents(panel, element, type) {
    console.log('Attachement des événements pour:', type, element);
    
    // Actions spécifiques
    panel.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = e.currentTarget.dataset.action;
        console.log('Action:', action);
        handlePanelAction(action, element, e.currentTarget);
      });
    });

    // Bouton d'application pour la couleur du header
    const applyHeaderBgBtn = panel.querySelector('#applyHeaderBgColorBtn');
    if (applyHeaderBgBtn) {
      applyHeaderBgBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Bouton Appliquer cliqué pour header background');
        applyPanelChanges(element, type, panel);
      });
    }

    // Bouton d'application pour la couleur de fond du PDF
    const applyMainBgBtn = panel.querySelector('#applyMainBgColorBtn');
    if (applyMainBgBtn) {
      applyMainBgBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Bouton Appliquer cliqué pour main background');
        applyPanelChanges(element, type, panel);
      });
    }
    
    // Mise à jour en temps réel pour tous les champs
    const inputs = panel.querySelectorAll('input, textarea, select');
    console.log('Nombre d\'inputs trouvés:', inputs.length);
    
    inputs.forEach(input => {
      if (input.type === 'color') {
        const textInput = panel.querySelector(`#${input.id}Text`);
        console.log('🔵 [DEBUG] Color picker trouvé:', input.id, 'type panel:', type, 'avec textInput:', textInput ? textInput.id : 'none', 'element:', element?.tagName || element?.id || 'none');
        
        if (textInput) {
          input.addEventListener('input', (e) => {
            textInput.value = e.target.value;
            console.log('🟢 [DEBUG] Color picker changed - EVENT DÉCLENCHÉ:', {
              inputId: input.id,
              nouvelleValeur: e.target.value,
              type: type,
              element: element?.tagName || element?.id || 'none',
              panel: panel ? 'présent' : 'absent'
            });
            applyPanelChanges(element, type, panel);
          });
          
          textInput.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
              input.value = e.target.value;
              console.log('🟢 [DEBUG] Color text changed - EVENT DÉCLENCHÉ:', {
                textInputId: textInput.id,
                nouvelleValeur: e.target.value,
                type: type,
                element: element?.tagName || element?.id || 'none'
              });
              applyPanelChanges(element, type, panel);
            } else {
              console.log('⚠️ [DEBUG] Color text invalide:', e.target.value);
            }
          });
        } else {
          input.addEventListener('input', (e) => {
            console.log('🟢 [DEBUG] Color input changed (sans textInput) - EVENT DÉCLENCHÉ:', {
              inputId: input.id,
              nouvelleValeur: e.target.value,
              type: type
            });
            applyPanelChanges(element, type, panel);
          });
        }
      } else if (input.type === 'number') {
        input.addEventListener('input', (e) => {
          console.log('Number input changed:', input.id, e.target.value);
          applyPanelChanges(element, type, panel);
        });
        input.addEventListener('change', (e) => {
          console.log('Number input changed (change):', input.id, e.target.value);
          applyPanelChanges(element, type, panel);
        });
      } else if (input.tagName === 'SELECT') {
        input.addEventListener('change', (e) => {
          console.log('Select changed:', input.id, e.target.value);
          applyPanelChanges(element, type, panel);
        });
      } else {
        input.addEventListener('input', (e) => {
          console.log('Text input changed:', input.id, e.target.value);
          applyPanelChanges(element, type, panel);
        });
      }
    });
  }

  // Appliquer les changements en temps réel
  function applyPanelChanges(element, type, panel) {
    console.log('🔷 [DEBUG] applyPanelChanges DÉBUT - type:', type, 'panel:', panel ? 'présent' : 'absent', 'element:', element?.tagName || element?.id || 'none');
    
    if (!panel) {
      console.error('❌ [DEBUG] applyPanelChanges: panel manquant pour type:', type);
      return;
    }
    
    const targetElement = element || getCurrentElement();
    console.log('✅ [DEBUG] applyPanelChanges - panel trouvé, type:', type, 'targetElement:', targetElement?.tagName || targetElement?.id || 'none');
    
    if (type === 'main') {
      // Ne pas vérifier targetElement pour le type 'main'
    } else if (!targetElement) {
      console.warn('⚠️ [DEBUG] targetElement non défini pour type:', type, 'mais continuons quand même');
    }
    
    try {
      switch (type) {
        case 'title':
          if (!targetElement) {
            console.error('❌ [DEBUG] targetElement manquant pour type title');
            break;
          }
          const titleText = panel.querySelector('#panelTitleText')?.value || '';
          const oldTitleText = targetElement.textContent || '';
          if (oldTitleText !== titleText) {
            if (typeof saveToHistory === 'function') {
              saveToHistory(targetElement, type, 'text', oldTitleText, titleText);
            }
            targetElement.textContent = titleText;
            if (window.currentPdfContent) {
              window.currentPdfContent.titre = titleText;
              if (window.currentPdfContent.title !== undefined) {
                window.currentPdfContent.title = titleText;
              }
            }
          }
          
          const pdfPreviewForHeader = document.getElementById('pdfPreview');
          const headerBand = pdfPreviewForHeader?.querySelector('.header-orange-band');
          const headerContent = pdfPreviewForHeader?.querySelector('.header-content');
          
          if (headerBand && headerContent) {
            const headerBgColorInput = panel.querySelector('#panelHeaderBgColor');
            const headerBgColorText = panel.querySelector('#panelHeaderBgColorText');
            const headerBgColor = headerBgColorInput?.value || headerBgColorText?.value || '#E65B0C';
            
            const headerHeightInput = panel.querySelector('#panelHeaderHeight');
            const headerHeight = headerHeightInput ? parseFloat(headerHeightInput.value) || 90 : 90;
            
            const paddingTopInput = panel.querySelector('#panelHeaderPaddingTop');
            const paddingRightInput = panel.querySelector('#panelHeaderPaddingRight');
            const paddingBottomInput = panel.querySelector('#panelHeaderPaddingBottom');
            const paddingLeftInput = panel.querySelector('#panelHeaderPaddingLeft');
            
            const paddingTop = paddingTopInput ? parseFloat(paddingTopInput.value) || 10 : 10;
            const paddingRight = paddingRightInput ? parseFloat(paddingRightInput.value) || 20 : 20;
            const paddingBottom = paddingBottomInput ? parseFloat(paddingBottomInput.value) || 10 : 10;
            const paddingLeft = paddingLeftInput ? parseFloat(paddingLeftInput.value) || 20 : 20;
            
            const oldHeaderColor = headerBand.style.backgroundColor || window.getComputedStyle(headerBand).backgroundColor || '#E65B0C';
            const oldHeaderColorHex = rgbToHex(oldHeaderColor);
            const newHeaderColorHex = rgbToHex(headerBgColor);
            if (oldHeaderColorHex.toLowerCase() !== newHeaderColorHex.toLowerCase()) {
              if (typeof saveToHistory === 'function') {
                saveToHistory(headerBand, type, 'headerBackgroundColor', oldHeaderColorHex, newHeaderColorHex);
              }
            }
            headerBand.style.setProperty('background-color', headerBgColor, 'important');
            headerBand.style.backgroundColor = headerBgColor;
            
            headerBand.style.setProperty('height', `${headerHeight}px`, 'important');
            headerBand.style.height = `${headerHeight}px`;
            headerContent.style.setProperty('min-height', `${headerHeight}px`, 'important');
            headerContent.style.minHeight = `${headerHeight}px`;
            
            const paddingValue = `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`;
            headerContent.style.setProperty('padding', paddingValue, 'important');
            headerContent.style.padding = paddingValue;
          }
          
          applyTypographyChanges(targetElement, panel);
          break;
        case 'slogan':
          if (!targetElement) {
            console.error('❌ [DEBUG] targetElement manquant pour type slogan');
            break;
          }
          const sloganText = panel.querySelector('#panelSloganText')?.value || '';
          const oldSloganText = targetElement.textContent || '';
          if (oldSloganText !== sloganText) {
            if (typeof saveToHistory === 'function') {
              saveToHistory(targetElement, type, 'text', oldSloganText, sloganText);
            }
            targetElement.textContent = sloganText;
            if (window.currentPdfContent) {
              window.currentPdfContent.slogan = sloganText;
            }
          }
          applyTypographyChanges(targetElement, panel);
          applySpacingChanges(targetElement, panel);
          break;
        case 'section':
          if (!targetElement) {
            console.error('❌ [DEBUG] targetElement manquant pour type section');
            break;
          }
          const sectionText = panel.querySelector('#panelSectionText')?.value || '';
          const currentText = targetElement.textContent || '';
          if (currentText.trim() !== sectionText.trim()) {
            const emoji = targetElement.querySelector('.emoji');
            const oldText = currentText;
            if (emoji) {
              targetElement.innerHTML = `<span class="emoji">${emoji.textContent}</span> ${sectionText}`;
            } else {
              targetElement.textContent = sectionText;
            }
            if (typeof saveToHistory === 'function') {
              saveToHistory(targetElement, type, 'text', oldText, sectionText);
            }
          }
          applyTypographyChanges(targetElement, panel);
          applySpacingChanges(targetElement, panel);
          break;
        case 'list-item':
          if (!targetElement) {
            console.error('❌ [DEBUG] targetElement manquant pour type list-item');
            break;
          }
          const listType = targetElement.getAttribute('data-list-type');
          console.log('list-item type:', listType);
          if (listType === 'caracteristic') {
            const type = panel.querySelector('#panelListItemType')?.value || '';
            const desc = panel.querySelector('#panelListItemDesc')?.value || '';
            const index = parseInt(targetElement.getAttribute('data-list-index'));
            
            const caracArray = window.currentPdfContent?.caracteristiques || window.currentPdfContent?.caracteristic;
            const oldValue = caracArray && caracArray[index] ? {...caracArray[index]} : { type: '', description: '' };
            const newValue = { type, description: desc };
            
            targetElement.innerHTML = `<strong>${type}</strong>: ${desc}`;
            
            if (caracArray && caracArray[index] !== undefined) {
              caracArray[index] = newValue;
            }
            
            if (typeof saveToHistory === 'function') {
              saveToHistory(targetElement, type, 'listItem', oldValue, newValue);
            }
          } else {
            const text = panel.querySelector('#panelListItemText')?.value || '';
            const index = parseInt(targetElement.getAttribute('data-list-index'));
            const oldText = targetElement.textContent || '';
            
            if (typeof saveToHistory === 'function') {
              saveToHistory(targetElement, type, 'listItem', oldText, text);
            }
            targetElement.textContent = text;
            if (window.currentPdfContent && window.currentPdfContent.consommation) {
              window.currentPdfContent.consommation[index] = text;
            }
          }
          applyTypographyChanges(targetElement, panel);
          applySpacingChanges(targetElement, panel);
          break;
        case 'recipe':
          if (!targetElement) {
            console.error('❌ [DEBUG] targetElement manquant pour type recipe');
            break;
          }
          const name = panel.querySelector('#panelRecipeName')?.value || '';
          const recipeType = panel.querySelector('#panelRecipeType')?.value || '';
          const ingredients = panel.querySelector('#panelRecipeIngredients')?.value || '';
          const astuce = panel.querySelector('#panelRecipeAstuce')?.value || '';
          const recipeIndex = parseInt(targetElement.getAttribute('data-recipe-index'));
          
          const recetteArray = window.currentPdfContent?.recettes || window.currentPdfContent?.recette;
          const oldRecipe = recetteArray && recetteArray[recipeIndex] ? {...recetteArray[recipeIndex]} : { nom: '', type: 'Sucrée', ingredients: '', astuce: '' };
          const newRecipe = {
            nom: name,
            type: recipeType,
            ingredients: ingredients,
            astuce: astuce
          };
          
          const strong = targetElement.querySelector('strong');
          if (strong) {
            strong.textContent = `Recette ${recipeType} : ${name}`;
          }
          const ingredientsEl = targetElement.querySelector('.recipe-ingredients .ingredients-content');
          if (ingredientsEl) {
            ingredientsEl.textContent = ingredients;
          }
          const astuceEl = targetElement.querySelector('.recipe-astuce');
          if (astuceEl) {
            astuceEl.textContent = astuce ? `💡 Astuce : ${astuce}` : '';
          } else if (astuce) {
            const newAstuceEl = document.createElement('em');
            newAstuceEl.className = 'recipe-astuce';
            newAstuceEl.textContent = `💡 Astuce : ${astuce}`;
            targetElement.appendChild(newAstuceEl);
          }
          
          if (recetteArray && recetteArray[recipeIndex] !== undefined) {
            recetteArray[recipeIndex] = newRecipe;
          }
          
          if (typeof saveToHistory === 'function') {
            saveToHistory(targetElement, type, 'recipe', oldRecipe, newRecipe);
          }
          applyTypographyChanges(targetElement, panel);
          break;
        case 'main':
          console.log('🔵 [DEBUG] case main - début');
          const width = panel.querySelector('#panelMainWidth')?.value || '595';
          const padding = panel.querySelector('#panelMainPadding')?.value || '20';
          const bgColorInput = panel.querySelector('#panelMainBgColor');
          const bgColorText = panel.querySelector('#panelMainBgColorText');
          const bgColor = bgColorInput?.value || bgColorText?.value || '#F6E2BE';
          
          const pdfPreviewElement = document.getElementById('pdfPreview');
          if (pdfPreviewElement) {
            const computedStyle = window.getComputedStyle(pdfPreviewElement);
            const oldWidth = parseFloat(pdfPreviewElement.style.width || computedStyle.width) || 595;
            const oldPadding = parseFloat(pdfPreviewElement.style.padding || computedStyle.padding) || 20;
            const oldBgColor = pdfPreviewElement.style.backgroundColor || computedStyle.backgroundColor || '#F6E2BE';
            
            const newWidth = parseFloat(width);
            const newPadding = parseFloat(padding);
            const oldBgColorHex = rgbToHex(oldBgColor);
            const newBgColorHex = rgbToHex(bgColor);
            
            if (oldWidth !== newWidth) {
              if (typeof saveToHistory === 'function') {
                saveToHistory(pdfPreviewElement, type, 'width', oldWidth, newWidth);
              }
              pdfPreviewElement.style.width = `${width}px`;
            }
            if (oldPadding !== newPadding) {
              if (typeof saveToHistory === 'function') {
                saveToHistory(pdfPreviewElement, type, 'padding', oldPadding, newPadding);
              }
              pdfPreviewElement.style.padding = `${padding}px`;
            }
            if (oldBgColorHex.toLowerCase() !== newBgColorHex.toLowerCase()) {
              if (typeof saveToHistory === 'function') {
                saveToHistory(pdfPreviewElement, type, 'backgroundColor', oldBgColorHex, newBgColorHex);
              }
            }
            pdfPreviewElement.style.setProperty('background-color', bgColor, 'important');
            pdfPreviewElement.style.backgroundColor = bgColor;
          }
          break;
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erreur dans applyPanelChanges:', error);
      console.error('❌ [DEBUG] Stack trace:', error.stack);
      console.error('❌ [DEBUG] Contexte:', { element, type, panel: panel ? 'présent' : 'absent' });
    }
  }

  // Appliquer les changements de typographie
  function applyTypographyChanges(element, panel) {
    if (!element || !panel) return;
    
    const computedStyle = window.getComputedStyle(element);
    const fontSize = panel.querySelector('#panelFontSize')?.value;
    const fontWeight = panel.querySelector('#panelFontWeight')?.value;
    const lineHeight = panel.querySelector('#panelLineHeight')?.value;
    const colorInput = panel.querySelector('#panelTextColor');
    const color = colorInput?.value || panel.querySelector('#panelTextColorText')?.value;

    const currentPanel = getCurrentPanel();

    if (fontSize) {
      const oldSize = parseFloat(computedStyle.fontSize) || 16;
      const newSize = parseFloat(fontSize);
      if (oldSize !== newSize) {
        if (typeof saveToHistory === 'function') {
          saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'fontSize', oldSize, newSize);
        }
        element.style.fontSize = `${fontSize}px`;
        console.log('Font size appliqué:', fontSize);
      }
    }
    if (fontWeight) {
      const oldWeight = computedStyle.fontWeight || '400';
      if (oldWeight !== fontWeight) {
        if (typeof saveToHistory === 'function') {
          saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'fontWeight', oldWeight, fontWeight);
        }
        element.style.fontWeight = fontWeight;
        console.log('Font weight appliqué:', fontWeight);
      }
    }
    if (lineHeight) {
      const oldLineHeightStr = computedStyle.lineHeight;
      let oldLineHeight = 1.5;
      if (oldLineHeightStr && oldLineHeightStr !== 'normal') {
        if (oldLineHeightStr.includes('px')) {
          const oldLineHeightPx = parseFloat(oldLineHeightStr);
          const currentFontSize = parseFloat(computedStyle.fontSize) || 16;
          oldLineHeight = oldLineHeightPx / currentFontSize;
        } else {
          oldLineHeight = parseFloat(oldLineHeightStr);
        }
      }
      
      const newLineHeight = parseFloat(lineHeight);
      
      if (Math.abs(oldLineHeight - newLineHeight) > 0.01) {
        if (typeof saveToHistory === 'function') {
          saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'lineHeight', oldLineHeight, newLineHeight);
        }
        element.style.lineHeight = newLineHeight.toString();
        console.log('Line height appliqué:', newLineHeight, '(ancien:', oldLineHeight.toFixed(2), ')');
      }
    }
    if (color) {
      const oldColor = rgbToHex(computedStyle.color);
      if (oldColor !== color) {
        if (typeof saveToHistory === 'function') {
          saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'color', oldColor, color);
        }
        element.style.color = color;
        if (colorInput) colorInput.value = color;
        const colorText = panel.querySelector('#panelTextColorText');
        if (colorText) colorText.value = color;
        console.log('Color appliquée:', color);
      }
    }
  }

  // Appliquer les changements d'espacement
  function applySpacingChanges(element, panel) {
    if (!element || !panel) return;
    
    const computedStyle = window.getComputedStyle(element);
    const marginTop = panel.querySelector('#panelMarginTop')?.value;
    const marginBottom = panel.querySelector('#panelMarginBottom')?.value;
    const padding = panel.querySelector('#panelPadding')?.value;

    const currentPanel = getCurrentPanel();

    if (marginTop !== undefined && marginTop !== '') {
      const oldMarginTop = parseFloat(computedStyle.marginTop) || 0;
      const newMarginTop = parseFloat(marginTop);
      if (oldMarginTop !== newMarginTop) {
        if (typeof saveToHistory === 'function') {
          saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'marginTop', oldMarginTop, newMarginTop);
        }
        element.style.marginTop = `${marginTop}px`;
        console.log('Margin top appliqué:', marginTop);
      }
    }
    if (marginBottom !== undefined && marginBottom !== '') {
      const oldMarginBottom = parseFloat(computedStyle.marginBottom) || 0;
      const newMarginBottom = parseFloat(marginBottom);
      if (oldMarginBottom !== newMarginBottom) {
        if (typeof saveToHistory === 'function') {
          saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'marginBottom', oldMarginBottom, newMarginBottom);
        }
        element.style.marginBottom = `${marginBottom}px`;
        console.log('Margin bottom appliqué:', marginBottom);
      }
    }
    if (padding !== undefined && padding !== '') {
      const oldPadding = parseFloat(computedStyle.padding) || 0;
      const newPadding = parseFloat(padding);
      if (oldPadding !== newPadding) {
        if (typeof saveToHistory === 'function') {
          saveToHistory(element, currentPanel?.dataset.panelType || 'unknown', 'padding', oldPadding, newPadding);
        }
        element.style.padding = `${padding}px`;
        console.log('Padding appliqué:', padding);
      }
    }
  }

  // Gérer les actions du panel
  function handlePanelAction(action, element, button) {
    if (!window.FigmaSectionsManager) {
      console.error('FigmaSectionsManager non disponible');
      return;
    }

    const { hideSection, showSection } = window.FigmaSectionsManager;

    switch (action) {
      case 'add-item':
        const section = button.dataset.section;
        if (window.addItemToSection && typeof window.addItemToSection === 'function') {
          window.addItemToSection(section);
        } else {
          const pdfPreview = document.getElementById('pdfPreview');
          if (pdfPreview && window.currentPdfContent) {
            if (section === 'caracteristic' && window.currentPdfContent.caracteristic) {
              window.currentPdfContent.caracteristic.push({ type: '', description: '' });
            } else if (section === 'consommation' && window.currentPdfContent.consommation) {
              window.currentPdfContent.consommation.push('');
            } else if (section === 'recette' && window.currentPdfContent.recette) {
              window.currentPdfContent.recette.push({
                nom: '',
                type: 'Sucrée',
                ingredients: '',
                astuce: ''
              });
            }
            
            if (window.generateHTML && window.updatePreview) {
              window.updatePreview();
            }
          }
        }
        break;
      case 'delete-item':
        if (window.deleteElement && typeof window.deleteElement === 'function') {
          window.deleteElement(element, 'list-item');
        } else {
          if (element && element.tagName === 'LI') {
            const listType = element.getAttribute('data-list-type');
            const index = parseInt(element.getAttribute('data-list-index'));
            
            if (window.currentPdfContent) {
              if (listType === 'caracteristic' && window.currentPdfContent.caracteristic) {
                window.currentPdfContent.caracteristic.splice(index, 1);
              } else if (listType === 'consommation' && window.currentPdfContent.consommation) {
                window.currentPdfContent.consommation.splice(index, 1);
              }
              
              if (window.generateHTML && window.updatePreview) {
                window.updatePreview();
              }
            }
          }
        }
        closePanel();
        break;
      case 'delete-recipe':
        if (window.deleteElement && typeof window.deleteElement === 'function') {
          window.deleteElement(element, 'recipe');
        } else {
          if (element && element.classList.contains('recipe')) {
            const index = parseInt(element.getAttribute('data-recipe-index'));
            
            if (window.currentPdfContent && window.currentPdfContent.recette) {
              window.currentPdfContent.recette.splice(index, 1);
              
              if (window.generateHTML && window.updatePreview) {
                window.updatePreview();
              }
            }
          }
        }
        closePanel();
        break;
      case 'hide-section':
        hideSection(element);
        closePanel();
        break;
      case 'show-section':
        showSection(element);
        closePanel();
        break;
    }
  }

  // Exposer les fonctions globalement
  window.FigmaPanelEvents = {
    attachImagePanelEvents,
    attachPanelEvents,
    applyPanelChanges,
    applyTypographyChanges,
    applySpacingChanges,
    handlePanelAction
  };

  // Exposer les fonctions globalement pour compatibilité
  window.attachImagePanelEvents = attachImagePanelEvents;
  window.attachPanelEvents = attachPanelEvents;
  window.applyPanelChanges = applyPanelChanges;
  window.applyTypographyChanges = applyTypographyChanges;
  window.applySpacingChanges = applySpacingChanges;
  window.handlePanelAction = handlePanelAction;
})();

