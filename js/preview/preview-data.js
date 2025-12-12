// ========================================
// GESTION DES DONNÉES
// ========================================

/**
 * Charge la prévisualisation depuis sessionStorage
 */
function loadPreview() {
  try {
    // Récupérer les données depuis sessionStorage
    const pdfContentStr = sessionStorage.getItem('pdfContent');
    const productName = sessionStorage.getItem('productName');

    if (!pdfContentStr || !productName) {
      throw new Error('Aucune donnée trouvée. Veuillez générer une fiche depuis la page d\'accueil.');
    }

    const pdfContent = JSON.parse(pdfContentStr);
    console.log('📦 Données parsées depuis sessionStorage:', pdfContent);
    console.log('🌿 Caractéristiques dans sessionStorage:', pdfContent.caracteristiques);
    console.log('🌿 Type caractéristiques:', Array.isArray(pdfContent.caracteristiques) ? 'Array' : typeof pdfContent.caracteristiques);
    console.log('🌿 Nombre de caractéristiques:', pdfContent.caracteristiques?.length || 0);
    
    // Vérifier la structure des données
    if (!pdfContent.caracteristiques) {
      console.error('❌ PROBLÈME: Aucune caractéristique trouvée dans les données!');
      console.error('📋 Données complètes:', JSON.stringify(pdfContent, null, 2));
      
      // Essayer de récupérer les données de debug si disponibles
      const debugData = sessionStorage.getItem('debug_raw_data');
      if (debugData) {
        console.error('📋 Données brutes de debug:', JSON.parse(debugData));
      }
    } else if (!Array.isArray(pdfContent.caracteristiques)) {
      console.error('❌ PROBLÈME: caracteristiques n\'est pas un tableau!', typeof pdfContent.caracteristiques);
    } else if (pdfContent.caracteristiques.length === 0) {
      console.error('❌ PROBLÈME: Tableau de caractéristiques vide!');
    } else {
      // Vérifier que chaque caractéristique a une description
      pdfContent.caracteristiques.forEach((c, i) => {
        if (!c.description || c.description.trim() === '') {
          console.error(`❌ PROBLÈME: Caractéristique ${i} sans description:`, c);
        }
      });
    }
    
    // Stocker les données originales pour éviter de les recharger
    window.currentPdfContent = pdfContent;
    window.currentProductName = productName;

    // Ne pas utiliser automatiquement le badge du contenu PDF
    // Seulement utiliser le badge si l'utilisateur l'a explicitement sélectionné
    const storedBadgeName = sessionStorage.getItem('badgeName');
    const storedBadgeNames = sessionStorage.getItem('badgeNames');
    
    if (storedBadgeName || storedBadgeNames) {
      // Utiliser les badges stockés
      if (storedBadgeName) {
        window.currentPdfContent.badge = storedBadgeName;
      }
      if (storedBadgeNames) {
        try {
          const parsed = JSON.parse(storedBadgeNames);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.currentPdfContent.badges = parsed;
          }
        } catch (e) {}
      }
    } else {
      // Supprimer tous les badges du contenu PDF s'il n'y a pas de sélection explicite
      // pour éviter l'affichage automatique de badges comme "Circuit court"
      delete window.currentPdfContent.badge;
      delete window.currentPdfContent.badgeName;
      delete window.currentPdfContent.atout;
      delete window.currentPdfContent.atoutName;
      delete window.currentPdfContent.badgeSlug;
      delete window.currentPdfContent.badge_slug;
      delete window.currentPdfContent.badges; // Supprimer aussi le tableau de badges
    }

    // Générer le HTML avec les données modifiées (sans badges automatiques)
    const html = generateHTML(window.currentPdfContent);
    
    console.log('✅ HTML généré, longueur:', html.length);
    console.log('✅ Caractéristiques dans HTML:', html.includes('Caractéristiques'));

    // Afficher
    displayPreview(html, productName);

    // Injecter badges multiples stockés
    const storedBadges = getBadgeNamesArray();
    if (storedBadges.length > 0) {
      window.currentPdfContent.badges = storedBadges;
    }
    // Appliquer layouts stockés
    if (typeof BadgeManager !== 'undefined') {
      if (BadgeManager.syncLayoutInputsFromStored) {
        BadgeManager.syncLayoutInputsFromStored();
      }
      if (BadgeManager.applyLayouts) {
        BadgeManager.applyLayouts(pdfPreview);
      }
    }

  } catch (err) {
    console.error('❌ Erreur:', err);
    showError(err.message);
  }
}

/**
 * Récupère le nom du badge depuis le contenu
 */
function getBadgeNameFromContent() {
  return (
    window.currentPdfContent?.badge ||
    window.currentPdfContent?.badgeName ||
    window.currentPdfContent?.atout ||
    window.currentPdfContent?.atoutName ||
    window.currentPdfContent?.badgeSlug ||
    window.currentPdfContent?.badge_slug ||
    ''
  );
}

/**
 * Récupère le tableau des noms de badges
 */
function getBadgeNamesArray() {
  // Priorité : sélection stockée multiple
  const stored = sessionStorage.getItem('badgeNames');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  // Ne plus utiliser automatiquement le badge du contenu PDF
  // Seulement utiliser la valeur stockée explicitement par l'utilisateur
  const single = sessionStorage.getItem('badgeName');
  return single ? [single] : [];
}

window.loadPreview = loadPreview;
window.getBadgeNamesArray = getBadgeNamesArray; // Expose
window.getBadgeNameFromContent = getBadgeNameFromContent; // Expose

