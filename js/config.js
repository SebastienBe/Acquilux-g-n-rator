// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
  // 🔥 REMPLACEZ PAR VOTRE URL WEBHOOK N8N
  N8N_WEBHOOK_URL: 'https://n8n-seb.sandbox-jerem.com/webhook/fiche_produit',
  // URL pour récupérer la liste des badges disponibles (retourne un JSON)
  N8N_BADGE_LIST_URL: 'https://n8n-seb.sandbox-jerem.com/webhook/fiche_produit/badge/get',
  // URL pour obtenir une image de badge spécifique (utilise ?name= pour spécifier le badge)
  N8N_BADGE_IMAGE_URL: 'https://n8n-seb.sandbox-jerem.com/webhook/fiche_produit/badge',
  TIMEOUT: 30000 // 30 secondes
};
