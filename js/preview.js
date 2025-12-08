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
            <p><em>💡 Astuce :</em> ${astuce}</p>
          </div>
        `;
      }).join('')
    : '<p>Aucune recette disponible</p>';

  // Retour avec footer Otera
  const finalHtml = `
    <h1>${escapeHtml(titre || 'Produit')}</h1>
    <p class="slogan">${escapeHtml(slogan || 'Un trésor de saveurs à découvrir')}</p>
    
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
// AFFICHAGE
// ========================================
function displayPreview(html, productName) {
  loading.style.display = 'none';
  pdfPreview.innerHTML = html;
  pdfPreview.style.display = 'flex';
  downloadBtn.style.display = 'inline-flex';
  pageTitle.textContent = `Fiche ${productName}`;
  
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

    // Capture avec html2canvas - Dimensions fixes A5 pour cohérence
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#FEFCF9', // Fond beige Otera
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
          clonedElement.style.maxHeight = 'none';
          clonedElement.style.minHeight = a5Height + 'px';
          clonedElement.style.padding = '28px 24px';
          clonedElement.style.overflow = 'visible';
          clonedElement.style.margin = '0 auto';
          clonedElement.style.position = 'relative';
          clonedElement.style.boxSizing = 'border-box';
          
          // S'assurer que le contenu est centré et bien aligné
          clonedElement.style.display = 'flex';
          clonedElement.style.flexDirection = 'column';
          clonedElement.style.alignItems = 'stretch';
          clonedElement.style.justifyContent = 'flex-start';
          
          // Centrer tous les éléments enfants qui doivent être centrés
          const h1 = clonedElement.querySelector('h1');
          if (h1) {
            h1.style.textAlign = 'center';
            h1.style.marginLeft = 'auto';
            h1.style.marginRight = 'auto';
          }
          
          const slogan = clonedElement.querySelector('.slogan');
          if (slogan) {
            slogan.style.textAlign = 'center';
            slogan.style.marginLeft = 'auto';
            slogan.style.marginRight = 'auto';
          }
          
          const footer = clonedElement.querySelector('.otera-footer');
          if (footer) {
            footer.style.textAlign = 'center';
            footer.style.marginLeft = 'auto';
            footer.style.marginRight = 'auto';
          }
          
          const clonedHtml = clonedElement.innerHTML;
          console.log('📋 Clone HTML - Caractéristiques présentes:', clonedHtml.includes('Caractéristiques'));
          console.log('📋 Clone - Largeur forcée:', clonedElement.style.width);
        }
      }
    });

    // Conversion en PDF
    const imgData = canvas.toDataURL('image/png', 0.95);
    const { jsPDF } = window.jspdf;

    // Format A5 (148 x 210 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5',
      compress: true
    });

    // Dimensions A5 en mm (format standard)
    const pdfWidth = 148;
    const pdfHeight = 210;
    
    // Calculer les dimensions réelles de l'image capturée
    // Le canvas a une largeur = a5Width * scale et hauteur = elementHeight * scale
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

