// ========================================
// ÉDITEUR DE CONTENU - Gestion dynamique du contenu éditable
// ========================================

(function() {
  let pdfPreview = null;
  let currentPdfContent = null;

  // Helper pour escapeHtml si Utils n'est pas disponible
  function escapeHtml(text) {
    if (typeof Utils !== 'undefined' && Utils.escapeHtml) {
      return Utils.escapeHtml(text);
    }
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialisation
  function init() {
    pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) {
      setTimeout(init, 100);
      return;
    }

    // Attendre que currentPdfContent soit disponible
    if (window.currentPdfContent) {
      currentPdfContent = window.currentPdfContent;
      setupContentEditor();
      initializeValues();
    } else {
      setTimeout(init, 100);
    }
  }

  function initializeValues() {
    // Initialiser les valeurs des inputs depuis le preview
    const h1 = pdfPreview?.querySelector('.header-content h1');
    const slogan = pdfPreview?.querySelector('.header-content .slogan');
    if (h1 && document.getElementById('contentTitle')) {
      document.getElementById('contentTitle').value = h1.textContent || '';
    }
    if (slogan && document.getElementById('contentSlogan')) {
      document.getElementById('contentSlogan').value = slogan.textContent || '';
    }
    // Footer vide - pas de texte à initialiser
  }

  function setupContentEditor() {
    setupHeaderControls();
    setupCaracteristicsEditor();
    setupConsommationEditor();
    setupRecettesEditor();
    setupFooterControls();
  }

  // ========================================
  // HEADER
  // ========================================
  function setupHeaderControls() {
    const titleInput = document.getElementById('contentTitle');
    const sloganInput = document.getElementById('contentSlogan');

    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        const h1 = pdfPreview?.querySelector('.header-content h1');
        if (h1) {
          h1.textContent = e.target.value || 'Produit';
          if (currentPdfContent) currentPdfContent.titre = e.target.value;
          saveContent();
        }
      });
    }

    if (sloganInput) {
      sloganInput.addEventListener('input', (e) => {
        const slogan = pdfPreview?.querySelector('.header-content .slogan');
        if (slogan) {
          slogan.textContent = e.target.value || 'Un trésor de saveurs à découvrir';
          if (currentPdfContent) currentPdfContent.slogan = e.target.value;
          saveContent();
        }
      });
    }
  }

  // ========================================
  // CARACTÉRISTIQUES
  // ========================================
  function setupCaracteristicsEditor() {
    const listContainer = document.getElementById('caracteristicsList');
    const addBtn = document.getElementById('addCaracteristic');

    if (!listContainer || !addBtn) return;

    function renderCaracteristics() {
      const caracs = currentPdfContent?.caracteristiques || [];
      if (caracs.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">Aucune caractéristique</p>';
        return;
      }

      listContainer.innerHTML = caracs.map((carac, index) => {
        const type = carac.type || carac.nom || '';
        const description = carac.description || carac.value || carac.text || '';
        return `
          <div class="editable-item" data-index="${index}">
            <div class="item-header">
              <span class="item-number">${index + 1}</span>
              <button class="btn-remove" data-index="${index}" title="Supprimer">
                <span>✕</span>
              </button>
            </div>
            <div class="item-content">
              <input type="text" class="text-input-small" placeholder="Type (ex: Apparence)" 
                     value="${escapeHtml(type)}" data-field="type" data-index="${index}">
              <textarea class="textarea-input" placeholder="Description" rows="2" 
                        data-field="description" data-index="${index}">${escapeHtml(description)}</textarea>
            </div>
          </div>
        `;
      }).join('');

      // Attacher les événements
      listContainer.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', (e) => {
          const index = parseInt(e.target.dataset.index);
          const field = e.target.dataset.field;
          if (currentPdfContent && currentPdfContent.caracteristiques[index]) {
            currentPdfContent.caracteristiques[index][field] = e.target.value;
            updatePreview();
            saveContent();
          }
        });
      });

      listContainer.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.closest('.btn-remove').dataset.index);
          removeCaracteristic(index);
        });
      });
    }

    function addCaracteristic() {
      if (!currentPdfContent) return;
      if (!currentPdfContent.caracteristiques) {
        currentPdfContent.caracteristiques = [];
      }
      currentPdfContent.caracteristiques.push({ type: '', description: '' });
      renderCaracteristics();
      updatePreview();
      saveContent();
    }

    function removeCaracteristic(index) {
      if (!currentPdfContent || !currentPdfContent.caracteristiques) return;
      currentPdfContent.caracteristiques.splice(index, 1);
      renderCaracteristics();
      updatePreview();
      saveContent();
    }

    addBtn.addEventListener('click', addCaracteristic);
    renderCaracteristics();
  }

  // ========================================
  // CONSOMMATION
  // ========================================
  function setupConsommationEditor() {
    const listContainer = document.getElementById('consommationList');
    const addBtn = document.getElementById('addConsommation');

    if (!listContainer || !addBtn) return;

    function renderConsommation() {
      const conso = currentPdfContent?.consommation || [];
      if (conso.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">Aucune façon de consommer</p>';
        return;
      }

      listContainer.innerHTML = conso.map((item, index) => {
        const text = typeof item === 'string' ? item : (item.text || item.description || '');
        return `
          <div class="editable-item" data-index="${index}">
            <div class="item-header">
              <span class="item-number">${index + 1}</span>
              <button class="btn-remove" data-index="${index}" title="Supprimer">
                <span>✕</span>
              </button>
            </div>
            <div class="item-content">
              <textarea class="textarea-input" placeholder="Façon de consommer" rows="2" 
                        data-index="${index}">${escapeHtml(text)}</textarea>
            </div>
          </div>
        `;
      }).join('');

      // Attacher les événements
      listContainer.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', (e) => {
          const index = parseInt(e.target.dataset.index);
          if (currentPdfContent && currentPdfContent.consommation) {
            currentPdfContent.consommation[index] = e.target.value;
            updatePreview();
            saveContent();
          }
        });
      });

      listContainer.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.closest('.btn-remove').dataset.index);
          removeConsommation(index);
        });
      });
    }

    function addConsommation() {
      if (!currentPdfContent) return;
      if (!currentPdfContent.consommation) {
        currentPdfContent.consommation = [];
      }
      currentPdfContent.consommation.push('');
      renderConsommation();
      updatePreview();
      saveContent();
    }

    function removeConsommation(index) {
      if (!currentPdfContent || !currentPdfContent.consommation) return;
      currentPdfContent.consommation.splice(index, 1);
      renderConsommation();
      updatePreview();
      saveContent();
    }

    addBtn.addEventListener('click', addConsommation);
    renderConsommation();
  }

  // ========================================
  // RECETTES
  // ========================================
  function setupRecettesEditor() {
    const listContainer = document.getElementById('recettesList');
    const addBtn = document.getElementById('addRecette');

    if (!listContainer || !addBtn) return;

    function renderRecettes() {
      const recettes = currentPdfContent?.recettes || [];
      if (recettes.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">Aucune recette</p>';
        return;
      }

      listContainer.innerHTML = recettes.map((recette, index) => {
        const nom = recette.nom || '';
        const type = recette.type || '';
        const ingredients = recette.ingredients || '';
        const astuce = recette.astuce || '';
        return `
          <div class="editable-item editable-item-large" data-index="${index}">
            <div class="item-header">
              <span class="item-number">${index + 1}</span>
              <button class="btn-remove" data-index="${index}" title="Supprimer">
                <span>✕</span>
              </button>
            </div>
            <div class="item-content">
              <div class="item-row">
                <input type="text" class="text-input-small" placeholder="Nom de la recette" 
                       value="${escapeHtml(nom)}" data-field="nom" data-index="${index}">
                <select class="select-input-small" data-field="type" data-index="${index}">
                  <option value="Sucrée" ${type === 'Sucrée' ? 'selected' : ''}>Sucrée</option>
                  <option value="Salée" ${type === 'Salée' ? 'selected' : ''}>Salée</option>
                </select>
              </div>
              <textarea class="textarea-input" placeholder="Ingrédients" rows="2" 
                        data-field="ingredients" data-index="${index}">${escapeHtml(ingredients)}</textarea>
              <textarea class="textarea-input" placeholder="Astuce" rows="2" 
                        data-field="astuce" data-index="${index}">${escapeHtml(astuce)}</textarea>
            </div>
          </div>
        `;
      }).join('');

      // Attacher les événements
      listContainer.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('input', (e) => {
          const index = parseInt(e.target.dataset.index);
          const field = e.target.dataset.field;
          if (currentPdfContent && currentPdfContent.recettes[index]) {
            currentPdfContent.recettes[index][field] = e.target.value;
            updatePreview();
            saveContent();
          }
        });
        input.addEventListener('change', (e) => {
          const index = parseInt(e.target.dataset.index);
          const field = e.target.dataset.field;
          if (currentPdfContent && currentPdfContent.recettes[index]) {
            currentPdfContent.recettes[index][field] = e.target.value;
            updatePreview();
            saveContent();
          }
        });
      });

      listContainer.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.closest('.btn-remove').dataset.index);
          removeRecette(index);
        });
      });
    }

    function addRecette() {
      if (!currentPdfContent) return;
      if (!currentPdfContent.recettes) {
        currentPdfContent.recettes = [];
      }
      currentPdfContent.recettes.push({ nom: '', type: 'Sucrée', ingredients: '', astuce: '' });
      renderRecettes();
      updatePreview();
      saveContent();
    }

    function removeRecette(index) {
      if (!currentPdfContent || !currentPdfContent.recettes) return;
      currentPdfContent.recettes.splice(index, 1);
      renderRecettes();
      updatePreview();
      saveContent();
    }

    addBtn.addEventListener('click', addRecette);
    renderRecettes();
  }

  // ========================================
  // FOOTER
  // ========================================
  function setupFooterControls() {
    const logoInput = document.getElementById('contentFooterLogo');
    const taglineInput = document.getElementById('contentFooterTagline');

    // Les contrôles du footer sont désactivés car le footer ne contient plus de texte
    // La barre de séparation est conservée via le CSS border-top
    if (logoInput) {
      logoInput.disabled = true;
      logoInput.placeholder = 'Désactivé - Footer vide';
    }

    if (taglineInput) {
      taglineInput.disabled = true;
      taglineInput.placeholder = 'Désactivé - Footer vide';
    }
  }

  // ========================================
  // HELPERS
  // ========================================
  function updatePreview() {
    if (!currentPdfContent || !pdfPreview) return;
    const html = generateHTML(currentPdfContent);
    pdfPreview.innerHTML = html;
    
    // Réappliquer les layouts badges
    if (typeof BadgeManager !== 'undefined' && BadgeManager.applyLayouts) {
      BadgeManager.applyLayouts(pdfPreview);
      BadgeManager.attachDragToAll(pdfPreview);
    }
    
    // Réappliquer les styles sauvegardés
    if (window.loadSavedSettings) {
      window.loadSavedSettings();
    }
  }

  function saveContent() {
    if (currentPdfContent) {
      sessionStorage.setItem('pdfContent', JSON.stringify(currentPdfContent));
      if (window.currentPdfContent) {
        window.currentPdfContent = currentPdfContent;
      }
    }
  }

  // Réinitialiser quand le preview est mis à jour
  const originalDisplayPreview = window.displayPreview;
  if (originalDisplayPreview) {
    window.displayPreview = async function(...args) {
      await originalDisplayPreview(...args);
      setTimeout(() => {
        pdfPreview = document.getElementById('pdfPreview');
        if (window.currentPdfContent) {
          currentPdfContent = window.currentPdfContent;
          setupContentEditor();
        }
      }, 200);
    };
  }

  // Initialiser quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

