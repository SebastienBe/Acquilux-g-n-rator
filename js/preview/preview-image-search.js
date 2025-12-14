// ========================================
// RECHERCHE D'IMAGES - Modal pour intégrer des images dans le PDF
// ========================================

(function() {
  let imageSearchModal = null;
  let searchInput = null;
  let imageGrid = null;
  let currentSearchTerm = '';
  let currentPage = 1;
  let isLoading = false;

  // Configuration - Utiliser Pexels API
  const PEXELS_API_KEY = 'jLdl1Iz5Xr6f8y4enMih2WIkx5fVpyupGOs1euofGjy9jjMKxwFZ3swh';
  const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

  // Initialisation
  function init() {
    createImageSearchModal();
    setupImageSearchButton();
  }

  // Créer la modal de recherche d'images
  function createImageSearchModal() {
    imageSearchModal = document.createElement('div');
    imageSearchModal.id = 'imageSearchModal';
    imageSearchModal.className = 'image-search-modal';
    imageSearchModal.innerHTML = `
      <div class="image-search-modal-content">
        <div class="image-search-modal-header">
          <h2>🔍 Rechercher une image</h2>
          <button class="image-search-modal-close" id="imageSearchModalClose" aria-label="Fermer">
            <span>✕</span>
          </button>
        </div>
        <div class="image-search-modal-body">
          <div class="image-search-bar">
            <input 
              type="text" 
              id="imageSearchInput" 
              class="image-search-input" 
              placeholder="Rechercher une image (ex: pomme, tomate, salade, apple, tomato) - Français ou anglais"
              autocomplete="off"
            >
            <button class="image-search-btn" id="imageSearchBtn">
              <span>🔍</span>
              <span>Rechercher</span>
            </button>
          </div>
          <div class="image-search-info" id="imageSearchInfo">
            <p>💡 Utilisez des mots-clés simples en français ou en anglais. Évitez les caractères spéciaux. Exemples: "pomme", "tomate", "salade", "apple", "tomato"</p>
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
      </div>
    `;
    document.body.appendChild(imageSearchModal);

    // Références aux éléments
    searchInput = document.getElementById('imageSearchInput');
    imageGrid = document.getElementById('imageSearchGrid');
    const searchBtn = document.getElementById('imageSearchBtn');
    const closeBtn = document.getElementById('imageSearchModalClose');
    const prevBtn = document.getElementById('imageSearchPrev');
    const nextBtn = document.getElementById('imageSearchNext');

    // Événements
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

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

    // Fermer en cliquant à l'extérieur
    imageSearchModal.addEventListener('click', (e) => {
      if (e.target === imageSearchModal) {
        closeModal();
      }
    });

    // Fermer avec Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && imageSearchModal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // Configurer le bouton de recherche d'images dans le header
  function setupImageSearchButton() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) {
      setTimeout(setupImageSearchButton, 100);
      return;
    }

    const imageSearchBtn = document.createElement('button');
    imageSearchBtn.className = 'btn-icon';
    imageSearchBtn.id = 'imageSearchToggleBtn';
    imageSearchBtn.setAttribute('aria-label', 'Rechercher une image');
    imageSearchBtn.innerHTML = '<span class="icon">🖼️</span>';
    imageSearchBtn.title = 'Rechercher une image à intégrer';
    
    imageSearchBtn.addEventListener('click', () => {
      openModal();
    });

    // Insérer après le bouton badges
    const badgesBtn = document.getElementById('badgesToggleBtn');
    if (badgesBtn) {
      headerActions.insertBefore(imageSearchBtn, badgesBtn.nextSibling);
    } else {
      headerActions.appendChild(imageSearchBtn);
    }
  }

  // Ouvrir la modal
  function openModal() {
    if (imageSearchModal) {
      imageSearchModal.classList.add('active');
      if (searchInput) {
        searchInput.focus();
      }
    }
  }

  // Fermer la modal
  function closeModal() {
    if (imageSearchModal) {
      imageSearchModal.classList.remove('active');
    }
  }

  // Effectuer la recherche
  async function performSearch(term = null, page = 1) {
    if (isLoading) return;

    // Récupérer le terme de recherche et s'assurer qu'il est une string
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

    // Nettoyer et normaliser le terme de recherche
    searchTerm = cleanSearchTerm(searchTerm);
    
    if (!searchTerm) {
      showMessage('Terme de recherche invalide', 'error');
      return;
    }

    console.log('Recherche Pexels:', searchTerm);
    currentSearchTerm = searchTerm;
    currentPage = page;
    isLoading = true;

    // Afficher le loader
    const loadingEl = document.getElementById('imageSearchLoading');
    const gridEl = document.getElementById('imageSearchGrid');
    const paginationEl = document.getElementById('imageSearchPagination');
    const infoEl = document.getElementById('imageSearchInfo');

    if (loadingEl) loadingEl.style.display = 'block';
    if (gridEl) gridEl.innerHTML = '';
    if (paginationEl) paginationEl.style.display = 'none';
    if (infoEl) infoEl.style.display = 'none';

    try {
      // Utiliser l'API Pexels
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

  // Nettoyer et normaliser le terme de recherche
  function cleanSearchTerm(term) {
    // Vérifier que term est une string
    if (!term) return '';
    if (typeof term !== 'string') {
      // Convertir en string si ce n'est pas le cas
      term = String(term);
    }
    
    // Supprimer les espaces multiples
    term = term.trim().replace(/\s+/g, ' ');
    
    // Supprimer les caractères spéciaux problématiques mais garder les accents
    // Garder les lettres, chiffres, espaces, tirets, underscores
    term = term.replace(/[^\w\s\-àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/gi, '');
    
    // Limiter la longueur (Pexels recommande max 100 caractères)
    if (term.length > 100) {
      term = term.substring(0, 100).trim();
    }
    
    // Si le terme est trop court après nettoyage, retourner null
    if (term.length < 1) {
      return null;
    }
    
    return term;
  }

  // Rechercher des images avec Pexels API
  async function searchImagesPexels(term, page) {
    try {
      const perPage = 20;
      
      // Nettoyer le terme de recherche
      const cleanTerm = cleanSearchTerm(term);
      if (!cleanTerm) {
        console.warn('Terme de recherche invalide après nettoyage:', term);
        return [];
      }
      
      // Encoder correctement l'URL
      const encodedTerm = encodeURIComponent(cleanTerm);
      const apiUrl = `${PEXELS_API_URL}?query=${encodedTerm}&per_page=${perPage}&page=${page}`;
      
      console.log('Requête Pexels:', {
        originalTerm: term,
        cleanTerm: cleanTerm,
        encodedTerm: encodedTerm,
        url: apiUrl
      });
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API Pexels:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Gérer les erreurs spécifiques
        if (response.status === 401) {
          throw new Error('Clé API Pexels invalide');
        } else if (response.status === 429) {
          throw new Error('Trop de requêtes. Veuillez patienter un moment.');
        } else {
          throw new Error(`Erreur API Pexels: ${response.status} - ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      console.log('Réponse Pexels:', {
        totalResults: data.total_results,
        photosCount: data.photos ? data.photos.length : 0,
        page: data.page,
        perPage: data.per_page
      });
      
      // Sauvegarder le total de résultats pour la pagination
      totalResults = data.total_results || 0;
      
      if (!data.photos || data.photos.length === 0) {
        console.log('Aucune photo trouvée pour:', cleanTerm);
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
      // Utiliser un proxy CORS pour éviter les problèmes de chargement
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(img.url)}&w=400&h=300&fit=cover`;
      const fullProxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(img.fullUrl || img.url)}&w=1200&h=900&fit=cover`;
      
      return `
      <div class="image-search-item" data-image-id="${img.id}">
        <div class="image-search-item-image">
          <img 
            src="${proxyUrl}" 
            alt="${escapeHtml(img.description)}" 
            loading="lazy"
            data-original-url="${img.url}"
            data-full-url="${img.fullUrl || img.url}"
            onerror="handleImageError(this, '${img.placeholder || ''}')"
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
        const imageId = e.currentTarget.dataset.imageId;
        selectImage(imageUrl, imageId);
      });
    });
  }

  // Sélectionner une image
  function selectImage(imageUrl, imageId) {
    // Créer un élément image dans le PDF
    const pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) return;

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

    // Créer l'élément image avec gestion du chargement
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
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Afficher un loader pendant le chargement
    const loader = document.createElement('div');
    loader.className = 'image-loading';
    loader.innerHTML = '<div class="spinner"></div><p>Chargement de l\'image...</p>';
    loader.style.cssText = `
      text-align: center;
      padding: 40px;
      color: #666;
    `;

    // Charger l'image avec gestion CORS
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    
    tempImg.onload = function() {
      imgElement.src = imageUrl;
      imgElement.crossOrigin = 'anonymous';
      imgElement.style.opacity = '1';
      if (loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    };

    tempImg.onerror = function() {
      console.error('Erreur lors du chargement de l\'image:', imageUrl);
      // Si l'image ne charge pas, utiliser une image placeholder
      imgElement.src = `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
          <rect fill="#F6E2BE" width="400" height="300"/>
          <text fill="#60191A" font-family="sans-serif" font-size="16" x="50%" y="50%" text-anchor="middle" dy=".3em">
            Erreur de chargement
          </text>
        </svg>
      `)}`;
      imgElement.style.opacity = '1';
      if (loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
      showMessage('Erreur lors du chargement de l\'image. Image placeholder utilisée.', 'error');
    };

    tempImg.src = imageUrl;

    // Placer l'image à la position choisie
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
          // Trouver le dernier élément de recettes
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

    // Insérer le loader d'abord
    if (targetElement) {
      pdfPreview.insertBefore(loader, targetElement);
      pdfPreview.insertBefore(imgElement, targetElement);
    } else {
      // Par défaut, ajouter après le header
      const headerContent = pdfPreview.querySelector('.header-content');
      if (headerContent) {
        headerContent.parentNode.insertBefore(loader, headerContent.nextSibling);
        headerContent.parentNode.insertBefore(imgElement, headerContent.nextSibling);
      }
    }

    // Fermer la modal
    closeModal();
    
    // Afficher un message de succès
    showMessage('Image ajoutée avec succès !', 'success');
    
    // Rendre l'image éditable (ajouter l'événement de clic)
    // L'événement est déjà géré par la délégation d'événements dans preview-image-editor.js
    // Mais on peut aussi ajouter un indicateur visuel
    imgElement.style.cursor = 'pointer';
    imgElement.title = 'Cliquez pour éditer';
    
    // S'assurer que l'éditeur est initialisé
    if (window.initImageEditor) {
      window.initImageEditor();
    }
  }
  
  // Exposer la fonction pour l'éditeur d'images
  window.showImageSearchMessage = showMessage;

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

  // Générer des suggestions de recherche
  function generateSearchSuggestions(term) {
    const suggestions = [];
    
    // Si le terme contient des caractères spéciaux, suggérer une version simplifiée
    if (/[^\w\s\-àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/gi.test(term)) {
      const simplified = term.replace(/[^\w\s\-àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/gi, ' ').trim();
      if (simplified && simplified !== term) {
        suggestions.push(`"${simplified}"`);
      }
    }
    
    // Suggérer des termes génériques si le terme est très spécifique
    const genericTerms = ['nature', 'food', 'fruit', 'vegetable', 'product', 'fresh'];
    if (term.length > 15) {
      suggestions.push(...genericTerms.slice(0, 2));
    }
    
    return suggestions;
  }

  // Afficher "aucun résultat"
  function showNoResults() {
    if (imageGrid) {
      imageGrid.innerHTML = '<div class="image-search-empty"><p>😔 Aucune image trouvée pour cette recherche</p><p style="font-size: 0.9rem; color: #999; margin-top: 8px;">Essayez avec des mots-clés plus génériques ou en anglais</p></div>';
    }
  }

  // Mettre à jour la pagination
  let totalResults = 0;
  
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

  // Helper pour escape HTML
  function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialiser quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

