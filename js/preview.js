// ========================================
// ÉLÉMENTS DOM
// ========================================
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const pdfPreview = document.getElementById('pdfPreview');
const downloadBtn = document.getElementById('downloadBtn');
const pageTitle = document.getElementById('pageTitle');
const badgeToggle = document.getElementById('badgeToggle');

let currentProductName = '';
let currentPdfContent = null; // Stocker les données originales pour éviter de les recharger

// ========================================
// INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  loadPreview();
  setupEventListeners();
});

function setupEventListeners() {
  downloadBtn.addEventListener('click', downloadPDF);
  
  // Gérer le toggle du badge
  if (badgeToggle) {
    // Charger l'état sauvegardé
    const savedState = sessionStorage.getItem('badgeVisible');
    if (savedState !== null) {
      badgeToggle.checked = savedState === 'true';
      updateBadgeVisibility();
    }
    
    badgeToggle.addEventListener('change', () => {
      sessionStorage.setItem('badgeVisible', badgeToggle.checked);
      updateBadgeVisibility();
    });
  }
}

function updateBadgeVisibility() {
  if (pdfPreview) {
    const badgeElement = pdfPreview.querySelector('.circuit-court-badge');
    if (badgeElement) {
      badgeElement.style.display = badgeToggle.checked ? 'block' : 'none';
    }
    // Garder aussi la classe pour compatibilité
    if (badgeToggle.checked) {
      pdfPreview.classList.remove('hide-badge');
    } else {
      pdfPreview.classList.add('hide-badge');
    }
  }
}

// ========================================
// CHARGEMENT DE LA PRÉVISUALISATION
// ========================================
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
    currentPdfContent = pdfContent;
    currentProductName = productName;

    // Générer le HTML
    const html = generateHTML(pdfContent);
    
    console.log('✅ HTML généré, longueur:', html.length);
    console.log('✅ Caractéristiques dans HTML:', html.includes('Caractéristiques'));

    // Afficher
    displayPreview(html, productName);

  } catch (err) {
    console.error('❌ Erreur:', err);
    showError(err.message);
  }
}

