// ========================================
// ÉDITEUR DIRECT - Sélection et édition au clic
// ========================================

(function() {
  let pdfPreview = null;
  let selectedElement = null;
  let contextPanel = null;
  let isEditMode = false;

  // Types d'éléments éditables avec leurs configurations
  const editableElements = {
    'h1': {
      type: 'text',
      label: 'Titre principal',
      controlId: 'contentTitle',
      section: 'header'
    },
    '.slogan': {
      type: 'text',
      label: 'Slogan',
      controlId: 'contentSlogan',
      section: 'header'
    },
    'h2': {
      type: 'section',
      label: 'Section',
      section: 'sections'
    },
    'li': {
      type: 'list-item',
      label: 'Élément de liste',
      section: 'content'
    },
    '.recipe': {
      type: 'recipe',
      label: 'Recette',
      section: 'recipes'
    }
  };

  // Initialisation
  function init() {
    pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) {
      setTimeout(init, 100);
      return;
    }

    // Nettoyer les anciens context-panels s'ils existent
    const oldPanel = document.getElementById('contextPanel');
    if (oldPanel) {
      oldPanel.remove();
    }

    // Désactivé - Utilisation du système Figma Panel à la place
    // createContextPanel();
    setupEditableElements();
    setupClickHandlers();
    setupKeyboardShortcuts();
  }

  // Créer le panneau contextuel
  function createContextPanel() {
    contextPanel = document.createElement('div');
    contextPanel.id = 'contextPanel';
    contextPanel.className = 'context-panel';
    contextPanel.innerHTML = `
      <div class="context-panel-header" id="contextPanelHeader">
        <h3 id="contextPanelTitle">Éditer l'élément</h3>
        <button class="context-panel-close" id="contextPanelClose" aria-label="Fermer">
          <span>✕</span>
        </button>
      </div>
      <div class="context-panel-body" id="contextPanelBody">
        <!-- Le contenu sera généré dynamiquement -->
      </div>
    `;
    document.body.appendChild(contextPanel);

    // Activer le drag & drop sur le header
    setupPanelDrag();

    // Fermer le panneau
    const closeBtn = document.getElementById('contextPanelClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        deselectElement();
      });
    }

    // Fermer en cliquant à l'extérieur - Désactivé, utilisation du système Figma Panel
    // document.addEventListener('click', (e) => {
    //   // Ne pas fermer si on clique sur le bouton toggle du mode édition
    //   if (e.target.closest('#editModeToggle')) return;
    //   
    //   if (contextPanel && !contextPanel.contains(e.target) && 
    //       !e.target.closest('#pdfPreview') && 
    //       !e.target.closest('.badges-drawer') &&
    //       !e.target.closest('.floating-toolbar')) {
    //     deselectElement();
    //   }
    // });
  }

  // Configurer le drag & drop du panneau
  function setupPanelDrag() {
    const header = document.getElementById('contextPanelHeader');
    if (!header || !contextPanel) return;

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Récupérer la position sauvegardée
    const savedPosition = sessionStorage.getItem('contextPanelPosition');
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        xOffset = pos.x || 0;
        yOffset = pos.y || 0;
        contextPanel.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      } catch (e) {
        console.warn('Impossible de charger la position sauvegardée du panneau');
      }
    }

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      // Ne pas activer le drag si on clique sur le bouton de fermeture
      if (e.target.closest('.context-panel-close')) {
        return;
      }

      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
        contextPanel.style.cursor = 'grabbing';
        header.style.cursor = 'grabbing';
        e.preventDefault();
      }
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        // Limiter le déplacement aux limites de l'écran
        const panelRect = contextPanel.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Limites horizontales
        if (xOffset + panelRect.width / 2 > viewportWidth) {
          xOffset = viewportWidth - panelRect.width / 2;
        }
        if (xOffset - panelRect.width / 2 < -viewportWidth / 2) {
          xOffset = -panelRect.width / 2;
        }

        // Limites verticales
        if (yOffset + panelRect.height / 2 > viewportHeight) {
          yOffset = viewportHeight - panelRect.height / 2;
        }
        if (yOffset - panelRect.height / 2 < -viewportHeight / 2) {
          yOffset = -panelRect.height / 2;
        }

        setTransform();
      }
    }

    function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      contextPanel.style.cursor = '';
      header.style.cursor = 'grab';

      // Sauvegarder la position
      sessionStorage.setItem('contextPanelPosition', JSON.stringify({
        x: xOffset,
        y: yOffset
      }));
    }

    function setTransform() {
      contextPanel.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    }
  }

  // Configurer les éléments éditables
  function setupEditableElements() {
    if (!pdfPreview) return;

    // Ajouter les attributs data-editable
    const h1 = pdfPreview.querySelector('.header-content h1');
    if (h1) {
      h1.setAttribute('data-editable', 'h1');
      h1.setAttribute('data-editable-type', 'title');
    }

    const slogan = pdfPreview.querySelector('.header-content .slogan');
    if (slogan) {
      slogan.setAttribute('data-editable', 'slogan');
      slogan.setAttribute('data-editable-type', 'slogan');
    }
    
    // Ajouter l'attribut pour le bloc principal
    if (pdfPreview) {
      pdfPreview.setAttribute('data-editable', 'main');
      pdfPreview.setAttribute('data-editable-type', 'main');
    }

    // Sections H2
    pdfPreview.querySelectorAll('h2').forEach((h2, index) => {
      h2.setAttribute('data-editable', 'h2');
      h2.setAttribute('data-editable-type', 'section');
      h2.setAttribute('data-section-index', index);
    });

    // Éléments de liste - Caractéristiques et Consommation
    pdfPreview.querySelectorAll('ul').forEach((ul) => {
      const previousH2 = ul.previousElementSibling;
      let sectionType = 'other';
      
      if (previousH2 && previousH2.tagName === 'H2') {
        const h2Text = previousH2.textContent || '';
        if (h2Text.includes('Caractéristiques')) {
          sectionType = 'caracteristic';
        } else if (h2Text.includes('Consommer') || h2Text.includes('Consommer')) {
          sectionType = 'consommation';
        }
      }
      
      // Marquer chaque élément de la liste avec son index dans cette liste spécifique
      ul.querySelectorAll('li').forEach((li, index) => {
        li.setAttribute('data-editable', 'li');
        li.setAttribute('data-editable-type', 'list-item');
        li.setAttribute('data-list-index', index);
        li.setAttribute('data-list-type', sectionType);
      });
    });

    // Recettes - trouver toutes les recettes, même celles qui viennent d'être créées
    const allRecettes = pdfPreview.querySelectorAll('.recipe');
    allRecettes.forEach((recipe, index) => {
      // Vérifier si l'élément a déjà l'attribut pour éviter de le réinitialiser
      if (!recipe.hasAttribute('data-editable')) {
        recipe.setAttribute('data-editable', 'recipe');
        recipe.setAttribute('data-editable-type', 'recipe');
      }
      recipe.setAttribute('data-recipe-index', index);
    });
    
    // Éléments éditables configurés
  }

  // Gestionnaire de clic pour la preview (défini avant setupClickHandlers)
  function handlePreviewClick(e) {
    // Ne pas sélectionner si on clique sur un badge (drag & drop)
    if (e.target.closest('.badge-instance')) {
      return;
    }

    // Ne pas sélectionner si on clique sur un élément enfant d'un élément éditable (comme strong, em, span dans les recettes)
    // On veut sélectionner l'élément parent éditable
    let element = e.target.closest('[data-editable]');
    
    // Si on clique sur un élément enfant (strong, em, span) dans une recette, remonter jusqu'à .recipe
    if (!element && e.target.closest('.recipe')) {
      element = e.target.closest('.recipe');
    }
    
    // Si on clique sur un élément enfant dans un li, remonter jusqu'au li
    if (!element && e.target.closest('li')) {
      element = e.target.closest('li');
    }
    
    // Si on clique sur un élément enfant dans un h1 ou h2, remonter jusqu'au h1/h2
    if (!element && (e.target.closest('h1') || e.target.closest('h2'))) {
      element = e.target.closest('h1') || e.target.closest('h2');
    }
    
    // Si on clique sur un élément enfant dans un .slogan, remonter jusqu'au .slogan
    if (!element && e.target.closest('.slogan')) {
      element = e.target.closest('.slogan');
    }

    if (element && element.hasAttribute('data-editable')) {
      e.stopPropagation();
      selectElement(element);
    }
  }

  // Configurer les gestionnaires de clic
  let clickHandlerAttached = false;
  
  function setupClickHandlers() {
    if (!pdfPreview) return;

    // Supprimer l'ancien listener si il existe
    if (clickHandlerAttached) {
      pdfPreview.removeEventListener('click', handlePreviewClick);
    }

    // Ajouter le nouveau listener
    pdfPreview.addEventListener('click', handlePreviewClick);
    clickHandlerAttached = true;
  }

  // Sélectionner un élément
  function selectElement(element) {
    // Désélectionner l'élément précédent
    if (selectedElement) {
      selectedElement.classList.remove('selected');
    }

    selectedElement = element;
    element.classList.add('selected');

    // Afficher le panneau contextuel - Désactivé, utilisation du système Figma Panel
    // showContextPanel(element);
  }

  // Désélectionner l'élément
  function deselectElement() {
    if (selectedElement) {
      selectedElement.classList.remove('selected');
      selectedElement = null;
    }
    hideContextPanel();
  }

  // Afficher le panneau contextuel
  function showContextPanel(element) {
    if (!contextPanel) return;

    const editableType = element.getAttribute('data-editable-type');
    const body = document.getElementById('contextPanelBody');
    const title = document.getElementById('contextPanelTitle');

    if (!body || !title) return;

    // Générer le contenu selon le type
    let content = '';
    let panelTitle = 'Éditer l\'élément';

    switch (editableType) {
      case 'text':
        if (element.tagName === 'H1') {
          panelTitle = 'Éditer le titre';
          content = generateTextEditor(element, 'contentTitle', 'Titre principal');
        } else if (element.classList.contains('slogan')) {
          panelTitle = 'Éditer le slogan';
          content = generateTextEditor(element, 'contentSlogan', 'Slogan');
        }
        break;

      case 'section':
        panelTitle = 'Éditer la section';
        content = generateSectionEditor(element);
        break;

      case 'list-item':
        panelTitle = 'Éditer l\'élément de liste';
        content = generateListItemEditor(element);
        break;

      case 'recipe':
        panelTitle = 'Éditer la recette';
        content = generateRecipeEditor(element);
        break;
    }

    title.textContent = panelTitle;
    body.innerHTML = content;

    // Attacher les événements
    attachContextPanelEvents(element, editableType);

    // Afficher le panneau
    contextPanel.classList.add('active');
    
    // Positionner le panneau près de l'élément
    positionContextPanel(element);
  }

  // Positionner le panneau contextuel
  function positionContextPanel(element) {
    if (!contextPanel || !element) return;

    // Si une position a été sauvegardée, ne pas repositionner automatiquement
    const savedPosition = sessionStorage.getItem('contextPanelPosition');
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        if (pos.x !== undefined && pos.y !== undefined) {
          // Utiliser la position sauvegardée
          return;
        }
      } catch (e) {
        // Continuer avec le positionnement automatique
      }
    }

    const rect = element.getBoundingClientRect();
    const panelRect = contextPanel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = rect.bottom + 10;
    let left = rect.left;

    // Ajuster si le panneau dépasse à droite
    if (left + panelRect.width > viewportWidth) {
      left = viewportWidth - panelRect.width - 20;
    }

    // Ajuster si le panneau dépasse en bas
    if (top + panelRect.height > viewportHeight) {
      top = rect.top - panelRect.height - 10;
    }

    // Ajuster si le panneau dépasse en haut
    if (top < 0) {
      top = 10;
    }

    // Ajuster si le panneau dépasse à gauche
    if (left < 0) {
      left = 10;
    }

    contextPanel.style.top = `${top}px`;
    contextPanel.style.left = `${left}px`;
    contextPanel.style.transform = 'translate(0, 0)';
  }

  // Masquer le panneau contextuel
  function hideContextPanel() {
    if (contextPanel) {
      contextPanel.classList.remove('active');
    }
  }

  // Générer l'éditeur de texte
  function generateTextEditor(element, controlId, label) {
    const value = element.textContent || '';
    return `
      <div class="context-control-group">
        <label class="context-label">${label}</label>
        <input type="text" class="context-input" id="context-${controlId}" value="${escapeHtml(value)}" placeholder="${label}">
      </div>
      <div class="context-actions">
        <button class="context-btn context-btn-primary" data-action="save">Enregistrer</button>
        <button class="context-btn" data-action="cancel">Annuler</button>
      </div>
    `;
  }

  // Générer l'éditeur de section
  function generateSectionEditor(element) {
    const text = element.textContent || '';
    const emoji = element.querySelector('.emoji')?.textContent || '';
    const sectionIndex = parseInt(element.getAttribute('data-section-index'));
    
    // Ajouter un bouton pour ajouter des éléments à cette section
    let addButtonHtml = '';
    if (sectionIndex === 0) {
      // Section Caractéristiques
      addButtonHtml = `
        <div class="context-control-group">
          <button class="context-btn context-btn-secondary" data-action="add-item" data-section="caracteristic">
            + Ajouter une caractéristique
          </button>
        </div>
      `;
    } else if (sectionIndex === 1) {
      // Section Consommation
      addButtonHtml = `
        <div class="context-control-group">
          <button class="context-btn context-btn-secondary" data-action="add-item" data-section="consommation">
            + Ajouter une consommation
          </button>
        </div>
      `;
    } else if (sectionIndex === 2) {
      // Section Recettes
      addButtonHtml = `
        <div class="context-control-group">
          <button class="context-btn context-btn-secondary" data-action="add-item" data-section="recette">
            + Ajouter une recette
          </button>
        </div>
      `;
    }
    
    return `
      <div class="context-control-group">
        <label class="context-label">Titre de la section</label>
        <input type="text" class="context-input" id="context-section-text" value="${escapeHtml(text.replace(emoji, '').trim())}" placeholder="Titre">
      </div>
      <div class="context-control-group">
        <label class="context-label">Emoji</label>
        <input type="text" class="context-input" id="context-section-emoji" value="${escapeHtml(emoji)}" placeholder="🌿" maxlength="2">
      </div>
      ${addButtonHtml}
      <div class="context-actions">
        <button class="context-btn context-btn-primary" data-action="save">Enregistrer</button>
        <button class="context-btn" data-action="cancel">Annuler</button>
      </div>
    `;
  }

  // Générer l'éditeur d'élément de liste
  function generateListItemEditor(element) {
    const listType = element.getAttribute('data-list-type');
    const index = parseInt(element.getAttribute('data-list-index'));
    
    if (listType === 'caracteristic') {
      // Extraire type et description depuis le HTML
      const strong = element.querySelector('strong');
      const type = strong ? strong.textContent.trim() : '';
      // Récupérer le texte après le strong
      const fullText = element.textContent || '';
      const typeIndex = fullText.indexOf(type);
      const description = typeIndex >= 0 ? fullText.substring(typeIndex + type.length).replace(/^:\s*/, '').trim() : '';
      
      return `
        <div class="context-control-group">
          <label class="context-label">Type</label>
          <input type="text" class="context-input" id="context-list-type" value="${escapeHtml(type)}" placeholder="Type">
        </div>
        <div class="context-control-group">
          <label class="context-label">Description</label>
          <textarea class="context-textarea" id="context-list-description" placeholder="Description">${escapeHtml(description)}</textarea>
        </div>
        <div class="context-actions">
          <button class="context-btn context-btn-primary" data-action="save" data-list-type="caracteristic" data-index="${index}">Enregistrer</button>
          <button class="context-btn context-btn-danger" data-action="delete" data-list-type="caracteristic" data-index="${index}">Supprimer</button>
          <button class="context-btn" data-action="cancel">Annuler</button>
        </div>
      `;
    } else if (listType === 'consommation') {
      const text = element.textContent || '';
      return `
        <div class="context-control-group">
          <label class="context-label">Texte</label>
          <textarea class="context-textarea" id="context-list-text" placeholder="Texte">${escapeHtml(text)}</textarea>
        </div>
        <div class="context-actions">
          <button class="context-btn context-btn-primary" data-action="save" data-list-type="${listType}" data-index="${index}">Enregistrer</button>
          <button class="context-btn context-btn-danger" data-action="delete" data-list-type="${listType}" data-index="${index}">Supprimer</button>
          <button class="context-btn" data-action="cancel">Annuler</button>
        </div>
      `;
    } else {
      const text = element.textContent || '';
      return `
        <div class="context-control-group">
          <label class="context-label">Texte</label>
          <textarea class="context-textarea" id="context-list-text" placeholder="Texte">${escapeHtml(text)}</textarea>
        </div>
        <div class="context-actions">
          <button class="context-btn context-btn-primary" data-action="save" data-list-type="${listType}" data-index="${index}">Enregistrer</button>
          <button class="context-btn context-btn-danger" data-action="delete" data-list-type="${listType}" data-index="${index}">Supprimer</button>
          <button class="context-btn" data-action="cancel">Annuler</button>
        </div>
      `;
    }
  }

  // Générer l'éditeur de recette
  function generateRecipeEditor(element) {
    const index = parseInt(element.getAttribute('data-recipe-index'));
    const strong = element.querySelector('strong');
    const recipeText = strong?.textContent || '';
    const ingredients = element.querySelector('.recipe-ingredients .ingredients-content')?.textContent || '';
    const astuce = element.querySelector('em')?.textContent?.replace('💡 Astuce : ', '') || '';

    // Extraire nom et type de la recette
    const recipeMatch = recipeText.match(/Recette\s+(Sucrée|Salée)\s*:\s*(.*)/);
    const type = recipeMatch ? recipeMatch[1] : 'Sucrée';
    const nom = recipeMatch ? recipeMatch[2] : '';

    return `
      <div class="context-control-group">
        <label class="context-label">Nom de la recette</label>
        <input type="text" class="context-input" id="context-recipe-nom" value="${escapeHtml(nom)}" placeholder="Nom">
      </div>
      <div class="context-control-group">
        <label class="context-label">Type</label>
        <select class="context-select" id="context-recipe-type">
          <option value="Sucrée" ${type === 'Sucrée' ? 'selected' : ''}>Sucrée</option>
          <option value="Salée" ${type === 'Salée' ? 'selected' : ''}>Salée</option>
        </select>
      </div>
      <div class="context-control-group">
        <label class="context-label">Ingrédients</label>
        <textarea class="context-textarea" id="context-recipe-ingredients" placeholder="Ingrédients">${escapeHtml(ingredients)}</textarea>
      </div>
      <div class="context-control-group">
        <label class="context-label">Astuce</label>
        <textarea class="context-textarea" id="context-recipe-astuce" placeholder="Astuce">${escapeHtml(astuce)}</textarea>
      </div>
      <div class="context-actions">
        <button class="context-btn context-btn-primary" data-action="save" data-recipe-index="${index}">Enregistrer</button>
        <button class="context-btn context-btn-danger" data-action="delete" data-recipe-index="${index}">Supprimer</button>
        <button class="context-btn" data-action="cancel">Annuler</button>
      </div>
    `;
  }

  // Attacher les événements du panneau contextuel
  function attachContextPanelEvents(element, editableType) {
    const saveBtn = contextPanel.querySelector('[data-action="save"]');
    const cancelBtn = contextPanel.querySelector('[data-action="cancel"]');
    const deleteBtn = contextPanel.querySelector('[data-action="delete"]');
    const addItemBtn = contextPanel.querySelector('[data-action="add-item"]');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        saveElement(element, editableType);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        deselectElement();
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        deleteElement(element, editableType);
      });
    }

    if (addItemBtn) {
      addItemBtn.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        addItemToSection(section);
      });
    }

    // Sauvegarder avec Enter dans les inputs
    contextPanel.querySelectorAll('.context-input, .context-textarea').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && input.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (saveBtn) saveBtn.click();
        }
      });
    });
  }

  // Ajouter un élément à une section
  function addItemToSection(section) {
    if (!window.currentPdfContent) return;

    switch (section) {
      case 'caracteristic':
        if (!window.currentPdfContent.caracteristiques) {
          window.currentPdfContent.caracteristiques = [];
        }
        window.currentPdfContent.caracteristiques.push({ type: 'Nouveau', description: 'Description' });
        break;
      case 'consommation':
        if (!window.currentPdfContent.consommation) {
          window.currentPdfContent.consommation = [];
        }
        window.currentPdfContent.consommation.push('Nouvelle façon de consommer');
        break;
      case 'recette':
        if (!window.currentPdfContent.recettes) {
          window.currentPdfContent.recettes = [];
        }
        window.currentPdfContent.recettes.push({
          nom: 'Nouvelle recette',
          type: 'Sucrée',
          ingredients: 'Ingrédients',
          astuce: 'Astuce'
        });
        break;
    }

    // Mettre à jour la preview
    if (window.generateHTML && window.currentPdfContent) {
      const html = window.generateHTML(window.currentPdfContent);
      if (pdfPreview) {
        pdfPreview.innerHTML = html;
        
        // Réappliquer les layouts badges
        if (typeof BadgeManager !== 'undefined' && BadgeManager.applyLayouts) {
          BadgeManager.applyLayouts(pdfPreview);
          BadgeManager.attachDragToAll(pdfPreview);
        }
        
        // Réappliquer les styles
        if (window.loadSavedSettings) {
          window.loadSavedSettings();
        }
        
        // IMPORTANT: Réinitialiser les éléments éditables APRÈS la génération du HTML
        setupEditableElements();
        
        // Réattacher les gestionnaires de clic
        setupClickHandlers();
      }
    }

    // Sauvegarder
    sessionStorage.setItem('pdfContent', JSON.stringify(window.currentPdfContent));
    
    // Fermer le panneau et sélectionner le nouvel élément
    deselectElement();
    
      // Sélectionner le dernier élément ajouté après un court délai pour laisser le temps au DOM de se mettre à jour
    setTimeout(() => {
      // Réinitialiser à nouveau pour être sûr que tout est configuré
      setupEditableElements();
      setupClickHandlers(); // Réattacher les gestionnaires de clic
      
      let lastElement = null;
      
      if (section === 'caracteristic') {
        const caracteristics = pdfPreview.querySelectorAll('[data-list-type="caracteristic"]');
        if (caracteristics.length > 0) {
          lastElement = caracteristics[caracteristics.length - 1];
        }
      } else if (section === 'consommation') {
        const consommations = pdfPreview.querySelectorAll('[data-list-type="consommation"]');
        if (consommations.length > 0) {
          lastElement = consommations[consommations.length - 1];
        }
      } else if (section === 'recette') {
        const recettes = pdfPreview.querySelectorAll('[data-editable-type="recipe"]');
        if (recettes.length > 0) {
          lastElement = recettes[recettes.length - 1];
        }
      }
      
      if (lastElement) {
        selectElement(lastElement);
      }
    }, 150);
  }

  // Sauvegarder l'élément
  function saveElement(element, editableType) {
    if (!element || !window.currentPdfContent) return;

    switch (editableType) {
      case 'text':
        if (element.tagName === 'H1') {
          const input = document.getElementById('context-contentTitle');
          if (input) {
            element.textContent = input.value || 'Produit';
            window.currentPdfContent.titre = input.value;
            // Mettre à jour l'input du dashboard
            const dashboardInput = document.getElementById('contentTitle');
            if (dashboardInput) dashboardInput.value = input.value;
          }
        } else if (element.classList.contains('slogan')) {
          const input = document.getElementById('context-contentSlogan');
          if (input) {
            element.textContent = input.value || 'Un trésor de saveurs à découvrir';
            window.currentPdfContent.slogan = input.value;
            // Mettre à jour l'input du dashboard
            const dashboardInput = document.getElementById('contentSlogan');
            if (dashboardInput) dashboardInput.value = input.value;
          }
        }
        break;

      case 'section':
        const sectionText = document.getElementById('context-section-text')?.value || '';
        const sectionEmoji = document.getElementById('context-section-emoji')?.value || '';
        const emojiSpan = element.querySelector('.emoji');
        if (emojiSpan) {
          emojiSpan.textContent = sectionEmoji;
        } else if (sectionEmoji) {
          const newEmoji = document.createElement('span');
          newEmoji.className = 'emoji';
          newEmoji.textContent = sectionEmoji;
          element.insertBefore(newEmoji, element.firstChild);
        }
        // Remplacer le texte en gardant l'emoji
        if (emojiSpan) {
          element.innerHTML = `<span class="emoji">${sectionEmoji}</span> ${sectionText}`;
        } else {
          element.textContent = sectionText;
        }
        break;

      case 'list-item':
        const listType = element.getAttribute('data-list-type');
        const listIndex = parseInt(element.getAttribute('data-list-index'));
        
        if (listType === 'caracteristic') {
          const type = document.getElementById('context-list-type')?.value || '';
          const description = document.getElementById('context-list-description')?.value || '';
          
          if (window.currentPdfContent.caracteristiques && 
              window.currentPdfContent.caracteristiques[listIndex]) {
            window.currentPdfContent.caracteristiques[listIndex].type = type;
            window.currentPdfContent.caracteristiques[listIndex].description = description;
          }
        } else if (listType === 'consommation') {
          const text = document.getElementById('context-list-text')?.value || '';
          if (window.currentPdfContent.consommation && 
              window.currentPdfContent.consommation[listIndex] !== undefined) {
            window.currentPdfContent.consommation[listIndex] = text;
          }
        }
        // Mettre à jour immédiatement l'élément dans le DOM
        if (listType === 'caracteristic') {
          const type = document.getElementById('context-list-type')?.value || '';
          const description = document.getElementById('context-list-description')?.value || '';
          element.innerHTML = `<strong>${escapeHtml(type)}</strong> : ${escapeHtml(description)}`;
        } else {
          const text = document.getElementById('context-list-text')?.value || '';
          element.textContent = text;
        }
        break;

      case 'recipe':
        const recipeIndex = parseInt(element.getAttribute('data-recipe-index'));
        const nom = document.getElementById('context-recipe-nom')?.value || '';
        const type = document.getElementById('context-recipe-type')?.value || 'Sucrée';
        const ingredients = document.getElementById('context-recipe-ingredients')?.value || '';
        const astuce = document.getElementById('context-recipe-astuce')?.value || '';
        
        if (window.currentPdfContent.recettes && 
            window.currentPdfContent.recettes[recipeIndex]) {
          window.currentPdfContent.recettes[recipeIndex].nom = nom;
          window.currentPdfContent.recettes[recipeIndex].type = type;
          window.currentPdfContent.recettes[recipeIndex].ingredients = ingredients;
          window.currentPdfContent.recettes[recipeIndex].astuce = astuce;
        }
        break;
    }

    // Mettre à jour la preview - utiliser updatePreview si disponible, sinon régénérer
    // Pour les éléments de liste, on a déjà mis à jour le DOM directement, donc on peut juste régénérer
    // Pour les autres éléments (texte, section), on régénère tout
    if (editableType === 'list-item' || editableType === 'recipe') {
      // Pour les listes et recettes, on régénère le HTML complet
      if (window.generateHTML && window.currentPdfContent) {
        const html = window.generateHTML(window.currentPdfContent);
        if (pdfPreview) {
          pdfPreview.innerHTML = html;
          setupEditableElements();
          setupClickHandlers(); // Réattacher les gestionnaires de clic
          // Réappliquer les layouts badges
          if (typeof BadgeManager !== 'undefined' && BadgeManager.applyLayouts) {
            BadgeManager.applyLayouts(pdfPreview);
            BadgeManager.attachDragToAll(pdfPreview);
          }
          // Réappliquer les styles
          if (window.loadSavedSettings) {
            window.loadSavedSettings();
          }
        }
      }
    } else {
      // Pour texte et section, on peut utiliser updatePreview si disponible
      if (typeof updatePreview === 'function') {
        updatePreview();
      } else if (window.generateHTML && window.currentPdfContent) {
        const html = window.generateHTML(window.currentPdfContent);
        if (pdfPreview) {
          pdfPreview.innerHTML = html;
          setupEditableElements();
          // Réappliquer les layouts badges
          if (typeof BadgeManager !== 'undefined' && BadgeManager.applyLayouts) {
            BadgeManager.applyLayouts(pdfPreview);
            BadgeManager.attachDragToAll(pdfPreview);
          }
          // Réappliquer les styles
          if (window.loadSavedSettings) {
            window.loadSavedSettings();
          }
        }
      }
    }

    // Sauvegarder
    if (window.currentPdfContent) {
      sessionStorage.setItem('pdfContent', JSON.stringify(window.currentPdfContent));
      // Sauvegarder dans l'historique
      if (window.saveEditorHistory) {
        window.saveEditorHistory();
      }
    }

    deselectElement();
  }

  // Supprimer l'élément
  function deleteElement(element, editableType) {
    if (!element || !window.currentPdfContent) return;

    const listType = element.getAttribute('data-list-type');
    const listIndex = parseInt(element.getAttribute('data-list-index'));
    const recipeIndex = parseInt(element.getAttribute('data-recipe-index'));

    switch (editableType) {
      case 'list-item':
        if (listType === 'caracteristic' && window.currentPdfContent.caracteristiques) {
          window.currentPdfContent.caracteristiques.splice(listIndex, 1);
        } else if (listType === 'consommation' && window.currentPdfContent.consommation) {
          window.currentPdfContent.consommation.splice(listIndex, 1);
        }
        break;

      case 'recipe':
        if (window.currentPdfContent.recettes) {
          window.currentPdfContent.recettes.splice(recipeIndex, 1);
        }
        break;
    }

    // Mettre à jour la preview
    if (window.generateHTML && window.currentPdfContent) {
      const html = window.generateHTML(window.currentPdfContent);
      if (pdfPreview) {
        pdfPreview.innerHTML = html;
        setupEditableElements();
        setupClickHandlers(); // Réattacher les gestionnaires de clic
        // Réappliquer les layouts badges
        if (typeof BadgeManager !== 'undefined' && BadgeManager.applyLayouts) {
          BadgeManager.applyLayouts(pdfPreview);
          BadgeManager.attachDragToAll(pdfPreview);
        }
        // Réappliquer les styles
        if (window.loadSavedSettings) {
          window.loadSavedSettings();
        }
      }
    }

    // Sauvegarder
    if (window.currentPdfContent) {
      sessionStorage.setItem('pdfContent', JSON.stringify(window.currentPdfContent));
    }

    // Mettre à jour l'éditeur de contenu
    if (typeof setupCaracteristicsEditor === 'function') {
      setupCaracteristicsEditor();
    }

    deselectElement();
  }

  // Raccourcis clavier
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Échap pour désélectionner
      if (e.key === 'Escape' && selectedElement) {
        deselectElement();
      }
    });
  }

  // Helper pour escape HTML
  function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Réinitialiser après mise à jour du preview
  function reinit() {
    if (pdfPreview) {
      setupEditableElements();
      setupClickHandlers();
    }
  }

  // Exposer les fonctions globalement pour réutilisation
  window.reinitDirectEditor = reinit;
  window.saveElement = saveElement;
  window.deleteElement = deleteElement;
  window.addItemToSection = addItemToSection;

  // Initialiser quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Réinitialiser après le chargement du preview
  const originalDisplayPreview = window.displayPreview;
  if (originalDisplayPreview) {
    window.displayPreview = async function(...args) {
      await originalDisplayPreview(...args);
      setTimeout(() => {
        pdfPreview = document.getElementById('pdfPreview');
        if (pdfPreview) {
          setupEditableElements();
          setupClickHandlers();
        }
      }, 300);
    };
  }
})();

