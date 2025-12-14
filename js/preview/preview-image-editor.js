// ========================================
// ÉDITEUR D'IMAGES - Crop, resize, rotation
// ========================================

(function() {
  let imageEditorModal = null;
  let currentImage = null;
  let cropper = null;
  let originalImageData = null;

  // Initialisation
  function init() {
    createImageEditorModal();
    setupImageEditor();
  }

  // Créer la modal d'édition d'image
  function createImageEditorModal() {
    imageEditorModal = document.createElement('div');
    imageEditorModal.id = 'imageEditorModal';
    imageEditorModal.className = 'image-editor-modal';
    imageEditorModal.innerHTML = `
      <div class="image-editor-modal-content">
        <div class="image-editor-modal-header">
          <h2>Image</h2>
          <button class="image-editor-modal-close" id="imageEditorModalClose" aria-label="Fermer">
            <span>✕</span>
          </button>
        </div>
        <div class="image-editor-modal-body">
          <div class="image-editor-preview-container">
            <img id="imageEditorPreview" src="" alt="Image à éditer">
          </div>
          <div class="image-editor-controls">
            <!-- Transform - Style Figma -->
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

            <!-- Effects - Style Figma -->
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
          </div>
          <div class="image-editor-actions">
            <button class="image-editor-btn image-editor-btn-primary" id="imageEditorApply">✓ Appliquer</button>
            <button class="image-editor-btn" id="imageEditorReset">↶ Réinitialiser</button>
            <button class="image-editor-btn image-editor-btn-danger" id="imageEditorDelete">🗑️ Supprimer</button>
            <button class="image-editor-btn" id="imageEditorCancel">Annuler</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(imageEditorModal);

    setupImageEditorEvents();
  }

  // Configurer les événements de l'éditeur
  function setupImageEditorEvents() {
    const closeBtn = document.getElementById('imageEditorModalClose');
    const cancelBtn = document.getElementById('imageEditorCancel');
    const applyBtn = document.getElementById('imageEditorApply');
    const resetBtn = document.getElementById('imageEditorReset');
    const deleteBtn = document.getElementById('imageEditorDelete');

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (applyBtn) applyBtn.addEventListener('click', applyChanges);
    if (resetBtn) resetBtn.addEventListener('click', resetChanges);
    if (deleteBtn) deleteBtn.addEventListener('click', deleteImage);

    // Fermer avec Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && imageEditorModal.classList.contains('active')) {
        closeModal();
      }
    });

    // Fermer en cliquant à l'extérieur
    imageEditorModal.addEventListener('click', (e) => {
      if (e.target === imageEditorModal) {
        closeModal();
      }
    });

    setupImageEditorControls();
  }

  // Variables globales pour les contrôles
  let currentRotation = 0;
  let currentScaleX = 1;
  let currentScaleY = 1;
  let currentBrightness = 100;
  let currentContrast = 100;
  let currentSaturation = 100;
  let maintainRatio = true;
  let originalWidth = 0;
  let originalHeight = 0;

  // Configurer les contrôles de l'éditeur
  function setupImageEditorControls() {
    const preview = document.getElementById('imageEditorPreview');
    if (!preview) return;

    // Redimensionnement - Style Figma
    const widthInput = document.getElementById('imageEditorWidth');
    const heightInput = document.getElementById('imageEditorHeight');
    const maintainRatioBtn = document.getElementById('imageEditorMaintainRatio');

    if (widthInput) {
      widthInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value) || 100;
        if (value < 50) value = 50;
        if (value > 200) value = 200;
        e.target.value = value;
        
        if (maintainRatio && originalWidth > 0 && maintainRatioBtn?.classList.contains('active')) {
          const ratio = originalHeight / originalWidth;
          const newHeight = Math.round((value / 100) * originalHeight);
          if (heightInput) {
            heightInput.value = Math.round((newHeight / originalHeight) * 100);
          }
        }
        
        applyPreviewTransform();
      });
      
      widthInput.addEventListener('blur', (e) => {
        let value = parseInt(e.target.value) || 100;
        if (value < 50) value = 50;
        if (value > 200) value = 200;
        e.target.value = value;
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
      
      heightInput.addEventListener('blur', (e) => {
        let value = parseInt(e.target.value) || 100;
        if (value < 50) value = 50;
        if (value > 200) value = 200;
        e.target.value = value;
      });
    }

    if (maintainRatioBtn) {
      maintainRatioBtn.addEventListener('click', (e) => {
        maintainRatio = !maintainRatio;
        if (maintainRatio) {
          maintainRatioBtn.classList.add('active');
        } else {
          maintainRatioBtn.classList.remove('active');
        }
      });
      // Activer par défaut
      maintainRatioBtn.classList.add('active');
    }

    // Rotation - Style Figma
    const rotationInput = document.getElementById('imageEditorRotation');
    const rotateLeftBtn = document.getElementById('imageEditorRotateLeft');
    const rotateRightBtn = document.getElementById('imageEditorRotateRight');
    const flipHorizontalBtn = document.getElementById('imageEditorFlipHorizontal');
    const flipVerticalBtn = document.getElementById('imageEditorFlipVertical');

    if (rotationInput) {
      rotationInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value) || 0;
        if (value < -180) value = -180;
        if (value > 180) value = 180;
        currentRotation = value;
        e.target.value = value;
        applyPreviewTransform();
      });
      
      rotationInput.addEventListener('blur', (e) => {
        let value = parseInt(e.target.value) || 0;
        if (value < -180) value = -180;
        if (value > 180) value = 180;
        currentRotation = value;
        e.target.value = value;
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

    // Filtres - Style Figma
    const brightnessInput = document.getElementById('imageEditorBrightness');
    const contrastInput = document.getElementById('imageEditorContrast');
    const saturationInput = document.getElementById('imageEditorSaturation');
    const brightnessValue = document.getElementById('imageEditorBrightnessValue');
    const contrastValue = document.getElementById('imageEditorContrastValue');
    const saturationValue = document.getElementById('imageEditorSaturationValue');

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

    // Appliquer les transformations à la preview ET à l'image dans le PDF en temps réel
    function applyPreviewTransform() {
      if (!preview) return;

      const width = widthInput ? parseInt(widthInput.value) : 100;
      const height = heightInput ? parseInt(heightInput.value) : 100;

      preview.style.width = `${width}%`;
      preview.style.height = height === 100 ? 'auto' : `${height}%`;
      preview.style.transform = `rotate(${currentRotation}deg) scaleX(${currentScaleX}) scaleY(${currentScaleY})`;
      preview.style.filter = `
        brightness(${currentBrightness}%) 
        contrast(${currentContrast}%) 
        saturate(${currentSaturation}%)
      `;
      
      // Appliquer les transformations en temps réel à l'image dans le PDF
      if (currentImage) {
        currentImage.style.width = `${width}%`;
        currentImage.style.height = height === 100 ? 'auto' : `${height}%`;
        currentImage.style.transform = `rotate(${currentRotation}deg) scaleX(${currentScaleX}) scaleY(${currentScaleY})`;
        currentImage.style.filter = `
          brightness(${currentBrightness}%) 
          contrast(${currentContrast}%) 
          saturate(${currentSaturation}%)
        `;
      }
    }
    
    // Exposer la fonction pour qu'elle soit accessible
    window.applyImagePreviewTransform = applyPreviewTransform;

    // Sauvegarder les valeurs pour les appliquer plus tard
    window.getImageEditorValues = function() {
      return {
        width: widthInput ? parseInt(widthInput.value) : 100,
        height: heightInput ? parseInt(heightInput.value) : 100,
        rotation: currentRotation,
        scaleX: currentScaleX,
        scaleY: currentScaleY,
        brightness: currentBrightness,
        contrast: currentContrast,
        saturation: currentSaturation
      };
    };

    // Initialiser les dimensions originales
    preview.addEventListener('load', function() {
      originalWidth = this.naturalWidth;
      originalHeight = this.naturalHeight;
    });
  }

  // Configurer l'éditeur d'images
  function setupImageEditor() {
    // Détecter les clics sur les images intégrées
    // Utiliser la délégation d'événements pour capturer les images ajoutées dynamiquement
    document.addEventListener('click', (e) => {
      const img = e.target;
      // Vérifier si c'est une image avec la classe pdf-inserted-image
      if (img.tagName === 'IMG' && img.classList.contains('pdf-inserted-image')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Image cliquée, ouverture de l\'éditeur...');
        openImageEditor(img);
      }
    }, true); // Utiliser capture phase pour intercepter avant d'autres handlers
  }

  // Ouvrir l'éditeur d'image
  function openImageEditor(imgElement) {
    console.log('openImageEditor appelé', { imageEditorModal, imgElement });
    
    if (!imageEditorModal) {
      console.error('Modal d\'édition d\'image non trouvée');
      // Essayer de réinitialiser
      if (window.initImageEditor) {
        window.initImageEditor();
        imageEditorModal = document.getElementById('imageEditorModal');
      }
      if (!imageEditorModal) {
        console.error('Impossible de créer la modal');
        return;
      }
    }
    
    if (!imgElement) {
      console.error('Élément image non fourni');
      return;
    }

    currentImage = imgElement;
    originalImageData = {
      src: imgElement.src,
      width: imgElement.style.width || '100%',
      height: imgElement.style.height || 'auto',
      transform: imgElement.style.transform || '',
      filter: imgElement.style.filter || ''
    };

    const preview = document.getElementById('imageEditorPreview');
    if (preview) {
      preview.src = imgElement.src;
      preview.onload = () => {
        // Réinitialiser tous les contrôles
        resetEditorControls();
      };
    }

    console.log('Ajout de la classe active à la modal');
    imageEditorModal.classList.add('active');
    console.log('Modal active:', imageEditorModal.classList.contains('active'));
  }
  
  // Exposer la fonction globalement
  window.openImageEditor = openImageEditor;

  // Réinitialiser les contrôles de l'éditeur
  function resetEditorControls() {
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

    const widthValue = document.getElementById('imageEditorWidthValue');
    const heightValue = document.getElementById('imageEditorHeightValue');
    const rotationValue = document.getElementById('imageEditorRotationValue');
    const brightnessValue = document.getElementById('imageEditorBrightnessValue');
    const contrastValue = document.getElementById('imageEditorContrastValue');
    const saturationValue = document.getElementById('imageEditorSaturationValue');

    if (widthValue) widthValue.textContent = '100%';
    if (heightValue) heightValue.textContent = 'auto';
    if (rotationValue) rotationValue.textContent = '0°';
    if (brightnessValue) brightnessValue.textContent = '100%';
    if (contrastValue) contrastValue.textContent = '100%';
    if (saturationValue) saturationValue.textContent = '100%';

    const preview = document.getElementById('imageEditorPreview');
    if (preview) {
      preview.style.width = '100%';
      preview.style.height = 'auto';
      preview.style.transform = '';
      preview.style.filter = '';
    }
  }


  // Appliquer les modifications
  function applyChanges() {
    if (!currentImage) return;

    const values = window.getImageEditorValues ? window.getImageEditorValues() : {};
    const preview = document.getElementById('imageEditorPreview');

    // Appliquer les transformations
    currentImage.style.width = `${values.width}%`;
    currentImage.style.height = values.height === 100 ? 'auto' : `${values.height}%`;
    currentImage.style.transform = `rotate(${values.rotation}deg) scaleX(${values.scaleX}) scaleY(${values.scaleY})`;
    currentImage.style.filter = `
      brightness(${values.brightness}%) 
      contrast(${values.contrast}%) 
      saturate(${values.saturation}%)
    `;

    // Sauvegarder les modifications dans les données de l'image
    currentImage.dataset.edited = 'true';
    currentImage.dataset.width = values.width;
    currentImage.dataset.height = values.height;
    currentImage.dataset.rotation = values.rotation;
    currentImage.dataset.scaleX = values.scaleX;
    currentImage.dataset.scaleY = values.scaleY;
    currentImage.dataset.brightness = values.brightness;
    currentImage.dataset.contrast = values.contrast;
    currentImage.dataset.saturation = values.saturation;

    closeModal();
    showMessage('Modifications appliquées avec succès !', 'success');
  }

  // Réinitialiser les modifications
  function resetChanges() {
    if (!currentImage || !originalImageData) return;

    currentImage.style.width = originalImageData.width;
    currentImage.style.height = originalImageData.height;
    currentImage.style.transform = originalImageData.transform;
    currentImage.style.filter = originalImageData.filter;

    resetEditorControls();
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

  // Fermer la modal
  function closeModal() {
    if (imageEditorModal) {
      imageEditorModal.classList.remove('active');
    }
    currentImage = null;
    originalImageData = null;
  }

  // Afficher un message
  function showMessage(message, type = 'info') {
    // Utiliser la fonction existante si disponible
    if (window.showImageSearchMessage) {
      window.showImageSearchMessage(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // Initialiser quand le DOM est prêt
  function initializeEditor() {
    if (document.getElementById('imageEditorModal')) {
      console.log('Modal déjà créée');
      return;
    }
    console.log('Initialisation de l\'éditeur d\'images...');
    init();
    console.log('Éditeur d\'images initialisé');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEditor);
  } else {
    // Attendre un peu pour s'assurer que tous les scripts sont chargés
    setTimeout(initializeEditor, 100);
  }
  
  // Exposer la fonction d'initialisation
  window.initImageEditor = initializeEditor;
})();