// ========================================
// UTILITAIRES
// ========================================
/**
 * Échappe les caractères HTML pour éviter les injections
 * @param {string} text - Texte à échapper
 * @returns {string} - Texte échappé
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


// ========================================
// GÉNÉRATION DU HTML
// ========================================
function generateHTML(pdfContent) {
  console.log('📄 Génération HTML - Données reçues:', pdfContent);
  
  // Vérification de la structure des données
  if (!pdfContent || typeof pdfContent !== 'object') {
    console.error('❌ pdfContent invalide:', pdfContent);
    throw new Error('Données invalides pour la génération HTML');
  }
  
  const { titre, slogan, caracteristiques, consommation, recettes } = pdfContent;

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
        const type = escapeHtml(c.type || c.nom || 'Caractéristique');
        const description = escapeHtml(c.description || c.value || c.text || '');
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
    ? consoArray.map(s => `<li>${escapeHtml(s)}</li>`).join('')
    : '<li>Aucune suggestion disponible</li>';

  // Recettes
  const recettesArray = Array.isArray(recettes) ? recettes : [];
  const recettesHtml = recettesArray.length > 0
    ? recettesArray.map(r => {
        const emoji = r.type === 'Sucrée' ? '🍰' : '🍽';
        const nom = escapeHtml(r.nom || 'Recette');
        const ingredients = escapeHtml(r.ingredients || '');
        const astuce = escapeHtml(r.astuce || '');
        return `
          <div class="recipe">
            <strong>${emoji} Recette ${escapeHtml(r.type || '')} : ${nom}</strong>
            <p><strong>Ingrédients :</strong> ${ingredients}</p>
            <em>💡 Astuce : ${astuce}</em>
          </div>
        `;
      }).join('')
    : '<p>Aucune recette disponible</p>';

  // Retour avec footer Otera - Identité visuelle
  const finalHtml = `
    <div class="header-orange-band"></div>
    <img src="${CONFIG.N8N_BADGE_IMAGE_URL}" alt="Circuit court" class="circuit-court-badge">
    <div class="header-content">
      <h1>${escapeHtml(titre || 'Produit')}</h1>
      <p class="slogan">${escapeHtml(slogan || 'Un trésor de saveurs à découvrir')}</p>
    </div>
    
    <h2><span class="emoji">🌿</span> Caractéristiques</h2>
    <ul>${caracHtml}</ul>
    
    <h2><span class="emoji">🍴</span> 3 Façons de le Consommer</h2>
    <ul>${consoHtml}</ul>
    
    <h2><span class="emoji">👨‍🍳</span> Idées Recettes</h2>
    ${recettesHtml}
    
    <div class="otera-footer">
      <div class="otera-logo">otera</div>
      <div class="otera-tagline">LE MARCHÉ DU FRAIS</div>
    </div>
  `;
  
  console.log('✅ HTML final généré, longueur totale:', finalHtml.length);
  console.log('✅ Vérification finale - Caractéristiques présentes:', finalHtml.includes('Caractéristiques') && finalHtml.includes('</ul>'));
  
  return finalHtml;
}

// ========================================
// UTILITAIRES - Convertir image en base64 au chargement
// ========================================
async function convertImageToBase64OnLoad(img) {
  return new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) {
      // Image déjà chargée
      convertImageToBase64(img).then(resolve);
    } else {
      img.onload = () => convertImageToBase64(img).then(resolve);
      img.onerror = () => resolve(null); // Si l'image ne charge pas, retourner null
    }
  });
}

function convertImageToBase64(img) {
  return new Promise((resolve) => {
    // Si l'image est déjà en base64, la retourner directement
    if (img.src && img.src.startsWith('data:')) {
      resolve(img.src);
      return;
    }

    // Pour les images file://, essayer d'utiliser XMLHttpRequest avec blob
    if (img.src && img.src.startsWith('file://')) {
      // Malheureusement, XMLHttpRequest ne fonctionne pas avec file://
      // Il faut utiliser un serveur local
      console.warn('⚠️ Impossible de convertir une image file:// en base64. Utilisez un serveur local.');
      resolve(null);
      return;
    }

    // Pour les autres images, essayer avec canvas
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0);
      const dataURI = canvas.toDataURL('image/png');
      resolve(dataURI);
    } catch (err) {
      console.warn('⚠️ Erreur conversion base64:', err);
      resolve(null);
    }
  });
}

// ========================================
// AFFICHAGE
// ========================================
async function displayPreview(html, productName) {
  loading.style.display = 'none';
  pdfPreview.innerHTML = html;
  pdfPreview.style.display = 'flex';
  downloadBtn.style.display = 'inline-flex';
  pageTitle.textContent = `Fiche ${productName}`;
  
  // Convertir l'image en base64 dès le chargement pour éviter les problèmes CORS
  const badgeImg = pdfPreview.querySelector('.circuit-court-badge');
  if (badgeImg && badgeImg.tagName === 'IMG') {
    // Attendre que l'image soit chargée
    await new Promise((resolve) => {
      if (badgeImg.complete && badgeImg.naturalWidth > 0) {
        resolve();
      } else {
        badgeImg.onload = resolve;
        badgeImg.onerror = resolve; // Continuer même si l'image ne charge pas
        // Timeout de sécurité
        setTimeout(resolve, 2000);
      }
    });
    
    // Essayer de convertir en base64
    try {
      const base64 = await convertImageToBase64OnLoad(badgeImg);
      if (base64) {
        badgeImg.src = base64;
        console.log('✅ Image badge convertie en base64 au chargement');
        // Forcer le rechargement de l'image
        badgeImg.style.display = 'none';
        badgeImg.offsetHeight; // Force reflow
        badgeImg.style.display = '';
      } else {
        console.warn('⚠️ Impossible de convertir l\'image. L\'image peut ne pas s\'afficher dans le PDF.');
        console.warn('💡 Solution: Utilisez un serveur local ou convertissez l\'image en base64 manuellement.');
      }
    } catch (err) {
      console.warn('⚠️ Erreur lors de la conversion de l\'image:', err);
    }
  }
  
  // Appliquer l'état du badge après l'affichage
  setTimeout(() => {
    updateBadgeVisibility();
  }, 100);
}

function showError(message) {
  loading.style.display = 'none';
  error.style.display = 'block';
  errorMessage.textContent = message;
}

// ========================================
// UTILITAIRES - Détection mobile
// ========================================
function isMobile() {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ========================================
// UTILITAIRES - Conversion image en data URI
// ========================================
async function convertImageToDataURI(img) {
  // Si l'image est déjà un data URI, on la retourne directement
  if (img.src && img.src.startsWith('data:')) {
    return img.src;
  }

  try {
    // Pour les images locales, utiliser fetch pour éviter le problème de "tainted canvas"
    const response = await fetch(img.src);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier image'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    // Si fetch échoue (par exemple pour les images cross-origin), essayer avec canvas
    console.warn('⚠️ Fetch échoué, tentative avec canvas:', err);
    return new Promise((resolve, reject) => {
      // Créer une nouvelle image pour éviter le problème de tainted canvas
      const newImg = new Image();
      newImg.crossOrigin = 'anonymous'; // Essayer d'activer CORS
      
      newImg.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = newImg.width;
          canvas.height = newImg.height;
          ctx.drawImage(newImg, 0, 0);
          const dataURI = canvas.toDataURL('image/png');
          resolve(dataURI);
        } catch (canvasErr) {
          // Si le canvas échoue aussi, retourner l'URL originale
          console.warn('⚠️ Canvas échoué, utilisation de l\'URL originale:', canvasErr);
          resolve(img.src);
        }
      };
      
      newImg.onerror = () => {
        console.warn('⚠️ Chargement image échoué, utilisation de l\'URL originale');
        resolve(img.src); // Retourner l'URL originale en dernier recours
      };
      
      newImg.src = img.src;
    });
  }
}

// ========================================
// UTILITAIRES - Préparer les images pour html2canvas
// ========================================
async function prepareImagesForCanvas(element) {
  const images = element.querySelectorAll('img');
  const imagePromises = [];
  
  for (const img of images) {
    if (img.src && !img.src.startsWith('data:')) {
      imagePromises.push(
        convertImageToDataURI(img)
          .then(dataURI => {
            img.src = dataURI;
            console.log('✅ Image convertie en data URI:', img.alt || 'sans alt');
          })
          .catch(err => {
            console.error('❌ Erreur conversion image:', err);
          })
      );
    }
  }
  
  // Attendre que toutes les images soient converties
  await Promise.all(imagePromises);
  
  // Attendre un peu pour que les images soient bien chargées dans le DOM
  await new Promise(resolve => setTimeout(resolve, 100));
}

// ========================================
// TÉLÉCHARGEMENT PDF
// ========================================
async function downloadPDF() {
  try {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span>⏳</span><span>Génération du PDF...</span>';

    // S'assurer que l'état du badge est appliqué avant capture
    updateBadgeVisibility();

    // Vérifier que les données sont toujours disponibles
    if (!currentPdfContent) {
      // Essayer de recharger depuis sessionStorage
      const pdfContentStr = sessionStorage.getItem('pdfContent');
      if (pdfContentStr) {
        currentPdfContent = JSON.parse(pdfContentStr);
        console.log('🔄 Données rechargées depuis sessionStorage pour PDF');
      } else {
        throw new Error('Données perdues. Veuillez régénérer la fiche.');
      }
    }

    // Vérifier que le contenu HTML est correct dans le DOM
    const element = document.getElementById('pdfPreview');
    const htmlContent = element.innerHTML;
    
    const mobile = isMobile();
    console.log('📱 Mode mobile détecté:', mobile);
    
    console.log('📄 Vérification avant génération PDF:');
    console.log('- Élément trouvé:', !!element);
    console.log('- HTML contient "Caractéristiques":', htmlContent.includes('Caractéristiques'));
    console.log('- Nombre de <li> dans caractéristiques:', (htmlContent.match(/<li><strong>.*?<\/strong> : .*?<\/li>/g) || []).length);
    console.log('- Données originales disponibles:', !!currentPdfContent);
    console.log('- Caractéristiques dans données:', currentPdfContent?.caracteristiques?.length || 0);

    // Si les caractéristiques ne sont pas dans le HTML, régénérer le HTML
    if (!htmlContent.includes('Caractéristiques') || (htmlContent.match(/<li><strong>.*?<\/strong> : .*?<\/li>/g) || []).length === 0) {
      console.warn('⚠️ Caractéristiques manquantes dans le HTML, régénération...');
      const html = generateHTML(currentPdfContent);
      element.innerHTML = html;
      console.log('✅ HTML régénéré');
    }
    
    // Dimensions A5 fixes pour garantir la cohérence
    const a5Width = 559;   // px (148mm à 96 DPI)
    const a5Height = 794;  // px (210mm à 96 DPI)
    
    // Sur mobile, on force les dimensions A5 pour la capture
    // Sur desktop, on utilise les dimensions réelles mais limitées à A5
    const elementWidth = mobile ? a5Width : Math.min(element.scrollWidth || a5Width, a5Width);
    const elementHeight = element.scrollHeight || a5Height;
    
    // Scale adapté selon la plateforme (limité pour la perf mobile)
    const scale = mobile ? 2 : 3;
    
    console.log('📐 Dimensions:', {
      mobile,
      elementWidth,
      elementHeight,
      scale,
      a5Width,
      a5Height,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight
    });

    // Vérifier si l'image badge nécessite une conversion base64
    // Si l'image est en HTTP/HTTPS, html2canvas peut la charger directement avec useCORS: true
    // Si l'image est locale (file://), on doit la convertir en base64
    const badgeImg = element.querySelector('.circuit-court-badge');
    if (badgeImg && badgeImg.tagName === 'IMG') {
      const imgSrc = badgeImg.src || '';
      if (imgSrc.startsWith('file://') || (imgSrc.startsWith('/') && !imgSrc.startsWith('http'))) {
        // Image locale, conversion nécessaire
        console.log('🖼️ Image locale détectée, conversion en base64...');
        try {
          const base64 = await convertImageToBase64OnLoad(badgeImg);
          if (base64) {
            badgeImg.src = base64;
            console.log('✅ Image badge convertie en base64');
          } else {
            console.warn('⚠️ Impossible de convertir l\'image locale en base64');
          }
        } catch (err) {
          console.warn('⚠️ Erreur lors de la conversion:', err);
        }
      } else if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
        // Image distante HTTP/HTTPS, html2canvas peut la charger directement
        console.log('✅ Image badge distante (HTTP/HTTPS), pas de conversion nécessaire');
      } else if (imgSrc.startsWith('data:')) {
        // Déjà en base64
        console.log('✅ Image badge déjà en base64');
      }
    }

    // Capture avec html2canvas - Dimensions fixes A5 pour cohérence
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#F6E2BE', // Fond beige Otera identité
      width: a5Width,  // Toujours 559px pour A5
      height: elementHeight, // Hauteur dynamique selon le contenu
      windowWidth: a5Width,
      windowHeight: elementHeight,
      x: 0,
      y: 0,
      onclone: (clonedDoc) => {
        // Forcer des dimensions A5 exactes dans le clone pour cohérence
        const clonedElement = clonedDoc.getElementById('pdfPreview');
        if (clonedElement) {
          // Forcer exactement les dimensions A5 (559px de large)
          clonedElement.style.width = a5Width + 'px';
          clonedElement.style.height = 'auto';
          clonedElement.style.maxWidth = a5Width + 'px';
          clonedElement.style.minWidth = a5Width + 'px';
          clonedElement.style.maxHeight = a5Height + 'px'; /* Limiter à la hauteur A5 */
          clonedElement.style.minHeight = a5Height + 'px';
          clonedElement.style.height = 'auto';
          clonedElement.style.padding = '0'; // Pas de padding, géré par les marges internes
          clonedElement.style.overflow = 'hidden'; // Pour les bords arrondis
          clonedElement.style.margin = '0 auto';
          clonedElement.style.position = 'relative';
          clonedElement.style.boxSizing = 'border-box';
          clonedElement.style.borderRadius = '0'; // Pas d'arrondis pour le PDF
          clonedElement.style.background = '#F6E2BE'; // Fond beige
          
          // S'assurer que le contenu est bien aligné
          clonedElement.style.display = 'flex';
          clonedElement.style.flexDirection = 'column';
          clonedElement.style.alignItems = 'stretch';
          clonedElement.style.justifyContent = 'flex-start';
          
          // Supprimer les arrondis de la bande orange pour le PDF
          const headerBand = clonedElement.querySelector('.header-orange-band');
          if (headerBand) {
            headerBand.style.borderRadius = '0';
            headerBand.style.borderTopLeftRadius = '0';
            headerBand.style.borderTopRightRadius = '0';
          }
          
          // S'assurer que le header-content est bien positionné
          const headerContent = clonedElement.querySelector('.header-content');
          if (headerContent) {
            headerContent.style.position = 'relative';
            headerContent.style.zIndex = '10';
            headerContent.style.padding = '16px 20px';
            headerContent.style.minHeight = '90px';
            headerContent.style.display = 'flex';
            headerContent.style.flexDirection = 'column';
            headerContent.style.justifyContent = 'center';
          }
          
          // S'assurer que le badge (image) est bien positionné en bas à gauche
          const badge = clonedElement.querySelector('.circuit-court-badge');
          if (badge && badge.tagName === 'IMG') {
            // Si l'image n'est pas encore en data URI dans le clone, essayer de la convertir
            if (badge.src && !badge.src.startsWith('data:')) {
              // Dans le clone, on ne peut pas convertir directement, mais on peut copier le src de l'original
              const originalBadge = element.querySelector('.circuit-court-badge');
              if (originalBadge && originalBadge.src && originalBadge.src.startsWith('data:')) {
                badge.src = originalBadge.src;
              }
            }
            badge.style.position = 'absolute';
            badge.style.bottom = '0';
            badge.style.left = '0';
            badge.style.margin = '0 0 0 20px'; /* Margin-left pour ne pas coller au bord */
            badge.style.padding = '0';
            badge.style.height = '80px'; /* Image agrandie */
            badge.style.maxWidth = '200px'; /* Largeur maximale augmentée */
            badge.style.objectFit = 'contain';
            badge.style.zIndex = '100';
          }
          
          // S'assurer que le h1 reste centré dans la bande orange
          const h1 = clonedElement.querySelector('.header-content h1');
          if (h1) {
            h1.style.textAlign = 'center';
            h1.style.margin = '0 0 4px 0';
            h1.style.padding = '0';
            h1.style.color = 'white';
          }
          
          // S'assurer que le slogan reste centré dans la bande orange
          const slogan = clonedElement.querySelector('.header-content .slogan');
          if (slogan) {
            slogan.style.textAlign = 'center';
            slogan.style.margin = '0';
            slogan.style.padding = '0';
            slogan.style.color = 'white';
          }
          
          // Footer centré - S'assurer qu'il est visible
          const footer = clonedElement.querySelector('.otera-footer');
          if (footer) {
            footer.style.textAlign = 'center';
            footer.style.marginTop = 'auto';
            footer.style.flexShrink = '0';
            footer.style.minHeight = '50px';
            footer.style.padding = '12px 20px';
          }
          
          const clonedHtml = clonedElement.innerHTML;
          console.log('📋 Clone HTML - Caractéristiques présentes:', clonedHtml.includes('Caractéristiques'));
          console.log('📋 Clone - Largeur forcée:', clonedElement.style.width);
          console.log('📋 Clone - Dimensions A5:', a5Width + 'x' + elementHeight);
        }
      }
    });

    // Conversion en PDF
    const imgData = canvas.toDataURL('image/png', 0.95);
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5',
      compress: true
    });

    const pdfWidth = 148;
    const pdfHeight = 210;
    
    const actualWidth = canvas.width / scale;
    const actualHeight = canvas.height / scale;
    
    // Conversion px -> mm (96 DPI standard)
    const pxToMm = 25.4 / 96;
    const imgWidthMm = actualWidth * pxToMm;
    const imgHeightMm = actualHeight * pxToMm;
    
    // L'image doit faire exactement 148mm de large (A5)
    // Calculer le ratio pour adapter la hauteur proportionnellement
    const ratio = pdfWidth / imgWidthMm;
    const renderWidth = pdfWidth;
    const renderHeight = imgHeightMm * ratio;
    
    // Centrage horizontal : toujours 0 car on remplit toute la largeur A5
    const offsetX = 0;
    
    // Centrage vertical : 
    // - Si le contenu est plus petit que A5, centrer verticalement
    // - Si le contenu dépasse A5, commencer en haut (offsetY = 0)
    let offsetY = 0;
    if (renderHeight < pdfHeight) {
      offsetY = (pdfHeight - renderHeight) / 2;
    }
    
    console.log('📐 Dimensions PDF:', {
      mobile,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      scale,
      actualWidth: actualWidth.toFixed(2),
      actualHeight: actualHeight.toFixed(2),
      imgWidthMm: imgWidthMm.toFixed(2),
      imgHeightMm: imgHeightMm.toFixed(2),
      renderWidth: renderWidth.toFixed(2),
      renderHeight: renderHeight.toFixed(2),
      offsetX: offsetX.toFixed(2),
      offsetY: offsetY.toFixed(2),
      ratio: ratio.toFixed(3)
    });

    // Ajouter l'image au PDF avec centrage optimal
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight, '', 'FAST');

    // Téléchargement
    const filename = `Fiche_${currentProductName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    pdf.save(filename);

    // Réinitialiser le bouton
    setTimeout(() => {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<span>⬇️</span><span>Télécharger le PDF</span>';
    }, 1000);

  } catch (err) {
    console.error('❌ Erreur PDF:', err);
    alert('❌ Erreur lors de la génération du PDF: ' + err.message);
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = '<span>⬇️</span><span>Télécharger le PDF</span>';
  }
}

