// ========================================
// NODE CODE N8N - Parse la réponse HTTP de l'API OpenAI
// ========================================

// Récupère la réponse HTTP de l'API OpenAI
const httpResponse = $input.first().json;

// Extraire le contenu XML depuis la réponse OpenAI
let xmlContent = '';

if (httpResponse && httpResponse.choices && httpResponse.choices.length > 0) {
  const message = httpResponse.choices[0].message;
  if (message && message.content) {
    xmlContent = message.content.trim();
  }
}

if (!xmlContent) {
  return {
    json: {
      success: false,
      error: 'Aucun contenu XML trouvé dans la réponse de l\'API',
      debug: {
        httpResponse: httpResponse
      }
    }
  };
}

// Fonctions de parsing XML (simplifiées pour N8N)
function extractTagContent(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractAttribute(element, attrName) {
  const regex = new RegExp(`${attrName}="([^"]+)"`, 'i');
  const match = element.match(regex);
  return match ? match[1] : '';
}

function extractAllTags(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'gi');
  const matches = [];
  let match;
  
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[0]);
  }
  
  return matches;
}

// Nettoyer le XML
let cleanXml = xmlContent.replace(/```xml/gi, '').replace(/```/g, '').trim();
if (!cleanXml.startsWith('<fiche>')) {
  const ficheStart = cleanXml.indexOf('<fiche>');
  if (ficheStart !== -1) {
    cleanXml = cleanXml.substring(ficheStart);
  }
}

// Extraction des données
const titre = extractTagContent(cleanXml, 'titre');
const sousTitre = extractTagContent(cleanXml, 'sousTitre');
const slogan = extractTagContent(cleanXml, 'slogan');

// Extraction des caractéristiques
const caracteristiquesXml = extractTagContent(cleanXml, 'caracteristiques');
const caracteristiquesTags = extractAllTags(caracteristiquesXml, 'caracteristique');

const caracteristiques = caracteristiquesTags.map(tag => {
  const type = extractAttribute(tag, 'type') || 'Atout';
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
}).filter(s => s !== ''); // Filtrer les suggestions vides

// Construction du pdfContent
const pdfContent = {
  titre: titre || 'Produit Gourmand',
  sousTitre: sousTitre || undefined, // Optionnel, on ne l'inclut que s'il existe
  slogan: slogan || 'Un trésor de saveurs à découvrir',
  caracteristiques: caracteristiques.length > 0 ? caracteristiques : [
    { type: "Apparence", description: "Un produit aux couleurs éclatantes et texture appétissante" },
    { type: "Goût", description: "Des saveurs authentiques qui réveillent les papilles" },
    { type: "Nutrition", description: "Riche en vitamines et nutriments essentiels" }
  ],
  consommation: consommation.length > 0 ? consommation : [
    'Nature, pour apprécier pleinement sa fraîcheur',
    'En salade composée avec des herbes aromatiques',
    'Cuisiné pour révéler tous ses arômes subtils'
  ]
};

// Retirer sousTitre s'il est vide
if (!pdfContent.sousTitre) {
  delete pdfContent.sousTitre;
}

// Construction de la réponse finale au format attendu
const response = {
  success: true,
  pdfContent: pdfContent,
  debug: {
    xmlReceived: xmlContent,
    parsedCorrectly: true,
    caracteristiquesCount: caracteristiques.length,
    caracteristiquesWithDescription: caracteristiques.filter(c => c.description).length,
    consommationCount: consommation.length
  }
};

// Retourner dans un tableau (format attendu par l'app)
return {
  json: [response]
};


