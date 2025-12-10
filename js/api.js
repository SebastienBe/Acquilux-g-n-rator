// ========================================
// APPEL WEBHOOK N8N
// ========================================

/**
 * Appelle le webhook N8N pour générer la fiche produit
 * @param {string} productName - Nom du produit
 * @param {Function} onProgress - Callback pour mettre à jour le loader
 * @returns {Promise<Object>} - Données de la fiche générée
 */
async function callN8nWebhook(productName, onProgress) {
  if (onProgress) {
    onProgress('Génération par l\'IA...');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productName: productName
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Erreur HTTP ${response.status}`);
    }

    let data = await response.json();
    
    console.log('🔍 Format brut reçu de N8N:', {
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : 'N/A',
      keys: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : Object.keys(data),
      firstItem: Array.isArray(data) && data.length > 0 ? data[0] : null
    });

    // N8N peut retourner différents formats selon l'environnement
    // Format 1: Tableau avec propriété 'json' (n8n standard)
    if (Array.isArray(data) && data.length > 0) {
      if (data[0].json) {
        console.log('📦 Format détecté: Tableau avec propriété json');
        data = data[0].json;
      } 
      // Format 2: Tableau direct d'objets (comme dans votre exemple)
      else if (data[0].success !== undefined || data[0].pdfContent !== undefined) {
        console.log('📦 Format détecté: Tableau direct d\'objets');
        data = data[0];
      }
    }
    // Format 3: Objet direct (peut-être en production)
    else if (data && typeof data === 'object' && !Array.isArray(data)) {
      console.log('📦 Format détecté: Objet direct');
      // Si l'objet a une propriété json, l'extraire
      if (data.json) {
        data = data.json;
      }
    }

    console.log('📥 Données finales extraites:', {
      success: data?.success,
      hasPdfContent: !!data?.pdfContent,
      hasCaracteristiques: !!data?.pdfContent?.caracteristiques,
      caracteristiquesCount: data?.pdfContent?.caracteristiques?.length || 0
    });

    if (onProgress) {
      onProgress('Préparation de l\'aperçu...');
    }

    return data;

  } catch (error) {
    clearTimeout(timeoutId);

    console.error('❌ Erreur dans callN8nWebhook:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      url: CONFIG.N8N_WEBHOOK_URL
    });

    if (error.name === 'AbortError') {
      throw new Error('Timeout : le serveur ne répond pas');
    }

    // Améliorer le message d'erreur pour la production
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
    }

    throw error;
  }
}

