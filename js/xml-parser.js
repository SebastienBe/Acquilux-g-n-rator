// ========================================
// PARSER UNIVERSEL - Gère Markdown ET XML
// Version corrigée pour N8N
// ========================================

/**
 * Extrait le contenu textuel entre les balises ouvrantes et fermantes
 * @param {string} xml - Le XML à parser
 * @param {string} tagName - Le nom de la balise
 * @returns {string} - Le contenu textuel
 */
function extractTagContent(xml, tagName) {
  // Regex pour capturer le contenu entre les balises (gère les attributs)
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Extrait la valeur d'un attribut dans une balise
 * @param {string} element - L'élément XML
 * @param {string} attrName - Le nom de l'attribut
 * @returns {string} - La valeur de l'attribut
 */
function extractAttribute(element, attrName) {
  const regex = new RegExp(`${attrName}="([^"]+)"`, 'i');
  const match = element.match(regex);
  return match ? match[1] : '';
}

/**
 * Extrait toutes les occurrences d'une balise avec son contenu
 * @param {string} xml - Le XML à parser
 * @param {string} tagName - Le nom de la balise
 * @returns {Array<string>} - Tableau des balises complètes
 */
function extractAllTags(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'gi');
  const matches = [];
  let match;
  
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[0]); // Retourne la balise complète
  }
  
  return matches;
}

/**
 * Détecte le format de la réponse (XML ou Markdown)
 * @param {string} text - Le texte à analyser
 * @returns {string} - 'XML' ou 'MARKDOWN'
 */
function detectFormat(text) {
  if (text.includes('<fiche>') || text.includes('<titre>')) {
    return 'XML';
  }
  return 'MARKDOWN';
}

/**
 * Parse le XML de la fiche produit
 * @param {string} xml - Le XML à parser
 * @returns {Object} - Objet avec titre, slogan, caractéristiques, consommation, recettes
 */
function parseXML(xml) {
  // Nettoyer le XML
  let cleanXml = xml.replace(/```xml/gi, '').replace(/```/g, '').trim();
  if (!cleanXml.startsWith('<fiche>')) {
    const ficheStart = cleanXml.indexOf('<fiche>');
    if (ficheStart !== -1) {
      cleanXml = cleanXml.substring(ficheStart);
    }
  }

  // Extraction du titre
  const titre = extractTagContent(cleanXml, 'titre');

  // Extraction du slogan
  const slogan = extractTagContent(cleanXml, 'slogan');

  // Extraction des caractéristiques
  const caracteristiquesXml = extractTagContent(cleanXml, 'caracteristiques');
  const caracteristiquesTags = extractAllTags(caracteristiquesXml, 'caracteristique');
  
  const caracteristiques = caracteristiquesTags.map(tag => {
    // Extraire le type depuis l'attribut
    const type = extractAttribute(tag, 'type') || 'Atout';
    
    // CORRECTION : Extraire le contenu textuel directement entre les balises
    // Au lieu de chercher une sous-balise, on extrait le texte entre <caracteristique...> et </caracteristique>
    const contentMatch = tag.match(/<caracteristique[^>]*>([\s\S]*?)<\/caracteristique>/i);
    const description = contentMatch ? contentMatch[1].trim() : '';
    
    return {
      type: type,
      description: description
    };
  });

  // Extraction de la consommation
  const consommationXml = extractTagContent(cleanXml, 'consommation');
  const suggestionsTags = extractAllTags(consommationXml, 'suggestion');
  
  const consommation = suggestionsTags.map(tag => {
    const contentMatch = tag.match(/<suggestion[^>]*>([\s\S]*?)<\/suggestion>/i);
    return contentMatch ? contentMatch[1].trim() : '';
  });

  // Extraction des recettes
  const recettesXml = extractTagContent(cleanXml, 'recettes');
  const recettesTags = extractAllTags(recettesXml, 'recette');
  
  const recettes = recettesTags.map(tag => {
    const type = extractAttribute(tag, 'type') || 'Sucrée';
    const nom = extractTagContent(tag, 'nom');
    const ingredients = extractTagContent(tag, 'ingredients');
    const astuce = extractTagContent(tag, 'astuce');
    
    return {
      type: type,
      nom: nom,
      ingredients: ingredients,
      astuce: astuce
    };
  });

  return { titre, slogan, caracteristiques, consommation, recettes };
}

/**
 * Parse le format Markdown (format alternatif)
 * @param {string} text - Le texte Markdown
 * @returns {Object} - Objet avec titre, slogan, caractéristiques, consommation, recettes
 */
