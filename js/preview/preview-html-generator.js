// ========================================
// GÉNÉRATION HTML
// ========================================

/**
 * Génère le HTML de la fiche produit
 * @param {Object} pdfContent - Données du produit
 * @returns {string} - HTML généré
 */
function generateHTML(pdfContent) {
  // Vérification de la structure des données
  if (!pdfContent || typeof pdfContent !== 'object') {
    console.error('❌ pdfContent invalide:', pdfContent);
    throw new Error('Données invalides pour la génération HTML');
  }
  
  const { titre, sousTitre, slogan, caracteristiques, consommation } = pdfContent;

  // Déterminer les badges sélectionnés (multi)
  // Priorité 1 : badges stockés dans sessionStorage (sélection explicite de l'utilisateur)
  // Priorité 2 : badges venant du serveur (pdfContent.badges, pdfContent.badge, etc.)
  let badgeNames = [];
  
  // Récupérer les badges depuis sessionStorage d'abord
  if (typeof getBadgeNamesArray === 'function') {
    badgeNames = getBadgeNamesArray();
  }
  
  // Si aucun badge n'est stocké dans sessionStorage, utiliser les badges venant du serveur
  if (badgeNames.length === 0) {
    if (typeof BadgeManager !== 'undefined' && BadgeManager.extractBadgesFromContent) {
      badgeNames = BadgeManager.extractBadgesFromContent(pdfContent);
    } else {
      // Fallback si BadgeManager n'est pas disponible
      if (pdfContent.badges && Array.isArray(pdfContent.badges) && pdfContent.badges.length > 0) {
        badgeNames = pdfContent.badges.filter(Boolean);
      } else {
        const singleBadge = pdfContent.badge || pdfContent.badgeName || pdfContent.atout || 
                            pdfContent.atoutName || pdfContent.badgeSlug || pdfContent.badge_slug;
        if (singleBadge) {
          badgeNames = [singleBadge];
        }
      }
    }
  }

  const badgeItemsHtml = badgeNames.length > 0 
    ? badgeNames.map((name, idx) => {
        const badgeParam = encodeURIComponent(name);
        const badgeUrl = `${CONFIG.N8N_BADGE_IMAGE_URL}?name=${badgeParam}&cb=${Date.now()}`;
        const cls = idx === 0 ? 'badge-instance primary-badge' : 'badge-instance extra-badge';
        return `<img src="${badgeUrl}" alt="${Utils.escapeHtml(name)}" class="${cls}" data-badge="${Utils.escapeHtml(name)}" data-editable="badge" data-editable-type="badge" style="cursor: pointer;">`;
      }).join('')
    : '';

  // Vérification et normalisation des caractéristiques
  let caracArray = [];
  if (Array.isArray(caracteristiques) && caracteristiques.length > 0) {
    caracArray = caracteristiques;
  } else if (caracteristiques && typeof caracteristiques === 'object') {
    // Si c'est un objet, essayer de le convertir en tableau
    caracArray = Object.values(caracteristiques);
  }

  // Caractéristiques
  const caracHtml = caracArray.length > 0 
    ? caracArray.map(c => {
        // Gérer différents formats possibles
        const type = Utils.escapeHtml(c.type || c.nom || 'Caractéristique');
        const description = Utils.escapeHtml(c.description || c.value || c.text || '');
        if (!description) {
          return '';
        }
        return `<li><strong>${type}</strong> : ${description}</li>`;
      }).filter(html => html !== '').join('')
    : '<li>Aucune caractéristique disponible</li>';

  // Consommation
  const consoArray = Array.isArray(consommation) ? consommation : [];
  const consoHtml = consoArray.length > 0
    ? consoArray.map(s => `<li>${Utils.escapeHtml(s)}</li>`).join('')
    : '<li>Aucune suggestion disponible</li>';

  // Retour avec footer Otera - Identité visuelle
  const finalHtml = `
    <div id="headerOrangeBand" class="header-orange-band">
      <div id="badgeGroup" class="badge-group">
      ${badgeItemsHtml}
      </div>
      <div id="headerContent" class="header-content">
        <h1 id="mainTitle" data-editable="title" data-editable-type="title">${Utils.escapeHtml(titre || 'Produit')}</h1>
        ${sousTitre ? `<p id="mainSubtitle" class="subtitle" data-editable="subtitle" data-editable-type="subtitle">${Utils.escapeHtml(sousTitre)}</p>` : ''}
        ${slogan ? `<p id="mainSlogan" class="slogan" data-editable="slogan" data-editable-type="slogan">${Utils.escapeHtml(slogan)}</p>` : ''}
      </div>
    </div>
    <div id="productImageContainer" class="product-image-container" data-editable="image" data-editable-type="image">
      <!-- L'image sera ajoutée ici via le gestionnaire d'images -->
    </div>
    
    <h2 id="sectionCaracteristiques" data-section="caracteristiques" data-editable="section" data-editable-type="section"><span class="emoji">🌿</span> Caractéristiques</h2>
    <ul id="listCaracteristiques" data-section-content="caracteristiques">${caracHtml}</ul>
    
    <h2 id="sectionConsommation" data-section="consommation" data-editable="section" data-editable-type="section"><span class="emoji">🍴</span> 3 Façons de le Consommer</h2>
    <ul id="listConsommation" data-section-content="consommation">${consoHtml}</ul>
    
    <div id="oteraFooter" class="otera-footer">
    </div>
  `;
  
  return finalHtml;
}

window.generateHTML = generateHTML;

