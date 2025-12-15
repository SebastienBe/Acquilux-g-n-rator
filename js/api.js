// ========================================
// APPEL WEBHOOK N8N
// ========================================

/**
 * Appelle le webhook N8N pour générer la fiche produit
 * @param {string} productName - Nom du produit
 * @param {Function} onProgress - Callback pour mettre à jour le loader
 * @param {string} [badgeName] - Nom/slug du badge à utiliser
 * @returns {Promise<Object>} - Données de la fiche générée
 */
async function callN8nWebhook(productName, onProgress, badgeName) {
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
        productName: productName,
        badge: badgeName || undefined
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Erreur HTTP ${response.status}`);
    }

    // Essayer de récupérer le texte brut d'abord pour debug
    const responseText = await response.text();
    console.log('📄 Réponse brute (premiers 500 caractères):', responseText.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Erreur de parsing JSON:', e);
      throw new Error('Format de réponse invalide : JSON invalide');
    }
    
    const isArray = Array.isArray(data);
    const hasLength = isArray && data.length > 0;
    
    console.log('🔍 Format brut reçu de N8N:', {
      isArray: isArray,
      length: isArray ? data.length : 'N/A',
      keys: hasLength ? Object.keys(data[0]) : (data && typeof data === 'object' ? Object.keys(data) : []),
      firstItem: hasLength ? data[0] : null,
      rawType: typeof data,
      constructor: data?.constructor?.name
    });

    // N8N peut retourner différents formats selon l'environnement
    // Format 1: Tableau avec propriété 'json' (n8n standard)
    if (isArray && hasLength) {
      if (data[0].json) {
        console.log('📦 Format détecté: Tableau avec propriété json');
        data = data[0].json;
      } 
      // Format 2: Tableau direct d'objets (comme dans votre exemple)
      else if (data[0] && typeof data[0] === 'object' && (data[0].success !== undefined || data[0].pdfContent !== undefined)) {
        console.log('📦 Format détecté: Tableau direct d\'objets');
        data = data[0];
      }
      // Format 2b: Tableau avec un seul élément qui contient les données
      else if (data.length === 1 && data[0] && typeof data[0] === 'object') {
        console.log('📦 Format détecté: Tableau avec un seul élément');
        data = data[0];
      }
    }
    // Format 3: Objet direct (peut-être en production)
    else if (data && typeof data === 'object' && !isArray) {
      console.log('📦 Format détecté: Objet direct');
      // Si l'objet a une propriété json, l'extraire
      if (data.json) {
        data = data.json;
      }
      // Si l'objet a une propriété data qui contient les données
      if (data.data && typeof data.data === 'object') {
        console.log('📦 Format détecté: Objet avec propriété data');
        data = data.data;
      }
    }
    
    // Vérification finale : si on a toujours un tableau, prendre le premier élément
    if (Array.isArray(data) && data.length > 0) {
      console.log('📦 Format détecté: Tableau final, extraction du premier élément');
      data = data[0];
    }

    console.log('📥 Données finales extraites:', {
      success: data?.success,
      hasPdfContent: !!data?.pdfContent,
      hasCaracteristiques: !!data?.pdfContent?.caracteristiques,
      caracteristiquesCount: data?.pdfContent?.caracteristiques?.length || 0,
      dataKeys: data ? Object.keys(data) : [],
      fullData: data
    });
    
    // Dernière vérification : si on n'a pas pdfContent mais qu'on a un message de succès,
    // peut-être que les données sont dans une autre structure
    if (data && data.success && !data.pdfContent) {
      console.warn('⚠️ Données avec success mais sans pdfContent, recherche alternative...');
      
      // Chercher pdfContent dans les propriétés de l'objet
      const possibleKeys = ['data', 'result', 'response', 'payload', 'content', 'body'];
      for (const key of possibleKeys) {
        if (data[key] && typeof data[key] === 'object') {
          if (data[key].pdfContent) {
            console.log(`✅ Trouvé pdfContent dans data.${key}`);
            data = data[key];
            break;
          }
          // Chercher récursivement dans les sous-objets
          if (Array.isArray(data[key]) && data[key].length > 0) {
            const firstItem = data[key][0];
            if (firstItem && firstItem.pdfContent) {
              console.log(`✅ Trouvé pdfContent dans data.${key}[0]`);
              data = firstItem;
              break;
            }
          }
        }
      }
      
      // Si toujours pas trouvé, chercher dans toutes les valeurs de l'objet
      if (!data.pdfContent && data && typeof data === 'object') {
        console.warn('⚠️ Recherche approfondie dans toutes les propriétés...');
        for (const key in data) {
          if (data.hasOwnProperty(key) && data[key] && typeof data[key] === 'object') {
            if (data[key].pdfContent) {
              console.log(`✅ Trouvé pdfContent dans data.${key}`);
              data = data[key];
              break;
            }
            // Si c'est un tableau, chercher dans le premier élément
            if (Array.isArray(data[key]) && data[key].length > 0) {
              const firstItem = data[key][0];
              if (firstItem && firstItem.pdfContent) {
                console.log(`✅ Trouvé pdfContent dans data.${key}[0]`);
                data = firstItem;
                break;
              }
            }
          }
        }
      }
    }
    
    // Vérification finale : si on a toujours pas pdfContent, log détaillé
    if (data && !data.pdfContent) {
      console.error('❌ pdfContent introuvable dans la structure de données');
      console.error('📋 Structure complète reçue:', JSON.stringify(data, null, 2));
    }

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
      // Vérifier si c'est une erreur CORS
      if (error.message.includes('CORS') || error.message.includes('Access-Control')) {
        throw new Error('Erreur CORS : Le serveur N8N doit autoriser les requêtes depuis votre origine. Vérifiez la configuration CORS sur N8N (headers Access-Control-Allow-Origin).');
      }
      throw new Error('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
    }

    throw error;
  }
}

// ========================================
// RÉCUPÉRATION DE LA LISTE DES BADGES
// ========================================
async function fetchBadgeList() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    const response = await fetch(CONFIG.N8N_BADGE_LIST_URL, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    let data = await response.json();

    // n8n peut renvoyer différents formats : tableau direct, tableau avec json, ou objet
    if (Array.isArray(data) && data.length > 0 && data[0].json) {
      data = data.map(d => d.json);
    } else if (data && typeof data === 'object' && data.json) {
      data = data.json;
    }

    // Déplier les enveloppes éventuelles (success/data/badges/items/...)
    if (!Array.isArray(data) && data && typeof data === 'object') {
      // Cas courant : { success: true, data: { badges: [...] } }
      if (data.data && Array.isArray(data.data.badges)) {
        data = data.data.badges;
      } else {
        const candidates = [
          data.data,
          data.badges,
          data.items,
          data.results,
          data.payload,
          data.list
        ];
        const foundArray = candidates.find(Array.isArray);
        if (foundArray) {
          data = foundArray;
        } else {
          const firstArray = Object.values(data).find(Array.isArray);
          if (firstArray) {
            data = firstArray;
          }
        }
      }
    }

    if (!Array.isArray(data)) {
      console.warn('⚠️ Format inattendu pour la liste des badges, enveloppe dans un tableau:', data);
      data = [data];
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ Erreur dans fetchBadgeList:', error);
    return [];
  }
}

