// ========================================
// ÉLÉMENTS DOM
// ========================================
const form = document.getElementById('productForm');
const input = document.getElementById('productName');
const submitBtn = document.getElementById('submitBtn');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loaderText');
const errorDiv = document.getElementById('error');
const homeLogo = document.getElementById('homeLogo');

// ========================================
// INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkUrlParams();
  setHomeLogo();
});

function setupEventListeners() {
  // Soumission du formulaire
  form.addEventListener('submit', handleSubmit);

  // Exemples cliquables
  document.querySelectorAll('.example-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      input.value = tag.dataset.product;
      input.focus();
    });
  });

  // Effacer l'erreur quand on tape
  input.addEventListener('input', () => {
    hideError(errorDiv);
  });
}

// Vérifier si retour depuis preview.html
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('return') === 'true') {
    const product = params.get('product');
    if (product) {
      input.value = decodeURIComponent(product);
    }
  }
}

function setHomeLogo() {
  if (!homeLogo || !CONFIG || !CONFIG.N8N_BADGE_IMAGE_URL) return;
  const base = CONFIG.N8N_BADGE_IMAGE_URL;
  const cache = Date.now();
  homeLogo.src = `${base}?name=logo_O_orange&cb=${cache}`;
}

// ========================================
// SOUMISSION
// ========================================
async function handleSubmit(e) {
  e.preventDefault();
  
  const productName = input.value.trim();
  
  if (!productName) {
    showError(errorDiv, 'Veuillez entrer un nom de produit');
    return;
  }

  // Validation
  if (!validateProductName(productName)) {
    showError(errorDiv, 'Le nom du produit contient des caractères invalides');
    return;
  }

  await generateAndRedirect(productName);
}

// ========================================
// GÉNÉRATION ET REDIRECTION
// ========================================
async function generateAndRedirect(productName) {
  try {
    showLoader(loader, loaderText, 'Connexion au serveur...');
    disableForm(submitBtn, input);

    // Appel API
    const data = await callN8nWebhook(productName, (message) => {
      showLoader(loader, loaderText, message);
    });

    if (!data.success) {
      throw new Error(data.error || 'Erreur inconnue');
    }

    console.log('✅ Données reçues du serveur:', data);
    console.log('📋 Structure des données:', {
      hasSuccess: 'success' in data,
      hasPdfContent: 'pdfContent' in data,
      pdfContentType: typeof data.pdfContent,
      pdfContentKeys: data.pdfContent ? Object.keys(data.pdfContent) : []
    });
    console.log('📋 Contenu PDF:', data.pdfContent);
    console.log('🌿 Caractéristiques AVANT normalisation:', data.pdfContent?.caracteristiques);
    console.log('🌿 Type caractéristiques:', Array.isArray(data.pdfContent?.caracteristiques) ? 'Array' : typeof data.pdfContent?.caracteristiques);

    // Vérification finale avant stockage
    if (!data.pdfContent) {
      console.error('❌ pdfContent manquant dans les données:', data);
      console.error('📋 Structure complète reçue:', JSON.stringify(data, null, 2));
      throw new Error(`Format de réponse invalide : pdfContent manquant. N8N doit retourner un tableau avec pdfContent. Structure reçue: ${JSON.stringify(data).substring(0, 200)}`);
    }

    // NORMALISATION ET VALIDATION DES CARACTÉRISTIQUES
    let caracteristiques = data.pdfContent.caracteristiques;
    
    // Vérifier et normaliser les caractéristiques
    if (!caracteristiques) {
      console.warn('⚠️ caracteristiques est undefined ou null');
      caracteristiques = [];
    } else if (!Array.isArray(caracteristiques)) {
      console.warn('⚠️ caracteristiques n\'est pas un tableau:', typeof caracteristiques, caracteristiques);
      // Essayer de convertir en tableau
      if (typeof caracteristiques === 'object') {
        caracteristiques = Object.values(caracteristiques);
        console.log('✅ Converti en tableau:', caracteristiques);
      } else {
        caracteristiques = [];
      }
    }
    
    // Filtrer les caractéristiques invalides et s'assurer qu'elles ont des descriptions
    const caracteristiquesValides = caracteristiques.filter(c => {
      if (!c || typeof c !== 'object') {
        console.warn('⚠️ Caractéristique invalide (pas un objet):', c);
        return false;
      }
      const hasDescription = c.description && typeof c.description === 'string' && c.description.trim() !== '';
      if (!hasDescription) {
        console.warn('⚠️ Caractéristique sans description valide:', c);
      }
      return hasDescription;
    });
    
    console.log(`🌿 Caractéristiques validées: ${caracteristiquesValides.length} sur ${caracteristiques.length}`);
    console.log('🌿 Caractéristiques APRÈS normalisation:', caracteristiquesValides);
    
    // Si aucune caractéristique valide, utiliser les valeurs par défaut
    if (caracteristiquesValides.length === 0 && caracteristiques.length > 0) {
      console.error('❌ PROBLÈME: Toutes les caractéristiques sont invalides!');
      console.error('📋 Caractéristiques brutes:', JSON.stringify(caracteristiques, null, 2));
      // Sauvegarder les données brutes pour diagnostic
      sessionStorage.setItem('debug_raw_data', JSON.stringify(data));
    }
    
    // Créer une copie normalisée des données
    const pdfContentNormalized = {
      ...data.pdfContent,
      caracteristiques: caracteristiquesValides.length > 0 ? caracteristiquesValides : data.pdfContent.caracteristiques || []
    };
    
    console.log('📋 pdfContent normalisé:', pdfContentNormalized);
    console.log('🌿 Caractéristiques dans pdfContent normalisé:', pdfContentNormalized.caracteristiques);

    showLoader(loader, loaderText, '✅ Fiche générée ! Redirection...');

    // Stocker les données normalisées dans sessionStorage
    const jsonToStore = JSON.stringify(pdfContentNormalized);
    sessionStorage.setItem('pdfContent', jsonToStore);
    sessionStorage.setItem('productName', productName);
    
    // Vérifier que les données sont bien stockées
    const stored = sessionStorage.getItem('pdfContent');
    if (stored) {
      const storedParsed = JSON.parse(stored);
      console.log('💾 Vérification stockage - Caractéristiques:', storedParsed.caracteristiques);
      console.log('💾 Nombre de caractéristiques stockées:', storedParsed.caracteristiques?.length || 0);
    } else {
      console.error('❌ ERREUR: Impossible de stocker dans sessionStorage!');
    }

    // Redirection vers preview.html
    setTimeout(() => {
      window.location.href = 'preview.html';
    }, 500);

  } catch (error) {
    console.error('❌ Erreur:', error);
    showError(errorDiv, error.message);
    enableForm(submitBtn, input);
    hideLoader(loader);
  }
}