function parseMarkdown(text) {
  // Extraction du titre
  const titreMatch = text.match(/\*\*Titre\*\*\s*:\s*\*\*([^*]+)\*\*/i);
  const titre = titreMatch ? titreMatch[1].trim() : '';

  // Extraction des caractéristiques
  const caracSection = text.match(/\*\*Caractéristiques\*\*\s*:([^\*]*?)(?=\*\*3 Façons|\*\*Idées Recettes|$)/is);
  const caracteristiques = [];
  
  if (caracSection) {
    const lines = caracSection[1].split('\n').filter(line => line.trim().startsWith('-'));
    const types = ['Apparence', 'Goût', 'Nutrition'];
    
    lines.forEach((line, index) => {
      const desc = line.replace(/^-\s*/, '').trim();
      if (desc) {
        caracteristiques.push({
          type: types[index] || 'Atout',
          description: desc
        });
      }
    });
  }

  // Extraction de la consommation
  const consoSection = text.match(/\*\*3 Façons de le Consommer\*\*\s*:([^\*]*?)(?=\*\*Idées Recettes|$)/is);
  const consommation = [];
  
  if (consoSection) {
    const lines = consoSection[1].split('\n').filter(line => line.trim().startsWith('-'));
    lines.forEach(line => {
      const suggestion = line.replace(/^-\s*/, '').trim();
      if (suggestion) {
        consommation.push(suggestion);
      }
    });
  }

  // Extraction des recettes
  const recettes = [];
  
  // Recette sucrée
  const sucreeMatch = text.match(/\*\*Sucrée\*\*\s*:\s*\*\*([^*]+?)\*\*\.\s*([^\*]+?)(?=\*\*Salée|\*\*$|$)/is);
  if (sucreeMatch) {
    const nom = sucreeMatch[1].trim();
    const description = sucreeMatch[2].trim();
    
    const ingredients = description.split('.')[0].trim();
    const astuceMatch = description.match(/Astuce\s*:\s*([^.]+)/i);
    const astuce = astuceMatch ? astuceMatch[1].trim() : 'Préparer avec soin pour un résultat optimal';
    
    recettes.push({
      type: 'Sucrée',
      nom: nom,
      ingredients: ingredients,
      astuce: astuce
    });
  }

  // Recette salée
  const saleeMatch = text.match(/\*\*Salée\*\*\s*:\s*\*\*([^*]+?)\*\*\.\s*([^\*]+?)(?=---|$)/is);
  if (saleeMatch) {
    const nom = saleeMatch[1].trim();
    const description = saleeMatch[2].trim();
    
    const ingredients = description.split('.')[0].trim();
    const astuceMatch = description.match(/Astuce\s*:\s*([^.]+)/i);
    const astuce = astuceMatch ? astuceMatch[1].trim() : 'Servir immédiatement pour une fraîcheur maximale';
    
    recettes.push({
      type: 'Salée',
      nom: nom,
      ingredients: ingredients,
      astuce: astuce
    });
  }

  // Générer un slogan si le titre contient un "–"
  let slogan = 'Un trésor de saveurs à découvrir';
  if (titre.includes('–')) {
    const parts = titre.split('–');
    slogan = parts[1] ? parts[1].trim() : slogan;
  }

  return { titre, slogan, caracteristiques, consommation, recettes };
}

/**
 * Fonction principale de parsing
 * @param {string} aiResponse - La réponse brute de l'IA
 * @returns {Object} - Objet avec success, pdfContent et debug
 */
function parseAIResponse(aiResponse) {
  try {
    const format = detectFormat(aiResponse);
    console.log(`Format détecté: ${format}`);
    
    let parsed;
    
    if (format === 'XML') {
      parsed = parseXML(aiResponse);
    } else {
      parsed = parseMarkdown(aiResponse);
    }

    // Validation et valeurs par défaut
    const pdfContent = {
      titre: parsed.titre || 'Produit Gourmand',
      slogan: parsed.slogan || 'Un trésor de saveurs à découvrir',
      caracteristiques: parsed.caracteristiques.length > 0 ? parsed.caracteristiques : [
        { type: "Apparence", description: "Un produit aux couleurs éclatantes et texture appétissante" },
        { type: "Goût", description: "Des saveurs authentiques qui réveillent les papilles" },
        { type: "Nutrition", description: "Riche en vitamines et nutriments essentiels" }
      ],
      consommation: parsed.consommation.length > 0 ? parsed.consommation : [
        'Nature, pour apprécier pleinement sa fraîcheur',
        'En salade composée avec des herbes aromatiques',
        'Cuisiné pour révéler tous ses arômes subtils'
      ],
      recettes: parsed.recettes.length > 0 ? parsed.recettes : [
        {
          type: 'Sucrée',
          nom: 'Délice fruité maison',
          ingredients: 'Produit frais, sucre de canne, vanille',
          astuce: 'Servir bien frais pour exalter les saveurs'
        },
        {
          type: 'Salée',
          nom: 'Plat savoureux et équilibré',
          ingredients: 'Produit frais, aromates, huile d\'olive',
          astuce: 'Laisser reposer quelques minutes avant de déguster'
        }
      ]
    };

    return {
      success: true,
      pdfContent: pdfContent,
      debug: {
        formatDetected: format,
        responseLength: aiResponse.length,
        parsedFields: {
          titre: !!parsed.titre,
          caracteristiques: parsed.caracteristiques.length,
          consommation: parsed.consommation.length,
          recettes: parsed.recettes.length
        }
      }
    };

  } catch (error) {
    console.error('Erreur de parsing:', error);
    
    return {
      success: false,
      error: 'Erreur lors du parsing de la réponse IA: ' + error.message,
      debug: {
        rawResponse: aiResponse.substring(0, 1000),
        errorStack: error.stack
      }
    };
  }
}

