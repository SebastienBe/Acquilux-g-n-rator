// ========================================
// GESTIONNAIRE D'IMAGES UNIFIÉ - Recherche + Édition
// ========================================

(function() {
  let imageManagerModal = null;
  let currentMode = 'edit'; // 'edit' uniquement (recherche Pexels supprimée)
  let currentImage = null;

  // Variables pour l'éditeur
  let currentRotation = 0;
  let currentScaleX = 1;
  let currentScaleY = 1;
  let currentBrightness = 100;
  let currentContrast = 100;
  let currentSaturation = 100;
  let maintainRatio = true;
  let originalImageData = null;

  // Initialisation
  function init() {
    // Modal désactivée temporairement pour tests
    // createImageManagerModal();
    // setupImageClickHandler();
    setupPasteHandler();
  }

  // Créer la modal unifiée
  function createImageManagerModal() {
    imageManagerModal = document.createElement('div');
    imageManagerModal.id = 'imageManagerModal';
    imageManagerModal.className = 'image-manager-modal';
    imageManagerModal.innerHTML = `
      <div class="image-manager-modal-content">
        <div class="image-manager-modal-header">
          <h2 class="image-manager-modal-title">Éditeur d'image</h2>
          <button class="image-manager-modal-close" id="imageManagerModalClose" aria-label="Fermer">
            <span>✕</span>
          </button>
        </div>
        
        <div class="image-manager-modal-body">
          <!-- Onglet Édition -->
          <div class="image-manager-tab-content active" id="tab-edit">
            <div class="image-editor-empty" id="imageEditorEmpty">
              <p>📷 Sélectionnez une image dans le PDF pour l'éditer</p>
              <p class="hint">Cliquez sur une image intégrée dans le PDF</p>
            </div>
            <div class="image-editor-content" id="imageEditorContent" style="display: none;">
              <div class="image-editor-controls">
                <!-- Transform -->
                <div class="image-editor-section">
                  <div class="section-header">
                    <span class="section-icon">↔</span>
                    <h3>Transform</h3>
                  </div>
                  
                  <div class="figma-control-row">
                    <div class="figma-control-group">
                      <label class="figma-label">W</label>
                      <div class="figma-input-wrapper">
                        <input type="number" id="imageEditorWidth" min="50" max="200" step="1" value="100" class="figma-number-input">
                        <span class="figma-unit">%</span>
                      </div>
                    </div>
                    <div class="figma-control-group">
                      <label class="figma-label">H</label>
                      <div class="figma-input-wrapper">
                        <input type="number" id="imageEditorHeight" min="50" max="200" step="1" value="100" class="figma-number-input">
                        <span class="figma-unit">%</span>
                      </div>
                    </div>
                    <button class="figma-link-btn" id="imageEditorMaintainRatio" title="Conserver les proportions">
                      <span class="link-icon">🔗</span>
                    </button>
                  </div>
                  
                  <div class="figma-control-row">
                    <div class="figma-control-group full-width">
                      <label class="figma-label">Rotation</label>
                      <div class="figma-input-wrapper">
                        <input type="number" id="imageEditorRotation" min="-180" max="180" step="1" value="0" class="figma-number-input">
                        <span class="figma-unit">°</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="figma-button-group">
                    <button class="figma-icon-btn" id="imageEditorRotateLeft" title="Rotation -90°">↺</button>
                    <button class="figma-icon-btn" id="imageEditorRotateRight" title="Rotation +90°">↻</button>
                    <button class="figma-icon-btn" id="imageEditorFlipHorizontal" title="Retourner horizontalement">↔</button>
                    <button class="figma-icon-btn" id="imageEditorFlipVertical" title="Retourner verticalement">↕</button>
                  </div>
                </div>

                <!-- Effects -->
                <div class="image-editor-section">
                  <div class="section-header">
                    <span class="section-icon">✨</span>
                    <h3>Effects</h3>
                  </div>
                  
                  <div class="figma-control-row">
                    <div class="figma-control-group full-width">
                      <label class="figma-label">Brightness</label>
                      <div class="figma-slider-wrapper">
                        <input type="range" id="imageEditorBrightness" min="0" max="200" step="1" value="100" class="figma-slider">
                        <span class="figma-slider-value" id="imageEditorBrightnessValue">100%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="figma-control-row">
                    <div class="figma-control-group full-width">
                      <label class="figma-label">Contrast</label>
                      <div class="figma-slider-wrapper">
                        <input type="range" id="imageEditorContrast" min="0" max="200" step="1" value="100" class="figma-slider">
                        <span class="figma-slider-value" id="imageEditorContrastValue">100%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="figma-control-row">
                    <div class="figma-control-group full-width">
                      <label class="figma-label">Saturation</label>
                      <div class="figma-slider-wrapper">
                        <input type="range" id="imageEditorSaturation" min="0" max="200" step="1" value="100" class="figma-slider">
                        <span class="figma-slider-value" id="imageEditorSaturationValue">100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="image-editor-actions">
                  <button class="image-editor-btn image-editor-btn-primary" id="imageEditorApply">✓ Appliquer</button>
                  <button class="image-editor-btn" id="imageEditorReset">↶ Réinitialiser</button>
                  <button class="image-editor-btn image-editor-btn-danger" id="imageEditorDelete">🗑️ Supprimer</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(imageManagerModal);
    
    // Événements
    setupModalEvents();
    setupEditorEvents();
  }

  // Configurer les événements de la modal
  function setupModalEvents() {
    const closeBtn = document.getElementById('imageManagerModalClose');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // Fermer avec Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && imageManagerModal.classList.contains('active')) {
        closeModal();
      }
    });

    // Fermer en cliquant à l'extérieur
    imageManagerModal.addEventListener('click', (e) => {
      if (e.target === imageManagerModal) {
        closeModal();
      }
    });
  }


  // Configurer les événements de l'éditeur
  function setupEditorEvents() {
    const applyBtn = document.getElementById('imageEditorApply');
    const resetBtn = document.getElementById('imageEditorReset');
    const deleteBtn = document.getElementById('imageEditorDelete');

    if (applyBtn) applyBtn.addEventListener('click', applyImageChanges);
    if (resetBtn) resetBtn.addEventListener('click', resetImageChanges);
    if (deleteBtn) deleteBtn.addEventListener('click', deleteImage);

    setupEditorControls();
  }

  // Configurer les contrôles de l'éditeur
  function setupEditorControls() {
    const widthInput = document.getElementById('imageEditorWidth');
    const heightInput = document.getElementById('imageEditorHeight');
    const maintainRatioBtn = document.getElementById('imageEditorMaintainRatio');
    const rotationInput = document.getElementById('imageEditorRotation');
    const rotateLeftBtn = document.getElementById('imageEditorRotateLeft');
    const rotateRightBtn = document.getElementById('imageEditorRotateRight');
    const flipHorizontalBtn = document.getElementById('imageEditorFlipHorizontal');
    const flipVerticalBtn = document.getElementById('imageEditorFlipVertical');
    const brightnessInput = document.getElementById('imageEditorBrightness');
    const contrastInput = document.getElementById('imageEditorContrast');
    const saturationInput = document.getElementById('imageEditorSaturation');
    const brightnessValue = document.getElementById('imageEditorBrightnessValue');
    const contrastValue = document.getElementById('imageEditorContrastValue');
    const saturationValue = document.getElementById('imageEditorSaturationValue');

    // Largeur/Hauteur
    if (widthInput) {
      widthInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value) || 100;
        if (value < 50) value = 50;
        if (value > 200) value = 200;
        e.target.value = value;
        applyPreviewTransform();
      });
    }

    if (heightInput) {
      heightInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value) || 100;
        if (value < 50) value = 50;
        if (value > 200) value = 200;
        e.target.value = value;
        applyPreviewTransform();
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
    if (rotationInput) {
      rotationInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value) || 0;
        if (value < -180) value = -180;
        if (value > 180) value = 180;
        currentRotation = value;
        e.target.value = value;
        applyPreviewTransform();
      });
    }

    if (rotateLeftBtn) {
      rotateLeftBtn.addEventListener('click', () => {
        currentRotation -= 90;
        if (currentRotation < -180) currentRotation += 360;
        if (rotationInput) rotationInput.value = currentRotation;
        applyPreviewTransform();
      });
    }

    if (rotateRightBtn) {
      rotateRightBtn.addEventListener('click', () => {
        currentRotation += 90;
        if (currentRotation > 180) currentRotation -= 360;
        if (rotationInput) rotationInput.value = currentRotation;
        applyPreviewTransform();
      });
    }

    if (flipHorizontalBtn) {
      flipHorizontalBtn.addEventListener('click', () => {
        currentScaleX *= -1;
        applyPreviewTransform();
      });
    }

    if (flipVerticalBtn) {
      flipVerticalBtn.addEventListener('click', () => {
        currentScaleY *= -1;
        applyPreviewTransform();
      });
    }

    // Filtres
    if (brightnessInput) {
      brightnessInput.addEventListener('input', (e) => {
        currentBrightness = parseInt(e.target.value);
        if (brightnessValue) brightnessValue.textContent = `${currentBrightness}%`;
        applyPreviewTransform();
      });
    }

    if (contrastInput) {
      contrastInput.addEventListener('input', (e) => {
        currentContrast = parseInt(e.target.value);
        if (contrastValue) contrastValue.textContent = `${currentContrast}%`;
        applyPreviewTransform();
      });
    }

    if (saturationInput) {
      saturationInput.addEventListener('input', (e) => {
        currentSaturation = parseInt(e.target.value);
        if (saturationValue) saturationValue.textContent = `${currentSaturation}%`;
        applyPreviewTransform();
      });
    }
  }

  // Appliquer les transformations en temps réel
  function applyPreviewTransform() {
    if (!currentImage) return;

    const widthInput = document.getElementById('imageEditorWidth');
    const heightInput = document.getElementById('imageEditorHeight');
    const width = widthInput ? parseInt(widthInput.value) : 100;
    const height = heightInput ? parseInt(heightInput.value) : 100;

    currentImage.style.width = `${width}%`;
    currentImage.style.height = height === 100 ? 'auto' : `${height}%`;
    currentImage.style.transform = `rotate(${currentRotation}deg) scaleX(${currentScaleX}) scaleY(${currentScaleY})`;
    currentImage.style.filter = `
      brightness(${currentBrightness}%) 
      contrast(${currentContrast}%) 
      saturate(${currentSaturation}%)
    `;
  }


  // Ouvrir la modal
  function openModal(mode = 'edit') {
    if (imageManagerModal) {
      imageManagerModal.classList.add('active');
      currentMode = 'edit';
    }
  }

  // Fermer la modal
  function closeModal() {
    if (imageManagerModal) {
      imageManagerModal.classList.remove('active');
    }
    currentImage = null;
    originalImageData = null;
  }


  // Gérer le collage d'images depuis le presse-papiers
  function setupPasteHandler() {
    document.addEventListener('paste', async (e) => {
      // Vérifier que l'utilisateur n'est pas en train de taper dans un input
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      )) {
        return; // Laisser le comportement par défaut
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      // Chercher des fichiers d'image dans le presse-papiers
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault(); // Empêcher le comportement par défaut
          
          const blob = item.getAsFile();
          if (!blob) continue;

          // Convertir le blob en data URL
          const reader = new FileReader();
          reader.onload = function(event) {
            const dataUrl = event.target.result;
            // Utiliser selectImage pour insérer l'image collée
            selectImage(dataUrl, true); // true = image collée (pas besoin de fermer la modal)
          };
          reader.onerror = function() {
            console.error('Erreur lors de la lecture de l\'image collée');
            showMessage('Erreur lors du collage de l\'image', 'error');
          };
          reader.readAsDataURL(blob);
          break; // Ne traiter qu'une seule image
        }
      }
    });
  }

  // Sélectionner une image
  function selectImage(imageUrl, isPasted = false) {
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) return;

    // Vérifier si le conteneur d'image existe (dans le contenu du PDF)
    const imageContainer = pdfPreview.querySelector('.product-image-container');
    
    if (imageContainer) {
      // Placer l'image dans le contenu du PDF (position principale)
      const existingImg = imageContainer.querySelector('img');
      
      // Créer ou remplacer l'image
      const imgElement = existingImg || document.createElement('img');
      imgElement.alt = 'Image produit';
      imgElement.className = 'product-image';
      imgElement.crossOrigin = 'anonymous';
      
      // Ajouter l'attribut data-editable pour permettre l'édition via le panel Figma
      imgElement.setAttribute('data-editable', 'image');
      imgElement.setAttribute('data-editable-type', 'image');
      
      // MODE TEST : Charger l'image sans modification
      // Si c'est une data URL (image collée), l'utiliser directement
      if (imageUrl.startsWith('data:')) {
        imgElement.src = imageUrl;
        if (!existingImg) {
          imageContainer.appendChild(imgElement);
        }
        showMessage('Image collée avec succès (mode test - sans modification)', 'success');
        return;
      }
      
      // Sinon, charger l'image normalement
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      
      tempImg.onload = function() {
        imgElement.src = imageUrl;
        if (!existingImg) {
          imageContainer.appendChild(imgElement);
        }
        showMessage('Image ajoutée (mode test - sans modification)', 'success');
      };

      tempImg.onerror = function() {
        console.error('Erreur lors du chargement de l\'image:', imageUrl);
        showMessage('Erreur lors du chargement de l\'image', 'error');
      };

      tempImg.src = imageUrl;
      return;
    }

    // Fallback : ancien système de placement (si le conteneur n'existe pas)
    // Demander où placer l'image
    const position = prompt('Où voulez-vous placer l\'image ?\n1. En haut (après le header)\n2. Après les caractéristiques\n3. Après la consommation\n4. Après les recettes\n\nEntrez le numéro (1-4):');
    
    if (!position) return;

    const positionMap = {
      '1': 'after-header',
      '2': 'after-caracteristics',
      '3': 'after-consommation',
      '4': 'after-recettes'
    };

    const targetPosition = positionMap[position];
    if (!targetPosition) {
      alert('Position invalide');
      return;
    }

    // Créer l'élément image
    const imgElement = document.createElement('img');
    imgElement.alt = 'Image ajoutée';
    imgElement.className = 'pdf-inserted-image';
    imgElement.style.cssText = `
      width: 100%;
      max-width: 100%;
      height: auto;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
    `;

    // Charger l'image
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    
    tempImg.onload = function() {
      imgElement.src = imageUrl;
      imgElement.crossOrigin = 'anonymous';
    };

    tempImg.onerror = function() {
      console.error('Erreur lors du chargement de l\'image:', imageUrl);
      showMessage('Erreur lors du chargement de l\'image', 'error');
    };

    tempImg.src = imageUrl;

    // Placer l'image
    let targetElement = null;
    
    switch (targetPosition) {
      case 'after-header':
        const headerContent = pdfPreview.querySelector('.header-content');
        if (headerContent) {
          targetElement = headerContent.nextSibling;
        }
        break;
      case 'after-caracteristics':
        const caracteristicsSection = Array.from(pdfPreview.querySelectorAll('h2')).find(h2 => 
          h2.textContent.includes('Caractéristiques')
        );
        if (caracteristicsSection) {
          const ul = caracteristicsSection.nextElementSibling;
          if (ul && ul.tagName === 'UL') {
            targetElement = ul.nextSibling;
          }
        }
        break;
      case 'after-consommation':
        const consommationSection = Array.from(pdfPreview.querySelectorAll('h2')).find(h2 => 
          h2.textContent.includes('Consommer')
        );
        if (consommationSection) {
          const ul = consommationSection.nextElementSibling;
          if (ul && ul.tagName === 'UL') {
            targetElement = ul.nextSibling;
          }
        }
        break;
      case 'after-recettes':
        const recettesSection = Array.from(pdfPreview.querySelectorAll('h2')).find(h2 => 
          h2.textContent.includes('Recettes')
        );
        if (recettesSection) {
          targetElement = recettesSection.nextElementSibling;
          while (targetElement && targetElement.nextSibling) {
            if (targetElement.nextSibling.classList && targetElement.nextSibling.classList.contains('recipe')) {
              targetElement = targetElement.nextSibling;
            } else {
              break;
            }
          }
        }
        break;
    }

    if (targetElement) {
      pdfPreview.insertBefore(imgElement, targetElement);
    } else {
      const headerContent = pdfPreview.querySelector('.header-content');
      if (headerContent) {
        headerContent.parentNode.insertBefore(imgElement, headerContent.nextSibling);
      }
    }

    closeModal();
    showMessage('Image ajoutée avec succès ! Cliquez dessus pour l\'éditer.', 'success');
  }

  // Configurer le clic sur les images
  function setupImageClickHandler() {
    document.addEventListener('click', (e) => {
      const img = e.target;
      if (img.tagName === 'IMG' && img.classList.contains('pdf-inserted-image')) {
        e.preventDefault();
        e.stopPropagation();
        openImageEditor(img);
      }
    }, true);
  }

  // Ouvrir l'éditeur d'image
  function openImageEditor(imgElement) {
    if (!imgElement) return;

    currentImage = imgElement;
    originalImageData = {
      width: imgElement.style.width || '100%',
      height: imgElement.style.height || 'auto',
      transform: imgElement.style.transform || '',
      filter: imgElement.style.filter || ''
    };

    // Réinitialiser les contrôles
    resetEditorControls();
    
    // Charger les valeurs actuelles
    const widthMatch = imgElement.style.width.match(/(\d+)%/);
    const heightMatch = imgElement.style.height.match(/(\d+)%/);
    const transformMatch = imgElement.style.transform.match(/rotate\((-?\d+)deg\)/);
    const brightnessMatch = imgElement.style.filter.match(/brightness\((\d+)%\)/);
    const contrastMatch = imgElement.style.filter.match(/contrast\((\d+)%\)/);
    const saturationMatch = imgElement.style.filter.match(/saturate\((\d+)%\)/);

    const widthInput = document.getElementById('imageEditorWidth');
    const heightInput = document.getElementById('imageEditorHeight');
    const rotationInput = document.getElementById('imageEditorRotation');
    const brightnessInput = document.getElementById('imageEditorBrightness');
    const contrastInput = document.getElementById('imageEditorContrast');
    const saturationInput = document.getElementById('imageEditorSaturation');

    if (widthInput) widthInput.value = widthMatch ? parseInt(widthMatch[1]) : 100;
    if (heightInput) heightInput.value = heightMatch ? parseInt(heightMatch[1]) : 100;
    if (rotationInput) {
      currentRotation = transformMatch ? parseInt(transformMatch[1]) : 0;
      rotationInput.value = currentRotation;
    }
    if (brightnessInput) {
      currentBrightness = brightnessMatch ? parseInt(brightnessMatch[1]) : 100;
      brightnessInput.value = currentBrightness;
      const brightnessValue = document.getElementById('imageEditorBrightnessValue');
      if (brightnessValue) brightnessValue.textContent = `${currentBrightness}%`;
    }
    if (contrastInput) {
      currentContrast = contrastMatch ? parseInt(contrastMatch[1]) : 100;
      contrastInput.value = currentContrast;
      const contrastValue = document.getElementById('imageEditorContrastValue');
      if (contrastValue) contrastValue.textContent = `${currentContrast}%`;
    }
    if (saturationInput) {
      currentSaturation = saturationMatch ? parseInt(saturationMatch[1]) : 100;
      saturationInput.value = currentSaturation;
      const saturationValue = document.getElementById('imageEditorSaturationValue');
      if (saturationValue) saturationValue.textContent = `${currentSaturation}%`;
    }

    // Afficher l'éditeur
    const emptyEl = document.getElementById('imageEditorEmpty');
    const contentEl = document.getElementById('imageEditorContent');
    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    // Ouvrir la modal sur l'onglet édition
    openModal('edit');
  }

  // Réinitialiser les contrôles
  function resetEditorControls() {
    currentRotation = 0;
    currentScaleX = 1;
    currentScaleY = 1;
    currentBrightness = 100;
    currentContrast = 100;
    currentSaturation = 100;

    const widthInput = document.getElementById('imageEditorWidth');
    const heightInput = document.getElementById('imageEditorHeight');
    const rotationInput = document.getElementById('imageEditorRotation');
    const brightnessInput = document.getElementById('imageEditorBrightness');
    const contrastInput = document.getElementById('imageEditorContrast');
    const saturationInput = document.getElementById('imageEditorSaturation');

    if (widthInput) widthInput.value = 100;
    if (heightInput) heightInput.value = 100;
    if (rotationInput) rotationInput.value = 0;
    if (brightnessInput) brightnessInput.value = 100;
    if (contrastInput) contrastInput.value = 100;
    if (saturationInput) saturationInput.value = 100;

    const brightnessValue = document.getElementById('imageEditorBrightnessValue');
    const contrastValue = document.getElementById('imageEditorContrastValue');
    const saturationValue = document.getElementById('imageEditorSaturationValue');

    if (brightnessValue) brightnessValue.textContent = '100%';
    if (contrastValue) contrastValue.textContent = '100%';
    if (saturationValue) saturationValue.textContent = '100%';
  }

  // Appliquer les modifications
  function applyImageChanges() {
    if (!currentImage) return;

    // Les modifications sont déjà appliquées en temps réel
    // On sauvegarde juste les données
    currentImage.dataset.edited = 'true';
    currentImage.dataset.width = document.getElementById('imageEditorWidth')?.value || 100;
    currentImage.dataset.height = document.getElementById('imageEditorHeight')?.value || 100;
    currentImage.dataset.rotation = currentRotation;
    currentImage.dataset.scaleX = currentScaleX;
    currentImage.dataset.scaleY = currentScaleY;
    currentImage.dataset.brightness = currentBrightness;
    currentImage.dataset.contrast = currentContrast;
    currentImage.dataset.saturation = currentSaturation;

    showMessage('Modifications appliquées avec succès !', 'success');
  }

  // Réinitialiser les modifications
  function resetImageChanges() {
    if (!currentImage || !originalImageData) return;

    currentImage.style.width = originalImageData.width;
    currentImage.style.height = originalImageData.height;
    currentImage.style.transform = originalImageData.transform;
    currentImage.style.filter = originalImageData.filter;

    resetEditorControls();
    applyPreviewTransform();
    showMessage('Modifications réinitialisées', 'info');
  }

  // Supprimer l'image
  function deleteImage() {
    if (!currentImage) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      currentImage.remove();
      closeModal();
      showMessage('Image supprimée', 'info');
    }
  }


  // Afficher un message (utilisé pour les notifications de collage d'image, etc.)
  function showMessage(message, type = 'info') {
    // Créer un élément de notification temporaire
    const notification = document.createElement('div');
    notification.className = `image-notification image-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Helper pour escape HTML
  function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Exposer les fonctions globalement
  window.openImageManager = openModal;
  window.openImageEditor = openImageEditor;

  // Initialiser quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

