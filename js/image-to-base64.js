// ========================================
// UTILITAIRE - Convertir image en base64
// ========================================
// Ce script peut être utilisé pour convertir une image en base64
// et l'inclure directement dans le HTML

async function convertImageFileToBase64(imagePath) {
  return new Promise((resolve, reject) => {
    // Cette fonction nécessite un serveur HTTP pour fonctionner
    // Pour file://, il faut utiliser un autre moyen
    
    // Solution alternative : utiliser fetch si disponible
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      fetch(imagePath)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    } else {
      // Pour file://, on ne peut pas utiliser fetch
      // Il faut que l'utilisateur utilise un serveur local
      reject(new Error('Impossible de charger l\'image avec file://. Utilisez un serveur local.'));
    }
  });
}

// Fonction pour précharger et convertir l'image au chargement de la page
async function preloadAndConvertImage(imgElement) {
  return new Promise((resolve) => {
    if (imgElement.complete && imgElement.naturalWidth > 0) {
      // Image déjà chargée, essayer de la convertir
      convertLoadedImageToBase64(imgElement).then(resolve).catch(() => resolve(null));
    } else {
      imgElement.onload = () => {
        convertLoadedImageToBase64(imgElement).then(resolve).catch(() => resolve(null));
      };
      imgElement.onerror = () => resolve(null);
    }
  });
}

function convertLoadedImageToBase64(img) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0);
      const dataURI = canvas.toDataURL('image/png');
      resolve(dataURI);
    } catch (err) {
      reject(err);
    }
  });
}


