// ========================================
// GESTIONNAIRE D'IMAGES UNIFIÉ - Recherche + Édition
// ========================================

(function() {
  let imageManagerModal = null;
  let currentMode = 'search'; // 'search' ou 'edit'
  let currentImage = null;
  let searchInput = null;
  let imageGrid = null;
  let currentSearchTerm = '';
  let currentPage = 1;
  let isLoading = false;
  let totalResults = 0;

  // Configuration Pexels API
  const PEXELS_API_KEY = 'jLdl1Iz5Xr6f8y4enMih2WIkx5fVpyupGOs1euofGjy9jjMKxwFZ3swh';
  const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

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
    createImageManagerModal();
    setupImageManagerButton();
    setupImageClickHandler();
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
          <div class="image-manager-tabs">
            <button class="image-manager-tab active" data-tab="search">
              <span class="tab-icon">🔍</span>
              <span class="tab-label">Rechercher</span>
            </button>
            <button class="image-manager-tab" data-tab="edit">
              <span class="tab-icon">✏️</span>
              <span class="tab-label">Éditer</span>
            </button>
          </div>
          <button class="image-manager-modal-close" id="imageManagerModalClose" aria-label="Fermer">
            <span>✕</span>
          </button>
        </div>
        
        <div class="image-manager-modal-body">
          <!-- Onglet Recherche -->
          <div class="image-manager-tab-content active" id="tab-search">
            <div class="image-search-bar">
              <input 
                type="text" 
                id="imageSearchInput" 
                class="image-search-input" 
                placeholder="Rechercher une image (ex: pomme, tomate, apple, tomato)"
                autocomplete="off"
              >
              <button class="image-search-btn" id="imageSearchBtn">
                <span>🔍</span>
                <span>Rechercher</span>
              </button>
            </div>
            <div class="image-search-info" id="imageSearchInfo">
              <p>💡 Utilisez des mots-clés simples en français ou en anglais</p>
            </div>
            <div class="image-search-grid" id="imageSearchGrid">
              <div class="image-search-empty">
                <p>🔍 Entrez un terme de recherche pour commencer</p>
              </div>
            </div>
            <div class="image-search-loading" id="imageSearchLoading" style="display: none;">
              <div class="spinner"></div>
              <p>Recherche en cours...</p>
            </div>
            <div class="image-search-pagination" id="imageSearchPagination" style="display: none;">
              <button class="image-search-pagination-btn" id="imageSearchPrev" disabled>← Précédent</button>
              <span class="image-search-page-info" id="imageSearchPageInfo">Page 1</span>
              <button class="image-search-pagination-btn" id="imageSearchNext">Suivant →</button>
            </div>
          </div>

          <!-- Onglet Édition -->
          <div class="image-manager-tab-content" id="tab-edit">
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

    // Références
    searchInput = document.getElementById('imageSearchInput');
    imageGrid = document.getElementById('imageSearchGrid');
    
    // Événements
    setupModalEvents();
    setupSearchEvents();
    setupEditorEvents();
  }

  // Configurer les événements de la modal
  function setupModalEvents() {
    const closeBtn = document.getElementById('imageManagerModalClose');
    const tabs = imageManagerModal.querySelectorAll('.image-manager-tab');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // Navigation par onglets
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        switchTab(tabName);
      });
    });

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

  // Changer d'onglet
  function switchTab(tabName) {
    currentMode = tabName;
    
    // Mettre à jour les onglets
    imageManagerModal.querySelectorAll('.image-manager-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Mettre à jour le contenu
    imageManagerModal.querySelectorAll('.image-manager-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
  }

  // Configurer les événements de recherche
  function setupSearchEvents() {
    const searchBtn = document.getElementById('imageSearchBtn');
    const prevBtn = document.getElementById('imageSearchPrev');
    const nextBtn = document.getElementById('imageSearchNext');

    if (searchBtn) {
      searchBtn.addEventListener('click', performSearch);
    }

    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          performSearch();
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          performSearch(currentSearchTerm, currentPage);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentPage++;
        performSearch(currentSearchTerm, currentPage);
      });
    }
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

  // Configurer le bouton dans le header
  function setupImageManagerButton() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) {
      setTimeout(setupImageManagerButton, 100);
      return;
    }

    // Vérifier si le bouton existe déjà
    let imageManagerBtn = document.getElementById('imageManagerToggleBtn');
    
    if (!imageManagerBtn) {
      // Créer le bouton s'il n'existe pas
      imageManagerBtn = document.createElement('button');
      imageManagerBtn.className = 'btn-icon';
      imageManagerBtn.id = 'imageManagerToggleBtn';
      imageManagerBtn.setAttribute('aria-label', 'Gérer les images');
      imageManagerBtn.innerHTML = '<span class="icon">🖼️</span>';
      imageManagerBtn.title = 'Rechercher et éditer des images';
      
      const badgesBtn = document.getElementById('badgesToggleBtn');
      if (badgesBtn) {
        headerActions.insertBefore(imageManagerBtn, badgesBtn.nextSibling);
      } else {
        headerActions.appendChild(imageManagerBtn);
      }
    }
    
    // Attacher l'event listener (même si le bouton existe déjà)
    // Retirer les anciens listeners pour éviter les doublons
    const newBtn = imageManagerBtn.cloneNode(true);
    imageManagerBtn.parentNode.replaceChild(newBtn, imageManagerBtn);
    newBtn.addEventListener('click', () => {
      openModal('search');
    });
  }

  // Ouvrir la modal
  function openModal(mode = 'search') {
    if (imageManagerModal) {
      imageManagerModal.classList.add('active');
      switchTab(mode);
      
      if (mode === 'search' && searchInput) {
        searchInput.focus();
      }
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

  // Effectuer la recherche
  async function performSearch(term = null, page = 1) {
    if (isLoading) return;

    let searchTerm = null;
    if (term !== null && term !== undefined) {
      searchTerm = String(term).trim();
    } else if (searchInput?.value) {
      searchTerm = String(searchInput.value).trim();
    }
    
    if (!searchTerm || searchTerm.length === 0) {
      showMessage('Veuillez entrer un terme de recherche', 'error');
      return;
    }

    searchTerm = cleanSearchTerm(searchTerm);
    if (!searchTerm) {
      showMessage('Terme de recherche invalide', 'error');
      return;
    }

    console.log('Recherche Pexels:', searchTerm);
    currentSearchTerm = searchTerm;
    currentPage = page;
    isLoading = true;

    const loadingEl = document.getElementById('imageSearchLoading');
    const gridEl = document.getElementById('imageSearchGrid');
    const paginationEl = document.getElementById('imageSearchPagination');
    const infoEl = document.getElementById('imageSearchInfo');

    if (loadingEl) loadingEl.style.display = 'block';
    if (gridEl) gridEl.innerHTML = '';
    if (paginationEl) paginationEl.style.display = 'none';
    if (infoEl) infoEl.style.display = 'none';

    try {
      const images = await searchImagesPexels(searchTerm, page);
      
      if (images.length === 0) {
        showNoResults();
        return;
      }

      displayImages(images);
      updatePagination(page);

    } catch (error) {
      console.error('Erreur lors de la recherche d\'images:', error);
      showMessage('Erreur lors de la recherche. Veuillez réessayer.', 'error');
    } finally {
      isLoading = false;
      if (loadingEl) loadingEl.style.display = 'none';
    }
  }

  // Nettoyer le terme de recherche
  function cleanSearchTerm(term) {
    if (!term) return '';
    if (typeof term !== 'string') {
      term = String(term);
    }
    
    term = term.trim().replace(/\s+/g, ' ');
    term = term.replace(/[^\w\s\-àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/gi, '');
    
    if (term.length > 100) {
      term = term.substring(0, 100).trim();
    }
    
    if (term.length < 1) {
      return null;
    }
    
    return term;
  }

  // Rechercher avec Pexels API
  async function searchImagesPexels(term, page) {
    try {
      const perPage = 20;
      const cleanTerm = cleanSearchTerm(term);
      if (!cleanTerm) return [];
      
      const encodedTerm = encodeURIComponent(cleanTerm);
      const apiUrl = `${PEXELS_API_URL}?query=${encodedTerm}&per_page=${perPage}&page=${page}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Clé API Pexels invalide');
        } else if (response.status === 429) {
          throw new Error('Trop de requêtes. Veuillez patienter un moment.');
        } else {
          throw new Error(`Erreur API Pexels: ${response.status}`);
        }
      }

      const data = await response.json();
      totalResults = data.total_results || 0;
      
      if (!data.photos || data.photos.length === 0) {
        return [];
      }

      return data.photos.map((photo, index) => ({
        id: `pexels-${photo.id}`,
        url: photo.src.medium,
        fullUrl: photo.src.large2x || photo.src.large || photo.src.original,
        description: photo.alt || `${cleanTerm} - Image ${index + 1}`,
        author: photo.photographer,
        authorUrl: photo.photographer_url
      }));
    } catch (error) {
      console.error('Erreur lors de la recherche d\'images Pexels:', error);
      throw error;
    }
  }

  // Afficher les images
  function displayImages(images) {
    if (!imageGrid) return;

    if (images.length === 0) {
      imageGrid.innerHTML = '<div class="image-search-empty"><p>Aucune image trouvée</p></div>';
      return;
    }

    imageGrid.innerHTML = images.map(img => {
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(img.url)}&w=400&h=300&fit=cover`;
      const fullProxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(img.fullUrl || img.url)}&w=1200&h=900&fit=cover`;
      
      return `
      <div class="image-search-item" data-image-id="${img.id}">
        <div class="image-search-item-image">
          <img 
            src="${proxyUrl}" 
            alt="${escapeHtml(img.description)}" 
            loading="lazy"
            data-full-url="${fullProxyUrl}"
          >
          <div class="image-search-item-overlay">
            <button class="image-search-item-btn" data-image-url="${fullProxyUrl}" data-image-id="${img.id}">
              <span>✓</span>
              <span>Sélectionner</span>
            </button>
          </div>
        </div>
        <div class="image-search-item-info">
          <p class="image-search-item-title">${escapeHtml(img.description)}</p>
          <p class="image-search-item-author">Par ${escapeHtml(img.author)}</p>
        </div>
      </div>
    `;
    }).join('');

    // Attacher les événements de sélection
    imageGrid.querySelectorAll('.image-search-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const imageUrl = e.currentTarget.dataset.imageUrl;
        selectImage(imageUrl);
      });
    });
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
      imgElement.style.cssText = `
        width: 100%;
        height: auto;
        max-height: 400px;
        object-fit: cover;
        object-position: center;
        display: block;
        cursor: pointer;
      `;
      
      // Ajouter l'attribut data-editable pour permettre l'édition
      imgElement.setAttribute('data-editable', 'image');
      imgElement.setAttribute('data-editable-type', 'image');
      
      // Si c'est une data URL (image collée), l'utiliser directement
      if (imageUrl.startsWith('data:')) {
        imgElement.src = imageUrl;
        if (!existingImg) {
          imageContainer.appendChild(imgElement);
        }
        showMessage('Image collée avec succès', 'success');
        if (!isPasted) {
          closeModal();
        }
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
        
        showMessage('Image ajoutée dans le PDF', 'success');
        if (!isPasted) {
          closeModal();
        }
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

  // Mettre à jour la pagination
  function updatePagination(page) {
    const paginationEl = document.getElementById('imageSearchPagination');
    const pageInfoEl = document.getElementById('imageSearchPageInfo');
    const prevBtn = document.getElementById('imageSearchPrev');
    const nextBtn = document.getElementById('imageSearchNext');

    if (paginationEl) paginationEl.style.display = 'flex';
    if (pageInfoEl) {
      const perPage = 20;
      const totalPages = totalResults > 0 ? Math.ceil(totalResults / perPage) : 0;
      if (totalPages > 0) {
        pageInfoEl.textContent = `Page ${page} / ${totalPages} (${totalResults} résultats)`;
      } else {
        pageInfoEl.textContent = `Page ${page}`;
      }
    }
    if (prevBtn) prevBtn.disabled = page === 1;
    if (nextBtn) {
      const perPage = 20;
      const totalPages = totalResults > 0 ? Math.ceil(totalResults / perPage) : 0;
      nextBtn.disabled = page >= totalPages || totalPages === 0;
    }
  }

  // Afficher "aucun résultat"
  function showNoResults() {
    if (imageGrid) {
      imageGrid.innerHTML = '<div class="image-search-empty"><p>😔 Aucune image trouvée pour cette recherche</p><p style="font-size: 0.9rem; color: #999; margin-top: 8px;">Essayez avec des mots-clés plus génériques ou en anglais</p></div>';
    }
  }

  // Afficher un message
  function showMessage(message, type = 'info') {
    const infoEl = document.getElementById('imageSearchInfo');
    if (infoEl) {
      infoEl.innerHTML = `<p class="image-search-message image-search-message-${type}">${message}</p>`;
      infoEl.style.display = 'block';
      
      setTimeout(() => {
        infoEl.style.display = 'none';
      }, 3000);
    }
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

