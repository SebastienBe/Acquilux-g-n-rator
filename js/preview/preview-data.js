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

    // Utiliser les badges stockés dans sessionStorage si disponibles (sélection utilisateur)
    // Sinon, les badges du serveur seront utilisés par generateHTML()
    const storedBadgeName = sessionStorage.getItem('badgeName');
    const storedBadgeNames = sessionStorage.getItem('badgeNames');
    
    if (storedBadgeName || storedBadgeNames) {
      // Utiliser les badges stockés (priorité sur les badges du serveur)
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
    }
    // Sinon, les badges du serveur (pdfContent.badge, pdfContent.badges, etc.) seront utilisés automatiquement par generateHTML()

    // Générer le HTML avec les données (badges du serveur si pas de sélection utilisateur)
    const html = generateHTML(window.currentPdfContent);
    

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

