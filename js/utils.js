// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Affiche un loader avec un message
 * @param {HTMLElement} loader - Élément loader
 * @param {HTMLElement} loaderText - Élément texte du loader
 * @param {string} text - Message à afficher
 */
function showLoader(loader, loaderText, text) {
  loader.classList.add('active');
  if (loaderText) {
    loaderText.textContent = text;
  }
}

/**
 * Cache le loader
 * @param {HTMLElement} loader - Élément loader
 */
function hideLoader(loader) {
  loader.classList.remove('active');
}

/**
 * Affiche un message d'erreur
 * @param {HTMLElement} errorDiv - Élément d'erreur
 * @param {string} message - Message d'erreur
 */
function showError(errorDiv, message) {
  errorDiv.textContent = '❌ ' + message;
  errorDiv.classList.add('active');
}

/**
 * Cache le message d'erreur
 * @param {HTMLElement} errorDiv - Élément d'erreur
 */
function hideError(errorDiv) {
  errorDiv.classList.remove('active');
}

/**
 * Désactive le formulaire
 * @param {HTMLElement} submitBtn - Bouton de soumission
 * @param {HTMLElement} input - Champ de saisie
 */
function disableForm(submitBtn, input) {
  submitBtn.disabled = true;
  input.disabled = true;
}

/**
 * Active le formulaire
 * @param {HTMLElement} submitBtn - Bouton de soumission
 * @param {HTMLElement} input - Champ de saisie
 */
function enableForm(submitBtn, input) {
  submitBtn.disabled = false;
  input.disabled = false;
  input.focus();
}

/**
 * Valide le nom du produit
 * @param {string} productName - Nom du produit à valider
 * @returns {boolean} - True si valide
 */
function validateProductName(productName) {
  return /^[a-zA-ZÀ-ÿ\s'-]+$/.test(productName);
}

