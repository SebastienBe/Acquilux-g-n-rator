// ========================================
// GÉNÉRATION HTML
// ========================================

/**
 * Génère le HTML de la fiche produit
 * @param {Object} pdfContent - Données du produit
 * @returns {string} - HTML généré
 */
function generateHTML(pdfContent) {
  console.log('📄 Génération HTML - Données reçues:', pdfContent);
  
  // Vérification de la structure des données
  if (!pdfContent || typeof pdfContent !== 'object') {
    console.error('❌ pdfContent invalide:', pdfContent);
    throw new Error('Données invalides pour la génération HTML');
  }
  
  const { titre, slogan, caracteristiques, consommation, recettes } = pdfContent;

  // Déterminer les badges sélectionnés (multi)
  // Priorité : badges stockés dans sessionStorage (sélection explicite de l'utilisateur)
  // Ne pas utiliser pdfContent.badges automatiquement pour éviter l'affichage de badges non désirés
  let badgeNames = [];
  
  if (typeof getBadgeNamesArray === 'function') {
    badgeNames = getBadgeNamesArray();
  }
  
  // Si aucun badge n'est stocké dans sessionStorage, ne pas utiliser pdfContent.badges
  // Cela évite l'affichage automatique de badges comme "Circuit court"
  if (badgeNames.length === 0) {
    badgeNames = [];
  }

  badgeNames = badgeNames.filter(Boolean);

  console.log('🏷️ Badges à afficher:', badgeNames);

  const badgeItemsHtml = badgeNames.map((name, idx) => {
    const badgeParam = encodeURIComponent(name);
    const badgeUrl = `${CONFIG.N8N_BADGE_IMAGE_URL}?name=${badgeParam}&cb=${Date.now()}`;
    const cls = idx === 0 ? 'badge-instance primary-badge' : 'badge-instance extra-badge';
    return `<img src="${badgeUrl}" alt="${Utils.escapeHtml(name)}" class="${cls}" data-badge="${Utils.escapeHtml(name)}">`;
  }).join('');

  console.log('🏷️ HTML badges généré:', badgeItemsHtml ? `${badgeItemsHtml.length} caractères` : 'VIDE');

  // Vérification et normalisation des caractéristiques
  let caracArray = [];
  if (Array.isArray(caracteristiques) && caracteristiques.length > 0) {
    caracArray = caracteristiques;
    console.log(`✅ ${caracArray.length} caractéristiques trouvées (format tableau)`);
  } else if (caracteristiques && typeof caracteristiques === 'object') {
    // Si c'est un objet, essayer de le convertir en tableau
    caracArray = Object.values(caracteristiques);
    console.log(`✅ ${caracArray.length} caractéristiques trouvées (format objet converti)`);
  } else {
    console.warn('⚠️ Aucune caractéristique valide trouvée:', caracteristiques);
  }
  
  console.log('🌿 Caractéristiques normalisées:', caracArray);

  // Caractéristiques
  const caracHtml = caracArray.length > 0 
    ? caracArray.map(c => {
        // Gérer différents formats possibles
        const type = Utils.escapeHtml(c.type || c.nom || 'Caractéristique');
        const description = Utils.escapeHtml(c.description || c.value || c.text || '');
        if (!description) {
          console.warn('⚠️ Caractéristique sans description:', c);
          return '';
        }
        return `<li><strong>${type}</strong> : ${description}</li>`;
      }).filter(html => html !== '').join('')
    : '<li>Aucune caractéristique disponible</li>';
  
  console.log('📝 HTML caractéristiques généré, longueur:', caracHtml.length);

  // Consommation
  const consoArray = Array.isArray(consommation) ? consommation : [];
  const consoHtml = consoArray.length > 0
    ? consoArray.map(s => `<li>${Utils.escapeHtml(s)}</li>`).join('')
    : '<li>Aucune suggestion disponible</li>';

  // Recettes
  const recettesArray = Array.isArray(recettes) ? recettes : [];
  const recettesHtml = recettesArray.length > 0
    ? recettesArray.map(r => {
        const emoji = r.type === 'Sucrée' ? '🍰' : '🍽';
        const nom = Utils.escapeHtml(r.nom || 'Recette');
        const ingredients = Utils.escapeHtml(r.ingredients || '');
        const astuce = Utils.escapeHtml(r.astuce || '');
        return `
          <div class="recipe">
            <strong>${emoji} Recette ${Utils.escapeHtml(r.type || '')} : ${nom}</strong>
            <p class="recipe-ingredients">
              <strong>Ingrédients :</strong>
              <span class="ingredients-content">${ingredients}</span>
            </p>
            <em>💡 Astuce : ${astuce}</em>
          </div>
        `;
      }).join('')
    : '<p>Aucune recette disponible</p>';

  // Retour avec footer Otera - Identité visuelle
  const finalHtml = `
    <div class="header-orange-band"></div>
    <div class="badge-group">
      ${badgeItemsHtml}
    </div>
    <div class="header-content">
      <h1>${Utils.escapeHtml(titre || 'Produit')}</h1>
      <p class="slogan">${Utils.escapeHtml(slogan || 'Un trésor de saveurs à découvrir')}</p>
    </div>
    
    <h2><span class="emoji">🌿</span> Caractéristiques</h2>
    <ul>${caracHtml}</ul>
    
    <h2><span class="emoji">🍴</span> 3 Façons de le Consommer</h2>
    <ul>${consoHtml}</ul>
    
    <h2><span class="emoji">👨‍🍳</span> Idées Recettes</h2>
    ${recettesHtml}
    
    <div class="otera-footer">
    </div>
  `;
  
  console.log('✅ HTML final généré, longueur totale:', finalHtml.length);
  console.log('✅ Vérification finale - Caractéristiques présentes:', finalHtml.includes('Caractéristiques') && finalHtml.includes('</ul>'));
  
  return finalHtml;
}

window.generateHTML = generateHTML;

