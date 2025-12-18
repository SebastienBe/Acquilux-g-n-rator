// ========================================
// ÉLÉMENTS DOM
// ========================================
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const pdfPreview = document.getElementById('pdfPreview');
const downloadBtn = document.getElementById('downloadBtn');
const pageTitle = document.getElementById('pageTitle');

// ========================================
// CALLBACKS
// ========================================

// Callback de sélection badges (depuis BadgeManager)
function onBadgeSelectionChange(selected) {
  const names = Array.isArray(selected) ? selected : [];
  
  if (names.length > 0) {
    sessionStorage.setItem('badgeNames', JSON.stringify(names));
    sessionStorage.setItem('badgeName', names[0]); // compat
  } else {
    sessionStorage.removeItem('badgeNames');
    sessionStorage.removeItem('badgeName');
  }
  
  // Mettre à jour le compteur
  if (BadgeManager && BadgeManager.updateBadgeCount) {
    BadgeManager.updateBadgeCount(names.length);
  }
  
  // Régénérer la preview avec les nouveaux badges
  if (window.currentPdfContent) {
    window.currentPdfContent.badge = names[0] || '';
    window.currentPdfContent.badges = names;
    
    if (typeof generateHTML === 'function') {
      const html = generateHTML(window.currentPdfContent);
      
      if (typeof displayPreview === 'function') {
        displayPreview(html, window.currentProductName || '');
      }
    }
  }
}

// Ancien toggle : plus utilisé, on garde un stub pour compat
function updateBadgeVisibility() {}

// ========================================
// INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  loadPreview();
  setupEventListeners();
  setupDrawer();
  
  if (typeof BadgeManager !== 'undefined') {
    BadgeManager.loadBadges(onBadgeSelectionChange);
    if (typeof initBadgeLayoutControls === 'function') {
      initBadgeLayoutControls();
    }
    // Mettre à jour le compteur initial après un court délai pour laisser le temps au chargement
    setTimeout(() => {
      const initialBadges = BadgeManager.getBadgeNames();
      if (BadgeManager.updateBadgeCount) {
        BadgeManager.updateBadgeCount(initialBadges.length);
      }
    }, 100);
  }
});

function setupEventListeners() {
  downloadBtn.addEventListener('click', downloadPDF);
}

// ========================================
// GESTION DU DRAWER
// ========================================
function setupDrawer() {
  const drawer = document.getElementById('badgesDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerClose = document.getElementById('drawerClose');
  const badgesToggleBtn = document.getElementById('badgesToggleBtn');

  if (!drawer) return;

  // Vérifier si on est sur mobile
  const isMobile = window.innerWidth < 768;

  function openDrawer() {
    if (isMobile) {
      drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDrawer() {
    if (isMobile) {
      drawer.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      // Sur desktop aussi, on peut fermer
      drawer.classList.remove('active');
      drawer.style.display = 'none';
    }
  }
  
  function openDrawerDesktop() {
    drawer.classList.add('active');
    drawer.style.display = 'block';
  }

  // Bouton pour ouvrir/fermer le drawer (fonctionne sur mobile et desktop)
  if (badgesToggleBtn) {
    badgesToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isCurrentlyActive = drawer.classList.contains('active');
      
      if (isMobile) {
        // Sur mobile, toggle le drawer
        if (isCurrentlyActive) {
          closeDrawer();
        } else {
          openDrawer();
        }
      } else {
        // Sur desktop, toggle la visibilité du drawer
        if (isCurrentlyActive) {
          closeDrawer();
        } else {
          openDrawerDesktop();
        }
      }
    });
  }

  if (drawerClose) {
    drawerClose.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeDrawer();
    });
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  // Fermer avec Escape (mobile et desktop)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('active')) {
      closeDrawer();
    }
  });

  // Sur desktop, le drawer est fermé par défaut (l'utilisateur peut l'ouvrir avec le bouton)
  if (!isMobile) {
    drawer.classList.remove('active');
    drawer.style.display = 'none';
  }

  // Gérer le redimensionnement
  window.addEventListener('resize', () => {
    const nowMobile = window.innerWidth < 768;
    if (nowMobile !== isMobile) {
      // Recharger la page si on change de mode (optionnel, ou adapter le comportement)
      location.reload();
    }
  });
}

// ========================================
// INITIALISATION LAYOUT BADGES
// ========================================
async function initBadgeLayoutControls() {
  if (typeof BadgeManager !== 'undefined') {
    const badgeNames = getBadgeNamesArray();
    await BadgeManager.renderLayoutControls(badgeNames, pdfPreview);
    BadgeManager.applyLayouts(pdfPreview);
  }
}

